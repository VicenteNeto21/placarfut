// ========== js/api.js ==========
// Comunicação Centralizada com a API — Multi-provedor (Flashscore + ESPN + SofaScore)

const FLASHSCORE_URL = '/api/flashscore';
const ESPN_AGREGADO_URL = '/api/espn-agregado';
const PROVEDORES_VALIDOS = ['flashscore', 'espn', 'sofascore'];
const COOLDOWN_SOFASCORE_MS = 120000;

let _provedorAtivo = 'flashscore';
let _provedorPreferido = localStorage.getItem('futlive_provedor') || 'auto';
let _sofaBlockedUntil = 0;
let _lastEventsCache = [];
let _lastFetchTime = 0;
let _lastFetchDate = '';
const _statusProvedores = {
    flashscore: { estado: 'unknown', atualizadoEm: null },
    espn: { estado: 'unknown', atualizadoEm: null },
    sofascore: { estado: 'unknown', atualizadoEm: null }
};

function isModoEspn() {
    return _provedorAtivo === 'espn';
}

function getProvedorAtivo() {
    return _provedorAtivo;
}

function getProvedorPreferido() {
    return _provedorPreferido;
}

function getStatusProvedores() {
    return _statusProvedores;
}

function definirProvedorPreferido(nome) {
    _provedorPreferido = PROVEDORES_VALIDOS.includes(nome) ? nome : 'auto';
    localStorage.setItem('futlive_provedor', _provedorPreferido);
    if (_provedorPreferido === 'sofascore') _sofaBlockedUntil = 0;
}

function registrarStatusProvedor(nome, ok) {
    _statusProvedores[nome] = { estado: ok ? 'ok' : 'fail', atualizadoEm: Date.now() };
}

function ordemProvedores() {
    if (_provedorPreferido === 'auto') return [...PROVEDORES_VALIDOS];
    return [_provedorPreferido, ...PROVEDORES_VALIDOS.filter(p => p !== _provedorPreferido)];
}

function guardarEventos(data) {
    if (data?.events && Array.isArray(data.events)) {
        _lastEventsCache = data.events;
        _lastFetchTime = Date.now();
    }
}

// 1. Flashscore (CDN Ninja rápida e sem captcha)
async function fetchFlashscore(endpoint) {
    const url = `${FLASHSCORE_URL}?path=${encodeURIComponent(endpoint)}&_t=${Date.now()}`;
    const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error(`Flashscore HTTP ${response.status}`);
    const data = await response.json();
    _provedorAtivo = 'flashscore';
    guardarEventos(data);
    return data;
}

// 2. ESPN Agregado (fallback gratuito e aberto)
async function fetchEspnAgregado(dateIso = '') {
    let targetDate = dateIso;
    if (!targetDate && typeof getDataComOffset === 'function') {
        const offset = typeof offsetDias !== 'undefined' ? offsetDias : 0;
        targetDate = getDataComOffset(offset).iso;
    }
    const dateParam = targetDate ? `&date=${encodeURIComponent(targetDate)}` : '';
    const url = `${ESPN_AGREGADO_URL}?_t=${Date.now()}${dateParam}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`ESPN Agregado HTTP ${response.status}`);
    const data = await response.json();
    _provedorAtivo = 'espn';
    _lastFetchDate = targetDate;
    guardarEventos(data);
    return data;
}

// 3. SofaScore (protegido por cooldown quando bloqueado)
async function fetchSofaScore(endpoint) {
    const url = `${BACKEND_URL}?path=${encodeURIComponent(endpoint)}&_t=${Date.now()}`;
    const response = await fetch(url, { headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' } });
    if (!response.ok) throw new Error(`SofaScore HTTP ${response.status}`);
    const data = await response.json();
    _provedorAtivo = 'sofascore';
    _sofaBlockedUntil = 0;
    return data;
}

function tentarProvedor(nome, endpoint) {
    if (nome === 'flashscore') return fetchFlashscore(endpoint);

    if (nome === 'espn') {
        if (!/scheduled-events|events\/live|category\/\d+\/scheduled/.test(endpoint)) {
            return Promise.reject(new Error('ESPN não cobre este endpoint'));
        }
        const requestedDate = endpoint.match(/(\d{4}-\d{2}-\d{2})/)?.[1] || '';
        return fetchEspnAgregado(requestedDate);
    }

    const forcado = _provedorPreferido === 'sofascore';
    if (!forcado && Date.now() < _sofaBlockedUntil) {
        return Promise.reject(new Error('SofaScore em cooldown (bloqueio 403)'));
    }
    return fetchSofaScore(endpoint).catch(error => {
        _sofaBlockedUntil = Date.now() + COOLDOWN_SOFASCORE_MS;
        throw error;
    });
}

function buscarEventoEmCache(eventId) {
    const base = (typeof cacheJogos !== 'undefined' && cacheJogos) ? cacheJogos : _lastEventsCache;
    return base.find(j => String(j.id) === String(eventId) || String(j.numericId) === String(eventId));
}

async function resolverEventoIndividual(endpoint) {
    const match = endpoint.match(/^event\/([a-zA-Z0-9_-]+)(\/.*)?$/);
    if (!match) return null;

    const [, eventId, subPath = ''] = match;
    if (subPath === '/incidents') return { incidents: [] };
    if (subPath === '/managers' || subPath === '/h2h') return {};
    if (subPath === '/shotmap') return { shotmap: [] };
    if (subPath.startsWith('/statistics')) return { statistics: [] };

    const jogo = buscarEventoEmCache(eventId);
    return jogo ? { event: jogo } : null;
}

function respostaVaziaParaTorneio(endpoint) {
    if (!/^unique-tournament\/|^team\//.test(endpoint)) return null;
    if (endpoint.endsWith('/seasons')) return { seasons: [] };
    if (endpoint.includes('/standings')) return { standings: [] };
    if (endpoint.includes('/top-players')) return { topPlayers: {} };
    if (endpoint.includes('/cuptrees')) return { cupTrees: [] };
    if (endpoint.includes('/rounds')) return { rounds: [] };
    if (endpoint.includes('/events/')) return { events: [] };
    return null;
}

/**
 * Busca resiliente: tenta cada provedor na ordem (preferido primeiro),
 * registra a saúde de cada um e cai para cache/respostas vazias quando necessário.
 */
async function fetchWithFallback(endpoint) {
    let lastError = null;

    for (const nome of ordemProvedores()) {
        try {
            const data = await tentarProvedor(nome, endpoint);
            registrarStatusProvedor(nome, true);
            return data;
        } catch (error) {
            lastError = error;
            if (!/não cobre|cooldown/.test(error.message)) registrarStatusProvedor(nome, false);
            console.warn(`[API] ${nome} falhou: ${error.message}`);
        }
    }

    const evento = await resolverEventoIndividual(endpoint);
    if (evento) return evento;

    const vazio = respostaVaziaParaTorneio(endpoint);
    if (vazio) return vazio;

    throw lastError || new Error('Nenhum provedor de dados respondeu com sucesso');
}
