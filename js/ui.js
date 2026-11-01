// ========== js/ui.js ==========
// Lógica de Renderização e Atualização do Painel de Administração

const NOMES_TORNEIOS_FIXOS = {
    325: "BRASILEIRÃO SÉRIE A", 390: "BRASILEIRÃO SÉRIE B", 1281: "BRASILEIRÃO SÉRIE C", 10326: "BRASILEIRÃO SÉRIE D",
    10257: "BRASILEIRÃO FEMININO A1", 373: "COPA DO BRASIL", 73: "COPA DO BRASIL",
    384: "COPA LIBERTADORES", 480: "COPA SUL-AMERICANA", 490: "RECOPA SUL-AMERICANA",
    1596: "COPA DO NORDESTE", 11620: "COPA DO NORDESTE", 
    33495: "COPA SUL-SUDESTE", 10158: "COPA VERDE", 17015: "COPA VERDE",
    851: "AMISTOSOS INTERNACIONAIS", 19280: "AMISTOSOS",
    19855: "CAMPEONATO CEARENSE SÉRIE B", 2503: "CAMPEONATO CEARENSE",
    7: "LIGA DOS CAMPEÕES", 679: "LIGA EUROPA",
    17: "LIGA INGLESA", 8: "CAMPEONATO ESPANHOL", 23: "SÉRIE A (ITÁLIA)", 35: "CAMPEONATO ALEMÃO", 34: "CAMPEONATO FRANCÊS"
};

// Alterna as abas (Auto / Manual)
function mudarAba(aba) {
    document.getElementById("tabAuto").classList.remove("active");
    document.getElementById("tabManual").classList.remove("active");
    document.getElementById("contentAuto").classList.remove("active");
    document.getElementById("contentManual").classList.remove("active");

    if (aba === 'auto') {
        document.getElementById("tabAuto").classList.add("active");
        document.getElementById("contentAuto").classList.add("active");
        modoAtual = 'auto';
    } else if (aba === 'manual') {
        document.getElementById("tabManual").classList.add("active");
        document.getElementById("contentManual").classList.add("active");
        modoAtual = 'manual';
    }
}

function toggleGiro() {
    giroAtivo = !giroAtivo;
    localStorage.setItem('futlive_giro_ativo', JSON.stringify(giroAtivo));
    renderizarBotaoGiro();
    
    // Notifica o broadcast
    if (typeof aplicarEstadoGiro === 'function') {
        aplicarEstadoGiro();
    }
}

function renderizarBotaoGiro() {
    const btn = document.getElementById("btnToggleGiro");
    const text = document.getElementById("btnGiroText");
    if (!btn || !text) return;

    btn.setAttribute("aria-pressed", String(giroAtivo));
    text.innerText = giroAtivo ? "Giro: ON" : "Giro: OFF";
}

// Navegação de Datas
function atualizarLabelData() {
    const { dateObj } = getDataComOffset(offsetDias);
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    const label = `${diasSemana[dateObj.getDay()]}, ${dateObj.getDate()} de ${meses[dateObj.getMonth()]}`;
    document.getElementById('dataLabel').textContent = label;
    const badge = document.getElementById('dataBadge');
    if (offsetDias === 0) {
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function mudarData(direcao) {
    offsetDias += direcao;
    cacheJogos = null; // Limpa cache ao mudar dia
    ultimoFetchCache = 0;
    atualizarLabelData();
    buscarJogosSofaScore();
}

let mostrarTodasLigas = false;

function toggleFiltroLigas(todas) {
    mostrarTodasLigas = todas;
    
    const btnMonitorado = document.getElementById("btnFilterMonitored");
    const btnAll = document.getElementById("btnFilterAll");
    
    if (todas) {
        btnAll.classList.add("bg-emerald-600", "text-white", "shadow-lg", "shadow-emerald-500/20");
        btnAll.classList.remove("text-gray-400", "hover:text-white");
        btnMonitorado.classList.remove("bg-emerald-600", "text-white", "shadow-lg", "shadow-emerald-500/20");
        btnMonitorado.classList.add("text-gray-400", "hover:text-white");
    } else {
        btnMonitorado.classList.add("bg-emerald-600", "text-white", "shadow-lg", "shadow-emerald-500/20");
        btnMonitorado.classList.remove("text-gray-400", "hover:text-white");
        btnAll.classList.remove("bg-emerald-600", "text-white", "shadow-lg", "shadow-emerald-500/20");
        btnAll.classList.add("text-gray-400", "hover:text-white");
    }
    
    if (cacheJogos) exibirJogosNaLista(cacheJogos);
}

function irParaHoje() {
    offsetDias = 0;
    cacheJogos = null;
    ultimoFetchCache = 0;
    atualizarLabelData();
    buscarJogosSofaScore();
}

// ========== GERENCIAMENTO DA MODAL DE CAMPEONATOS ==========

function getInfoTorneio(jogo) {
    const tornId = jogo.tournament?.uniqueTournament?.id || jogo.tournament?.id || 0;
    const nome = jogo.tournament?.name || jogo.tournament?.uniqueTournament?.name || 'Outros';
    return { tornId, nome };
}

function abrirModalTorneios() {
    document.getElementById('modalTorneios').classList.remove('hidden');
    renderizarListaTorneiosSalvos();
    popularSelectNovosTorneios();
}

function fecharModalTorneios() {
    document.getElementById('modalTorneios').classList.add('hidden');
}

function renderizarListaTorneiosSalvos() {
    const container = document.getElementById('listaTorneiosSalvos');
    
    // Lista de campeonatos fixos (que não podem ser removidos)
    // Lista de campeonatos fixos (que não podem ser removidos, apenas ocultos)
    const fixosAtivos = CAMPEONATOS_FIXOS_CODIGO.filter(id => !torneiosOcultos.includes(id));
    const fixosHtml = fixosAtivos.map(id => {
        const favorito = meusTorneios.find(t => t.id === id);
        let nome = favorito ? favorito.nome : NOMES_TORNEIOS_FIXOS[id] || `Torneio ID ${id}`;

        return `
        <div class="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl hover:bg-emerald-500/15 transition-all">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center p-1">
                    <img src="https://api.sofascore.app/api/v1/unique-tournament/${id}/image/dark" onerror="this.src='https://www.sofascore.com/static/images/placeholders/tournament.svg'" class="max-w-full max-h-full object-contain drop-shadow" />
                </div>
                <div>
                    <span class="font-bold text-xs text-gray-200 block">${nome}</span>
                    <span class="text-[9px] text-emerald-400 font-bold uppercase tracking-tight">Monitorado Automático</span>
                </div>
            </div>
            <button onclick="ocultarTorneioFixo(${id})" class="text-gray-500 hover:text-red-500 bg-white/5 hover:bg-red-500/10 w-8 h-8 rounded-lg flex items-center justify-center transition-all" title="Ocultar">
                <i class="fa-solid fa-eye-slash text-xs"></i>
            </button>
        </div>
        `;
    }).join('');

    // Lista de campeonatos manuais (que podem ser removidos)
    const manuaisFiltro = meusTorneios.filter(t => !CAMPEONATOS_FIXOS_CODIGO.includes(t.id));
    const manuaisHtml = manuaisFiltro.map(t => `
        <div class="flex items-center justify-between bg-white/5 border border-white/5 p-3 rounded-xl hover:bg-white/10 transition-colors">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center p-1">
                    <img src="https://api.sofascore.app/api/v1/unique-tournament/${t.id}/image/dark" onerror="this.src='https://www.sofascore.com/static/images/placeholders/tournament.svg'" class="max-w-full max-h-full object-contain drop-shadow" />
                </div>
                <span class="font-bold text-sm text-gray-200">${t.nome}</span>
            </div>
            <button onclick="removerTorneio(${t.id})" class="text-gray-500 hover:text-red-500 bg-white/5 hover:bg-red-500/10 w-8 h-8 rounded-lg flex items-center justify-center transition-all" title="Remover">
                <i class="fa-solid fa-trash text-xs"></i>
            </button>
        </div>
    `).join('');

    // Lista de Ocultos para permitir restaurar
    let ocultosHtml = "";
    if (torneiosOcultos.length > 0) {
        ocultosHtml = torneiosOcultos.map(id => {
            const nome = NOMES_TORNEIOS_FIXOS[id] || `Torneio ID ${id}`;
            return `
            <div class="flex items-center justify-between bg-gray-800/50 border border-white/5 p-2 rounded-xl opacity-60">
                <div class="text-[10px] font-bold text-gray-400 pl-2">${nome}</div>
                <button onclick="restaurarTorneioFixo(${id})" class="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 px-2 py-1 rounded text-[10px] font-black uppercase transition-all">
                    Restaurar
                </button>
            </div>
            `;
        }).join('');
    }

    container.innerHTML = `
        <div class="space-y-3">
            <div class="text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest pl-1">Principais Monitorados</div>
            ${fixosHtml || '<div class="text-center py-2 text-xs text-gray-600">Nenhum monitorado ativo</div>'}
            
            ${manuaisFiltro.length > 0 ? `<div class="text-[10px] font-black uppercase text-gray-500 mt-6 mb-2 tracking-widest pl-1">Seus Favoritos</div>` : ''}
            ${manuaisHtml}

            ${torneiosOcultos.length > 0 ? `
                <div class="text-[10px] font-black uppercase text-gray-500 mt-8 mb-2 tracking-widest pl-1">Ocultados</div>
                <div class="space-y-2">
                    ${ocultosHtml}
                </div>
            ` : ''}
        </div>
    `;
}

function ocultarTorneioFixo(id) {
    if (!torneiosOcultos.includes(id)) {
        torneiosOcultos.push(id);
        salvarTorneiosOcultos();
        renderizarListaTorneiosSalvos();
        
        cacheJogos = null;
        ultimoFetchCache = 0;
        buscarJogosSofaScore();
    }
}

function restaurarTorneioFixo(id) {
    torneiosOcultos = torneiosOcultos.filter(x => x !== id);
    salvarTorneiosOcultos();
    renderizarListaTorneiosSalvos();
    
    cacheJogos = null;
    ultimoFetchCache = 0;
    buscarJogosSofaScore();
}

function popularSelectNovosTorneios() {
    const select = document.getElementById('selectNovosTorneios');

    // Extrair torneios únicos de todos os eventos do dia (ignorando "brazil" que já vem nativo)
    const mapUnicos = new Map();
    todosEventosGlobaisParaFiltro.forEach(jogo => {
        const { tornId, nome } = getInfoTorneio(jogo);
        const catSlug = jogo.tournament?.category?.slug || '';

        if (tornId && nome) {
            // Se não for um fixo e não estiver nos favoritos, permite adicionar
            if (!CAMPEONATOS_FIXOS_CODIGO.includes(tornId) && !meusTorneios.some(t => t.id === tornId)) {
                mapUnicos.set(tornId, nomeCampeonatoExibicao(tornId, nome));
            }
        }
    });

    const torneiosOrdenados = Array.from(mapUnicos.entries())
        .map(([id, nome]) => ({ id, nome }))
        .sort((a, b) => a.nome.localeCompare(b.nome));

    if (torneiosOrdenados.length === 0) {
        select.innerHTML = '<option value="">(Nenhum outro campeonato disponível hoje)</option>';
        return;
    }

    select.innerHTML = '<option value="">-- Escolha um campeonato --</option>' +
        torneiosOrdenados.map(t => `<option value="${t.id}">${t.nome}</option>`).join('');
}

function adicionarTorneioSelecionado() {
    const select = document.getElementById('selectNovosTorneios');
    const selectedOpt = select.options[select.selectedIndex];

    if (!selectedOpt || !selectedOpt.value) return;

    const id = parseInt(selectedOpt.value);
    const nome = selectedOpt.text;

    if (!meusTorneios.some(t => t.id === id)) {
        meusTorneios.push({ id, nome });
        salvarMeusTorneios();
        renderizarListaTorneiosSalvos();
        popularSelectNovosTorneios(); 

        cacheJogos = null;
        ultimoFetchCache = 0;
        buscarJogosSofaScore();
    }
}

async function adicionarTorneioPorIdManual() {
    const input = document.getElementById('inputTorneioIdManual');
    const id = parseInt(input.value);
    if (!id || isNaN(id)) {
        alert("Digite um ID válido (ex: 17015 para Champions)");
        return;
    }

    if (meusTorneios.some(t => t.id === id)) {
        alert("Este campeonato já foi adicionado.");
        input.value = "";
        return;
    }

    // Tenta buscar o nome do campeonato via API para ficar bonitinho
    const btn = event.target;
    const originalText = btn.innerText;
    btn.innerText = "Buscando...";
    btn.disabled = true;

    try {
        const data = await fetchWithFallback(`unique-tournament/${id}`);
        const nomeApi = data.uniqueTournament?.name || `Torneio ID ${id}`;
        const nome = nomeCampeonatoExibicao(id, nomeApi, nomeApi).toUpperCase();

        meusTorneios.push({ id, nome });
        salvarMeusTorneios();
        renderizarListaTorneiosSalvos();
        input.value = "";
        
        cacheJogos = null;
        ultimoFetchCache = 0;
        buscarJogosSofaScore();
    } catch (e) {
        alert("Não foi possível encontrar este Torneio. Verifique o ID.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

function removerTorneio(id) {
    meusTorneios = meusTorneios.filter(t => t.id !== id);
    salvarMeusTorneios();
    renderizarListaTorneiosSalvos();
    popularSelectNovosTorneios(); 

    // Força recarregar jogos
    cacheJogos = null;
    ultimoFetchCache = 0;
    buscarJogosSofaScore();
}

async function buscarPartidaPorIdManual() {
    const input = document.getElementById('inputPartidaIdManual');
    const id = parseInt(input.value);
    if (!id || isNaN(id)) {
        alert("Digite um ID de Partida válido (ex: 1234567)");
        return;
    }

    const btn = event.target;
    const originalText = btn.innerText;
    btn.innerText = "Buscando...";
    btn.disabled = true;

    try {
        const data = await fetchWithFallback(`event/${id}`);
        if (!data || !data.event) throw new Error("Partida não encontrada ou ID inválido.");
        
        const jogo = data.event;
        
        // Garante que o jogo está no cache para exibição
        if (!cacheJogos) cacheJogos = [];
        const idxExistente = cacheJogos.findIndex(j => j.id === jogo.id);
        if (idxExistente === -1) {
            cacheJogos.unshift(jogo);
        } else {
            cacheJogos[idxExistente] = jogo;
        }

        // Inicia a transmissão automaticamente
        if (typeof iniciarTransmissaoSofaScore === 'function') {
            iniciarTransmissaoSofaScore(jogo.id);
            fecharModalTorneios();
            input.value = "";
            exibirJogosNaLista(cacheJogos);
        } else {
            throw new Error("Sistema de transmissão não inicializado.");
        }

    } catch (error) {
        console.error(error);
        alert("Erro: " + error.message);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// Fechar modal ao clicar fora
window.addEventListener('click', (e) => {
    const modal = document.getElementById('modalTorneios');
    if (e.target === modal) fecharModalTorneios();
});

function formatarHoraStatus(timestamp) {
    if (!timestamp) return '--:--:--';
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: APP_TIMEZONE
    });
}

function renderizarStatusOperacional() {
    const healthEl = document.getElementById('systemHealth');
    const dotEl = document.getElementById('systemHealthDot');
    const lastEl = document.getElementById('lastUpdateDisplay');
    const sourceEl = document.getElementById('dataSourceDisplay');
    const errorPanel = document.getElementById('systemErrorPanel');
    const errorMsg = document.getElementById('systemErrorMessage');
    const estado = { ok: 'is-ok', warn: 'is-warn', error: 'is-error' }[ultimoStatusSistema.tipo] || '';

    if (healthEl) {
        healthEl.textContent = ultimoStatusSistema.mensagem || 'Aguardando';
        healthEl.title = ultimoStatusSistema.mensagem || '';
        healthEl.className = `telemetry-value ${estado}`.trim();
    }
    if (dotEl) dotEl.className = `telemetry-dot ${estado}`.trim();

    if (lastEl) lastEl.textContent = formatarHoraStatus(ultimoStatusSistema.atualizadoEm);
    if (sourceEl) sourceEl.textContent = ultimoStatusSistema.origem || 'Sem carga';

    if (errorPanel && errorMsg) {
        if (ultimoStatusSistema.tipo === 'error') {
            errorPanel.classList.remove('hidden');
            errorMsg.textContent = ultimoStatusSistema.mensagem || 'Falha desconhecida.';
        } else {
            errorPanel.classList.add('hidden');
        }
    }
}

// ========== SELETOR DE PROVEDOR ==========
const OPCOES_PROVEDOR = [
    { id: 'auto', nome: 'Automático', detalhe: 'Flashscore → ESPN → SofaScore' },
    { id: 'flashscore', nome: 'Flashscore', detalhe: 'Cobertura ampla, sem captcha' },
    { id: 'espn', nome: 'ESPN', detalhe: 'Principais ligas' },
    { id: 'sofascore', nome: 'SofaScore', detalhe: 'Pode estar bloqueado (403)' }
];
const ROTULO_ESTADO_PROVEDOR = { ok: 'Online', fail: 'Falhou', unknown: '—' };

function renderizarMenuProvedor() {
    const menu = document.getElementById('providerMenu');
    if (!menu) return;

    const status = typeof getStatusProvedores === 'function' ? getStatusProvedores() : {};
    const preferido = typeof getProvedorPreferido === 'function' ? getProvedorPreferido() : 'auto';

    menu.innerHTML = OPCOES_PROVEDOR.map(op => {
        const estado = status[op.id]?.estado || 'unknown';
        const classeEstado = op.id === 'auto' ? '' : `is-${estado}`;
        const rotulo = op.id === 'auto' ? '' : ROTULO_ESTADO_PROVEDOR[estado];
        return `
            <button type="button" role="menuitemradio" aria-checked="${op.id === preferido}" class="provider-option"
                onclick="escolherProvedor('${op.id}')">
                <span>${op.nome}<small>${op.detalhe}</small></span>
                <span class="provider-state ${classeEstado}">${rotulo}</span>
            </button>`;
    }).join('');
}

function fecharMenuProvedor() {
    document.getElementById('providerMenu')?.classList.add('hidden');
    document.getElementById('providerButton')?.setAttribute('aria-expanded', 'false');
}

function toggleMenuProvedor(event) {
    event?.stopPropagation();
    const menu = document.getElementById('providerMenu');
    if (!menu) return;

    const abrir = menu.classList.contains('hidden');
    if (abrir) renderizarMenuProvedor();
    menu.classList.toggle('hidden', !abrir);
    document.getElementById('providerButton')?.setAttribute('aria-expanded', String(abrir));
}

function escolherProvedor(id) {
    definirProvedorPreferido(id);
    fecharMenuProvedor();
    cacheJogos = null;
    ultimoFetchCache = 0;
    buscarJogosSofaScore(true);
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('#providerMenu') && !e.target.closest('#providerButton')) fecharMenuProvedor();
});

// ========== BUSCA E FILTROS DE STATUS ==========
function normalizarTexto(texto) {
    return String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

let _timerBusca = null;

function aoDigitarBusca(valor) {
    termoBuscaJogos = valor;
    document.getElementById('btnLimparBusca')?.classList.toggle('hidden', !valor);
    clearTimeout(_timerBusca);
    _timerBusca = setTimeout(() => {
        if (cacheJogos) exibirJogosNaLista(cacheJogos);
    }, 120);
}

function limparBusca() {
    const input = document.getElementById('buscaJogos');
    if (input) {
        input.value = '';
        input.focus();
    }
    aoDigitarBusca('');
}

function definirFiltroStatus(filtro) {
    filtroStatusJogos = filtro;
    if (cacheJogos) exibirJogosNaLista(cacheJogos);
    else atualizarChipsStatus();
}

function categoriaStatusJogo(jogo) {
    if (isJogoAoVivo(jogo)) return 'aovivo';
    if (jogo.status?.code === 100 || jogo.status?.type === 'finished') return 'encerrados';
    return 'iniciar';
}

function atualizarChipsStatus(contagem = {}) {
    const ids = { todos: 'countTodos', aovivo: 'countAoVivo', iniciar: 'countIniciar', encerrados: 'countEncerrados' };
    Object.entries(ids).forEach(([chave, id]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = contagem[chave] ?? 0;
    });
    document.querySelectorAll('#statusChips .status-chip').forEach(chip => {
        const ativo = chip.dataset.filtro === filtroStatusJogos;
        chip.classList.toggle('active', ativo);
        chip.setAttribute('aria-pressed', String(ativo));
    });
}

function jogoCombinaComBusca(jogo, termo) {
    if (!termo) return true;
    const alvo = normalizarTexto([
        jogo.homeTeam?.name, jogo.homeTeam?.shortName,
        jogo.awayTeam?.name, jogo.awayTeam?.shortName,
        traduzirNomeEquipe(jogo.homeTeam?.name), traduzirNomeEquipe(jogo.awayTeam?.name),
        jogo.tournament?.name, jogo.tournament?.fullName
    ].filter(Boolean).join(' '));
    return termo.split(/\s+/).every(parte => alvo.includes(parte));
}

function setAtualizando(ativo) {
    const btn = document.getElementById('btnAtualizarJogos');
    const icon = document.getElementById('iconAtualizarJogos');
    if (btn) btn.disabled = ativo;
    if (icon) icon.classList.toggle('fa-spin', ativo);
}

document.addEventListener('keydown', (e) => {
    const input = document.getElementById('buscaJogos');
    if (!input) return;

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        const painelVisivel = document.getElementById('painelAdmin')?.style.display !== 'none';
        if (!painelVisivel) return;
        e.preventDefault();
        input.focus();
        input.select();
    } else if (e.key === 'Escape') {
        if (document.activeElement === input && input.value) limparBusca();
        else if (document.activeElement === input) input.blur();
        fecharMenuProvedor();
    }
});

function atualizarStatusOperacional(tipo, mensagem, origem = 'live') {
    ultimoStatusSistema = {
        tipo,
        mensagem,
        atualizadoEm: Date.now(),
        origem
    };
    renderizarStatusOperacional();
}

function salvarFallbackEventos(dataSelecionada, eventos) {
    try {
        localStorage.setItem(`futlive_fallback_${dataSelecionada}`, JSON.stringify({
            timestamp: Date.now(),
            eventos
        }));
    } catch (e) {}
}

function carregarFallbackEventos(dataSelecionada) {
    try {
        const raw = localStorage.getItem(`futlive_fallback_${dataSelecionada}`);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

// ========== BUSCA DE JOGOS E PROCESSO DE UI ==========
async function buscarJogosSofaScore(forcar = true) {
    setAtualizando(true);
    try {
        await executarBuscaJogos(forcar);
    } finally {
        setAtualizando(false);
    }
}

async function executarBuscaJogos(forcar) {
    const painelStatus = document.getElementById("statusPainel");
    const listaDiv = document.getElementById("listaDeJogos");

    if (!forcar && cacheJogos && (Date.now() - ultimoFetchCache) < CACHE_TTL) {
        exibirJogosNaLista(cacheJogos);
        atualizarStatusOperacional('warn', 'Exibindo cache em memória.', 'cache local');
        painelStatus.innerHTML = `<i class="fa-solid fa-box text-blue-400"></i> Cache: atualizado há ${Math.floor((Date.now() - ultimoFetchCache) / 1000)}s`;
        return;
    }

    painelStatus.innerHTML = '<span class="loading-spinner"></span> Buscando jogos do dia...';
    listaDiv.innerHTML = '<div class="text-center text-gray-400 py-12"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p class="mt-3 text-sm">Carregando partidas...</p></div>';

    try {
        const { iso: dataSelecionada } = getDataComOffset(offsetDias);
        
        // 1. Busca Global (Top Eventos) — Flashscore (primário) / ESPN (fallback)
        const data = await fetchWithFallback(`sport/football/scheduled-events/${dataSelecionada}`);
        let todosEventos = data.events || [];

        // Quando dados vêm de provedores agregados (Flashscore ou ESPN), não precisamos de chamadas secundárias
        const usandoAgregado = isModoEspn() || todosEventos.some(e => e._source === 'flashscore' || e._source === 'espn');

        // 2. Busca Específica Brasil — apenas se estiver em provedor raw SofaScore
        const tornIdsBrasil = new Set();
        if (!usandoAgregado) {
            try {
                const brazilData = await fetchWithFallback(`category/13/scheduled-events/${dataSelecionada}`);
                if (brazilData.events) {
                    brazilData.events.forEach(brEv => {
                        const { tornId } = getInfoTorneio(brEv);
                        if (tornId) tornIdsBrasil.add(tornId);
                        if (!todosEventos.some(e => e.id === brEv.id)) {
                            todosEventos.push(brEv);
                        }
                    });
                }
            } catch (eb) { console.error('Erro ao buscar feed extra Brasil:', eb); }
        } else {
            // Em feeds agregados, mapeia os IDs de torneios presentes
            todosEventos.forEach(ev => {
                const { tornId } = getInfoTorneio(ev);
                if (tornId) tornIdsBrasil.add(tornId);
            });
        }

        // 3. Mesclar Live Global se for Hoje — apenas no modo SofaScore
        if (offsetDias === 0 && !usandoAgregado) {
            try {
                const liveData = await fetchWithFallback('sport/football/events/live');
                if (liveData.events) {
                    liveData.events.forEach(liveEv => {
                        const idx = todosEventos.findIndex(e => e.id === liveEv.id);
                        if (idx !== -1) {
                            todosEventos[idx] = liveEv;
                        } else {
                            todosEventos.push(liveEv);
                        }
                    });
                }
            } catch (e) { console.error('Erro ao mesclar jogos ao vivo extras:', e); }
        }

        todosEventosGlobaisParaFiltro = todosEventos;

        // Filtrar
        cacheJogos = todosEventos.filter(j => {
            // Filtro de Data Local para evitar jogos de "ontem" ou "amanhã" em fusos divergentes
            const dataEventoLocal = new Date(j.startTimestamp * 1000).toLocaleDateString('en-CA', { timeZone: APP_TIMEZONE });
            if (dataEventoLocal !== dataSelecionada) return false;

            const { tornId } = getInfoTorneio(j);
            const ehFavoritoMenu = meusTorneios.some(t => t.id === tornId);
            const ehFixoNoCodigo = CAMPEONATOS_FIXOS_CODIGO.includes(tornId) && !torneiosOcultos.includes(tornId);
            const ehPaisBrasil = j.tournament?.country === 'Brazil' || (j.tournament?.fullName && j.tournament.fullName.toUpperCase().includes('BRAZIL'));
            const ehBrasilFeed = tornIdsBrasil.has(tornId) || ehPaisBrasil;
            
            if (torneiosOcultos.includes(tornId)) return false;
            return ehFavoritoMenu || ehFixoNoCodigo || ehBrasilFeed;
        });

        // Ordenar
        cacheJogos.sort((a, b) => {
            const aLive = isJogoAoVivo(a);
            const bLive = isJogoAoVivo(b);
            if (aLive && !bLive) return -1;
            if (!aLive && bLive) return 1;
            return (a.startTimestamp || 0) - (b.startTimestamp || 0);
        });
        ultimoFetchCache = Date.now();
        salvarFallbackEventos(dataSelecionada, cacheJogos);

        if (cacheJogos.length > 0) {
            const provedor = typeof getProvedorAtivo === 'function' ? getProvedorAtivo() : 'live';
            const origemLabel = provedor === 'flashscore' ? 'flashscore live' : (provedor === 'espn' ? 'espn fallback' : 'sofascore live');
            atualizarStatusOperacional('ok', 'API online e dados sincronizados.', origemLabel);
            exibirJogosNaLista(cacheJogos);
            painelStatus.innerHTML = '';
        } else {
            atualizarChipsStatus();
            painelStatus.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-yellow-400"></i> Nenhum jogo programado para esta data.`;
            listaDiv.innerHTML = '<div class="text-center text-gray-400 py-12"><i class="fa-solid fa-futbol fa-2x mb-3"></i><p>Nenhuma partida programada para esta data</p></div>';
            atualizarStatusOperacional('warn', 'Consulta concluída sem jogos para a data.', 'sofascore live');
        }
    } catch (error) {
        console.error(error);
        const { iso: dataSelecionada } = getDataComOffset(offsetDias);
        const fallback = carregarFallbackEventos(dataSelecionada);
        if (fallback?.eventos?.length) {
            cacheJogos = fallback.eventos;
            ultimoFetchCache = fallback.timestamp || Date.now();
            exibirJogosNaLista(cacheJogos);
            painelStatus.innerHTML = `<i class="fa-solid fa-database text-amber-300"></i> Falha na API. Exibindo fallback salvo de ${formatarHoraStatus(fallback.timestamp)}.`;
            atualizarStatusOperacional('warn', `API indisponível. Fallback carregado (${error.message}).`, 'fallback salvo');
            return;
        }
        painelStatus.innerHTML = `<i class="fa-solid fa-circle-xmark text-red-400"></i> Erro: ${error.message}`;
        atualizarStatusOperacional('error', `Falha ao consultar a API: ${error.message}`, 'sem fallback');
        listaDiv.innerHTML = `
            <div class="bg-red-900/30 border border-red-800 p-6 rounded-xl text-center">
                <p class="text-red-400 font-bold mb-2"><i class="fa-solid fa-ban"></i> Falha na conexão</p>
                <p class="text-sm text-gray-300">Verifique se o backend está rodando corretamente.</p>
                <button onclick="buscarJogosSofaScore(true)" class="mt-4 bg-red-600 hover:bg-red-500 px-4 py-2 rounded text-sm font-bold"><i class="fa-solid fa-rotate-right"></i> Tentar Novamente</button>
            </div>
        `;
    }
}

function jogoEhMonitorado(jogo) {
    const { tornId } = getInfoTorneio(jogo);
    const isFixo = CAMPEONATOS_FIXOS_CODIGO.includes(tornId);
    const isFavorito = meusTorneios.some(t => t.id === tornId);
    if (isFixo || isFavorito || jogo._source === 'espn') return true;

    const ehBrasil = jogo.tournament?.country === 'Brazil'
        || (jogo.tournament?.fullName || '').toUpperCase().includes('BRAZIL');
    return jogo._source === 'flashscore' && ehBrasil;
}

function limparFiltrosLista() {
    filtroStatusJogos = 'todos';
    const input = document.getElementById('buscaJogos');
    if (input) input.value = '';
    aoDigitarBusca('');
}

function renderizarListaVazia(listaDiv, temJogosNoDia) {
    const filtrando = termoBuscaJogos.trim() || filtroStatusJogos !== 'todos';
    const titulo = temJogosNoDia && filtrando ? 'Nenhum jogo corresponde aos filtros' : 'Nenhuma partida nesta seleção';
    const dica = temJogosNoDia && filtrando
        ? 'Ajuste a busca ou o status. Em "Monitorado", só campeonatos favoritos aparecem — tente "Ver Tudo".'
        : 'Tente outra data ou use "Ver Tudo" para incluir todos os campeonatos.';
    const acao = temJogosNoDia && filtrando
        ? '<button onclick="limparFiltrosLista()" class="mt-4 btn-ghost-action !h-10"><i class="fa-solid fa-filter-circle-xmark"></i> Limpar filtros</button>'
        : '';

    listaDiv.innerHTML = `
        <div class="text-center text-gray-400 py-14">
            <i class="fa-solid fa-futbol fa-2x mb-3 text-slate-600"></i>
            <p class="font-bold text-slate-300">${titulo}</p>
            <p class="text-sm mt-1 max-w-md mx-auto">${dica}</p>
            ${acao}
        </div>`;
}

function exibirJogosNaLista(jogos) {
    const listaDiv = document.getElementById("listaDeJogos");
    listaDiv.innerHTML = "";

    const termo = normalizarTexto(termoBuscaJogos);
    const noEscopo = jogos.filter(j => mostrarTodasLigas || jogoEhMonitorado(j));
    const buscados = noEscopo.filter(j => jogoCombinaComBusca(j, termo));

    const contagem = { todos: buscados.length, aovivo: 0, iniciar: 0, encerrados: 0 };
    buscados.forEach(j => contagem[categoriaStatusJogo(j)]++);
    atualizarChipsStatus(contagem);

    const visiveis = filtroStatusJogos === 'todos'
        ? buscados
        : buscados.filter(j => categoriaStatusJogo(j) === filtroStatusJogos);

    if (visiveis.length === 0) {
        renderizarListaVazia(listaDiv, jogos.length > 0);
        return;
    }

    const grupos = {};
    visiveis.forEach(jogo => {
        const { tornId, nome: tornNome } = getInfoTorneio(jogo);
        const key = tornId ? String(tornId) : tornNome;
        if (!grupos[key]) {
            grupos[key] = {
                nome: nomeCampeonatoExibicao(tornId, tornNome),
                id: tornId,
                logo: jogo.tournament?.logo || '',
                jogos: []
            };
        }
        grupos[key].jogos.push(jogo);
    });

    Object.values(grupos).forEach(grupo => {
        const secao = document.createElement("div");
        secao.className = "mb-4";

        const logoTorneio = grupo.logo || (grupo.id ? sofaImg(`unique-tournament/${grupo.id}/image`) : '');
        const aoVivoNoGrupo = grupo.jogos.filter(j => isJogoAoVivo(j)).length;

        const isFixo = CAMPEONATOS_FIXOS_CODIGO.includes(grupo.id);
        const corTextoTitulo = isFixo ? 'text-emerald-400' : 'text-slate-200';
        const badgeFixo = isFixo ? `<span class="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold ml-1.5">DESTAQUE</span>` : '';

        secao.innerHTML = `
            <div class="flex items-center justify-between py-1.5 px-1 text-xs font-bold text-slate-400 border-b border-slate-800/80 mb-2">
                <div class="flex items-center gap-2.5 min-w-0">
                    <div class="competition-badge ${logoTorneio ? '' : 'is-empty'}">
                        ${logoTorneio 
                            ? `<img src="${logoTorneio}" class="competition-logo" alt="${escapeHTML(grupo.nome)}" onerror="this.parentElement.className='competition-badge is-empty'; this.parentElement.innerHTML='<i class=\\'fa-solid fa-trophy text-amber-500 text-[10px]\\'></i>';">` 
                            : '<i class="fa-solid fa-trophy text-amber-500 text-[10px]"></i>'}
                    </div>
                    <span class="text-slate-200 uppercase tracking-wide text-xs truncate">${escapeHTML(grupo.nome)}</span>
                    ${badgeFixo}
                    ${aoVivoNoGrupo > 0 ? `<span class="text-[10px] text-red-400 font-bold ml-1 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> ${aoVivoNoGrupo} ao vivo</span>` : ''}
                </div>
                <span class="text-slate-500 text-[11px] font-normal shrink-0">${grupo.jogos.length} ${grupo.jogos.length > 1 ? 'jogos' : 'jogo'}</span>
            </div>
        `;

        const grid = document.createElement("div");
        grid.className = "grid grid-cols-1 xl:grid-cols-2 gap-2";

        grupo.jogos.forEach(jogo => {
            const isLive = isJogoAoVivo(jogo);
            const isNaoIniciado = (jogo.status?.code === 0 || jogo.status?.type === 'notstarted');
            const isIntervalo = (jogo.status?.code === 31 || jogo.status?.description === 'Halftime');
            const isEncerrado = (jogo.status?.code === 100 || jogo.status?.type === 'finished');
            const isAtivoNoObs = (typeof jogoSelecionadoId !== 'undefined' && jogoSelecionadoId === jogo.id);

            let horario = '';
            if (jogo.startTimestamp) {
                const dt = new Date(jogo.startTimestamp * 1000);
                horario = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            }

            // Cálculo exato e real do minuto e segundo de jogo baseado em AO (início do período atual)
            let tempoLiveStr = '';
            let tempoExtraAttr = '';
            if (isLive) {
                let aoTs = jogo.time?.currentPeriodStartTimestamp || 0;
                let isSecondHalf = (jogo.status?.code === 7 || jogo.status?.code === 13 || jogo.status?.description === '2nd half');
                let nowSec = Math.floor(Date.now() / 1000);
                let minNumber = 1;
                let secNumber = 0;

                if (aoTs > 0) {
                    let elapsed = Math.max(0, nowSec - aoTs);
                    let m = Math.floor(elapsed / 60);
                    minNumber = isSecondHalf ? (45 + m) : m;
                    secNumber = elapsed % 60;
                } else if (jogo.statusTime?.current) {
                    minNumber = jogo.statusTime.current;
                }
                tempoLiveStr = `${minNumber}:${String(secNumber).padStart(2, '0')}`;
                tempoExtraAttr = `data-tempo-jogo="true" data-ts="${aoTs}" data-code="${jogo.status?.code || 6}"`;
            }

            let statusHtml = '';
            if (isLive) {
                statusHtml = `<span class="status-live-badge"><span class="live-dot"></span><span ${tempoExtraAttr}>${tempoLiveStr}</span></span>`;
            } else if (isIntervalo) {
                statusHtml = `<span class="status-int-badge">INT</span>`;
            } else if (isEncerrado) {
                statusHtml = `<span class="status-end-badge">FIM</span>`;
            } else {
                statusHtml = `<span class="status-time-badge">${horario || '--:--'}</span>`;
            }

            let golsC = isNaoIniciado ? '-' : (jogo.homeScore?.current ?? '-');
            let golsF = isNaoIniciado ? '-' : (jogo.awayScore?.current ?? '-');
            let logoC = jogo.homeTeam.logo || jogo.homeTeam._espnLogo || sofaImg(`team/${jogo.homeTeam.id}/image`);
            let logoF = jogo.awayTeam.logo || jogo.awayTeam._espnLogo || sofaImg(`team/${jogo.awayTeam.id}/image`);

            const nomeCasa = traduzirNomeEquipe(jogo.homeTeam.name || jogo.homeTeam.shortName || 'Mandante');
            const nomeFora = traduzirNomeEquipe(jogo.awayTeam.name || jogo.awayTeam.shortName || 'Visitante');

            const casaGanhando = !isNaoIniciado && golsC !== '-' && golsF !== '-' && Number(golsC) > Number(golsF);
            const foraGanhando = !isNaoIniciado && golsC !== '-' && golsF !== '-' && Number(golsF) > Number(golsC);

            const btn = document.createElement("button");
            btn.type = 'button';
            btn.className = `match-item group ${isFixo ? 'is-highlight' : ''} ${isLive ? 'is-live' : ''} ${isAtivoNoObs ? 'is-active-obs' : ''}`;
            btn.setAttribute('title', `Transmitir no OBS: ${nomeCasa} vs ${nomeFora}`);
            btn.setAttribute('aria-label', `${nomeCasa} versus ${nomeFora}`);

            btn.innerHTML = `
                <div class="match-status-col">
                    ${statusHtml}
                </div>
                <div class="match-col-divider"></div>
                <div class="match-teams-col">
                    <div class="team-row">
                        <div class="team-info">
                            <img src="${logoC}" onerror="this.src='https://www.sofascore.com/static/images/placeholders/team.svg'" referrerpolicy="no-referrer" class="team-crest" alt="${escapeHTML(nomeCasa)}">
                            <span class="team-name ${casaGanhando ? 'font-bold text-white' : 'text-slate-200'}">${escapeHTML(nomeCasa)}</span>
                        </div>
                        <span class="team-score ${casaGanhando ? 'text-white' : 'text-slate-400'}">${golsC}</span>
                    </div>
                    <div class="team-row">
                        <div class="team-info">
                            <img src="${logoF}" onerror="this.src='https://www.sofascore.com/static/images/placeholders/team.svg'" referrerpolicy="no-referrer" class="team-crest" alt="${escapeHTML(nomeFora)}">
                            <span class="team-name ${foraGanhando ? 'font-bold text-white' : 'text-slate-200'}">${escapeHTML(nomeFora)}</span>
                        </div>
                        <span class="team-score ${foraGanhando ? 'text-white' : 'text-slate-400'}">${golsF}</span>
                    </div>
                </div>
                <div class="match-action-col">
                    ${isAtivoNoObs ? `
                        <span class="action-obs-active" title="No ar no OBS"><i class="fa-solid fa-tower-broadcast animate-pulse"></i></span>
                    ` : `
                        <span class="action-obs-btn" title="Transmitir no OBS"><i class="fa-solid fa-play"></i></span>
                    `}
                </div>
            `;

            btn.onclick = () => iniciarTransmissaoSofaScore(jogo.id);
            grid.appendChild(btn);
        });

        secao.appendChild(grid);
        listaDiv.appendChild(secao);
    });
}

// Tick cronômetro tempo real na lista (Minutos e Segundos)
function tickCronometrosDaLista() {
    const els = document.querySelectorAll('[data-tempo-jogo="true"]');
    const nowSec = Math.floor(Date.now() / 1000);
    els.forEach(el => {
        const ts = parseInt(el.getAttribute('data-ts'), 10);
        const code = parseInt(el.getAttribute('data-code'), 10);
        if (!ts || ts <= 0) return;

        const isSecondHalf = (code === 7 || code === 13);
        const elapsed = Math.max(0, nowSec - ts);
        const m = Math.floor(elapsed / 60);
        const min = isSecondHalf ? (45 + m) : m;
        const sec = elapsed % 60;

        el.innerText = `${min}:${String(sec).padStart(2, '0')}`;
    });
}
