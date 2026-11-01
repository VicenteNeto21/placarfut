const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// Fallback: busca dados via curl.exe (TLS fingerprint diferente do Node.js)
function fetchViaCurl(targetUrl) {
    try {
        const args = [
            '-s', '-L', '--max-time', '12',
            '-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            '-H', 'Accept: application/json, text/plain, */*',
            '-H', 'Accept-Language: pt-BR,pt;q=0.9,en;q=0.8',
            '-H', 'Referer: https://www.sofascore.com/',
            '-H', 'Origin: https://www.sofascore.com',
            targetUrl
        ];
        const result = execFileSync('curl', args, {
            encoding: 'utf-8',
            timeout: 15000,
            windowsHide: true
        });
        return JSON.parse(result);
    } catch (error) {
        return null;
    }
}

const PORT = process.env.PORT || 8080;

// Origens permitidas para CORS
const ALLOWED_ORIGINS = [
    'http://localhost:8080',
    'http://localhost:3000',
    'http://127.0.0.1:8080'
];

// Tipos MIME para servir arquivos estáticos
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

/**
 * Helper para definir headers CORS com origem restrita.
 */
function setCORSHeaders(req, res) {
    const origin = req.headers.origin;
    // Em dev local (sem origin), libera. Em produção, valida.
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ========== PROXY SOFASCORE (VIA CURL.EXE — BYPASS TLS FINGERPRINT) ==========
async function handleSofaScore(req, res) {
    const reqUrl = new URL(req.url, `http://localhost:${PORT}`);
    const sofaPath = reqUrl.searchParams.get('path');

    setCORSHeaders(req, res);

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (!sofaPath) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Parâmetro "path" é obrigatório' }));
        return;
    }

    const isImageRequest = /\/image(\/|$)/.test(sofaPath);
    const captchaToken = process.env.SOFA_CAPTCHA || reqUrl.searchParams.get('captcha') || '';

    // Múltiplos endpoints — para JSON evita api.sofascore.app (retorna 200 vazio)
    const baseUrls = isImageRequest
        ? [
            'https://api.sofascore.app/api/v1',
            'https://www.sofascore.com/api/v1',
            'https://api.sofascore.com/api/v1'
        ]
        : [
            'https://www.sofascore.com/api/v1',
            'https://api.sofascore.com/api/v1'
        ];

    for (const baseUrl of baseUrls) {
        const targetUrl = `${baseUrl}/${sofaPath}`;
        try {
            console.log(`[PROXY] curl → ${targetUrl}`);

            const args = [
                '-s', '-L', '--max-time', '8',
                '-w', '\n%{http_code}',
                '-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                '-H', 'Accept: application/json, text/plain, */*',
                '-H', 'Accept-Language: pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                '-H', 'Referer: https://www.sofascore.com/',
                '-H', 'Origin: https://www.sofascore.com',
                '-H', 'Cache-Control: no-cache',
                '-H', 'Sec-Ch-Ua: "Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
                '-H', 'Sec-Ch-Ua-Mobile: ?0',
                '-H', 'Sec-Ch-Ua-Platform: "Windows"',
                '-H', 'Sec-Fetch-Dest: empty',
                '-H', 'Sec-Fetch-Mode: cors',
                '-H', 'Sec-Fetch-Site: same-site',
                ...(captchaToken ? ['-H', `X-Captcha: ${captchaToken}`, '-H', `Cookie: sofa_captcha=${captchaToken}`] : []),
                targetUrl
            ];

            if (isImageRequest) {
                // Para imagens, salva em buffer binário
                const { spawnSync } = require('child_process');
                const imgArgs = [
                    '-s', '-L', '--max-time', '10',
                    '-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    '-H', 'Referer: https://www.sofascore.com/',
                    targetUrl
                ];
                const result = spawnSync('curl', imgArgs, {
                    timeout: 12000,
                    windowsHide: true,
                    maxBuffer: 5 * 1024 * 1024
                });

                if (result.status === 0 && result.stdout && result.stdout.length > 100) {
                    // Detecta tipo pela assinatura do arquivo
                    const buf = result.stdout;
                    let ct = 'image/png';
                    if (buf[0] === 0xFF && buf[1] === 0xD8) ct = 'image/jpeg';
                    else if (buf[0] === 0x3C) ct = 'image/svg+xml';
                    else if (buf[0] === 0x47 && buf[1] === 0x49) ct = 'image/gif';

                    res.writeHead(200, {
                        'Content-Type': ct,
                        'Cache-Control': 'public, max-age=86400'
                    });
                    res.end(buf);
                    console.log(`[PROXY] SUCCESS imagem via curl (${baseUrl})`);
                    return;
                }
                continue; // Tenta próximo endpoint
            }

            // Para JSON, usa execFileSync com encoding utf-8
            const result = execFileSync('curl', args, {
                encoding: 'utf-8',
                timeout: 18000,
                windowsHide: true,
                maxBuffer: 10 * 1024 * 1024
            });

            // Separa body do status code (adicionado via -w)
            const lines = result.trimEnd().split('\n');
            const httpCode = parseInt(lines.pop(), 10);
            const body = lines.join('\n');

            if (httpCode >= 200 && httpCode < 300 && body.length > 2) {
                // Valida se é JSON válido
                const parsed = JSON.parse(body);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(parsed));
                console.log(`[PROXY] SUCCESS JSON via curl (${baseUrl}, HTTP ${httpCode})`);
                return;
            }

            console.warn(`[PROXY] curl HTTP ${httpCode} em ${baseUrl} (${sofaPath}), tentando próximo...`);
        } catch (error) {
            console.warn(`[PROXY] curl ERRO em ${baseUrl}: ${error.message}, tentando próximo...`);
        }
    }

    // Todos falharam
    console.error(`[PROXY] FAIL — todos os endpoints falharam para: ${sofaPath}`);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        error: 'Todos os endpoints da SofaScore falharam',
        path: sofaPath
    }));
}

// ========== PROXY FLASHSCORE (NINJA FEED) ==========
const flashscoreHandler = require('./api/flashscore.js');

async function handleFlashscore(req, res) {
    const reqUrl = new URL(req.url, `http://localhost:${PORT}`);
    req.query = Object.fromEntries(reqUrl.searchParams.entries());

    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        if (!res.getHeader('Content-Type')) {
            res.setHeader('Content-Type', 'application/json');
        }
        res.end(JSON.stringify(data));
        return res;
    };

    try {
        await flashscoreHandler(req, res);
    } catch (e) {
        console.error('[PROXY] ERROR Flashscore:', e.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Erro Flashscore', details: e.message }));
    }
}

// ========== PROXY ESPN (raw) ==========
async function handleESPN(req, res) {
    const reqUrl = new URL(req.url, `http://localhost:${PORT}`);
    const liga = reqUrl.searchParams.get('liga') || 'bra.1';

    setCORSHeaders(req, res);

    try {
        const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/${liga}/scoreboard`;
        console.log(`[PROXY] ESPN → ${espnUrl}`);

        const response = await fetch(espnUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const data = await response.json();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
        console.log(`[PROXY] SUCCESS ESPN OK (${liga})`);
    } catch (error) {
        console.error(`[PROXY] ERROR ESPN:`, error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Erro ESPN' }));
    }
}

// ========== PROXY ESPN AGREGADO (converte para formato SofaScore) ==========
// Ligas ESPN mapeadas: slug_espn → { tournamentId, nome }
const ESPN_LIGAS = [
    { slug: 'bra.1',  tournamentId: 325,  nome: 'Brasileirão Série A' },
    { slug: 'bra.2',  tournamentId: 390,  nome: 'Brasileirão Série B' },
    { slug: 'bra.3',  tournamentId: 1281, nome: 'Brasileirão Série C' },
    { slug: 'conmebol.libertadores', tournamentId: 384, nome: 'Copa Libertadores' },
    { slug: 'conmebol.sudamericana', tournamentId: 480, nome: 'Copa Sul-Americana' },
    { slug: 'bra.copa_do_brasil',    tournamentId: 373, nome: 'Copa do Brasil' },
    { slug: 'eng.1',  tournamentId: 17,   nome: 'Premier League' },
    { slug: 'esp.1',  tournamentId: 8,    nome: 'La Liga' },
    { slug: 'ger.1',  tournamentId: 35,   nome: 'Bundesliga' },
    { slug: 'ita.1',  tournamentId: 23,   nome: 'Serie A (Itália)' },
    { slug: 'fra.1',  tournamentId: 34,   nome: 'Ligue 1' },
    { slug: 'uefa.champions', tournamentId: 7, nome: 'Champions League' },
    { slug: 'fifa.world',     tournamentId: 16, nome: 'Copa do Mundo' },
];

// Mapeia status ESPN → código SofaScore (type code)
function espnStatusToSofa(espnType) {
    const name = espnType?.name || '';
    const state = espnType?.state || '';
    if (state === 'pre')  return { code: 0,   type: 'notstarted', description: 'Not started' };
    if (state === 'post') return { code: 100, type: 'finished',   description: 'Ended' };
    // Em andamento
    if (name === 'STATUS_HALFTIME') return { code: 31, type: 'inprogress', description: 'Halftime' };
    if (name === 'STATUS_IN_PROGRESS' || name === 'STATUS_FIRST_HALF')  return { code: 6,  type: 'inprogress', description: '1st half' };
    if (name === 'STATUS_SECOND_HALF') return { code: 7,  type: 'inprogress', description: '2nd half' };
    if (state === 'in') return { code: 6, type: 'inprogress', description: '1st half' };
    return { code: 0, type: 'notstarted', description: 'Not started' };
}

// Converte evento ESPN → formato SofaScore (apenas campos usados pelo frontend)
function espnEventToSofa(event, liga) {
    const comp   = event.competitions?.[0];
    if (!comp) return null;
    const homeCmp = comp.competitors?.find(c => c.homeAway === 'home');
    const awayCmp = comp.competitors?.find(c => c.homeAway === 'away');
    if (!homeCmp || !awayCmp) return null;

    const espnStatus = comp.status || event.status || {};
    const sofaStatus = espnStatusToSofa(espnStatus.type);
    const startTimestamp = Math.floor(new Date(event.date || comp.startDate).getTime() / 1000);

    // Tempo de jogo ao vivo
    let timeInfo = {};
    if (sofaStatus.type === 'inprogress') {
        // ESPN fornece clock em segundos desde o início do período
        const clockSec = espnStatus.clock || 0;
        const period   = espnStatus.period || 1;
        // Calcula timestamp do início do período atual para o cronômetro do frontend
        const nowSec   = Math.floor(Date.now() / 1000);
        const elapsedInPeriod = period === 1 ? clockSec : clockSec;
        timeInfo = {
            currentPeriodStartTimestamp: nowSec - elapsedInPeriod,
            period
        };
    }

    return {
        id: parseInt(event.id) || Math.abs(event.id.hashCode?.() || 0),
        startTimestamp,
        status: sofaStatus,
        time: timeInfo,
        tournament: {
            id: liga.tournamentId,
            name: liga.nome,
            uniqueTournament: { id: liga.tournamentId, name: liga.nome }
        },
        homeTeam: {
            id: parseInt(homeCmp.team?.id) || 0,
            name: homeCmp.team?.displayName || homeCmp.team?.name || '?',
            shortName: homeCmp.team?.abbreviation || '',
            // Logo da ESPN diretamente (sem proxy)
            _espnLogo: homeCmp.team?.logo || ''
        },
        awayTeam: {
            id: parseInt(awayCmp.team?.id) || 0,
            name: awayCmp.team?.displayName || awayCmp.team?.name || '?',
            shortName: awayCmp.team?.abbreviation || '',
            _espnLogo: awayCmp.team?.logo || ''
        },
        homeScore: { current: sofaStatus.type !== 'notstarted' ? parseInt(homeCmp.score) || 0 : null },
        awayScore: { current: sofaStatus.type !== 'notstarted' ? parseInt(awayCmp.score) || 0 : null },
        _source: 'espn'
    };
}

async function fetchEspnLiga(liga, espnDate = '') {
    const query = espnDate ? `?dates=${encodeURIComponent(espnDate)}` : '';
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${liga.slug}/scoreboard${query}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'PlacarFut/1.0' } });
    if (!res.ok) throw new Error(`ESPN ${liga.slug} HTTP ${res.status}`);
    const data = await res.json();
    return (data.events || []).map(ev => espnEventToSofa(ev, liga)).filter(Boolean);
}

async function handleESPNAgregado(req, res) {
    setCORSHeaders(req, res);
    if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

    const reqUrl = new URL(req.url, `http://localhost:${PORT}`);
    const rawDate = reqUrl.searchParams.get('date') || '';
    const espnDate = rawDate.replace(/-/g, ''); // Converte YYYY-MM-DD → YYYYMMDD

    console.log(`[PROXY] ESPN Agregado: buscando todas as ligas (data: ${rawDate || 'padrão'})...`);
    try {
        // Busca todas em paralelo, ignora falhas individuais
        const results = await Promise.allSettled(
            ESPN_LIGAS.map(liga => fetchEspnLiga(liga, espnDate))
        );

        const todosEventos = [];
        results.forEach((r, i) => {
            if (r.status === 'fulfilled') {
                todosEventos.push(...r.value);
                console.log(`[PROXY] ESPN ${ESPN_LIGAS[i].slug}: ${r.value.length} eventos`);
            } else {
                console.warn(`[PROXY] ESPN ${ESPN_LIGAS[i].slug} FAIL: ${r.reason?.message}`);
            }
        });

        // Deduplica por ID
        const seen = new Set();
        const unique = todosEventos.filter(ev => {
            if (seen.has(ev.id)) return false;
            seen.add(ev.id);
            return true;
        });

        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30' });
        res.end(JSON.stringify({ events: unique, _source: 'espn', total: unique.length }));
        console.log(`[PROXY] ESPN Agregado OK: ${unique.length} eventos totais`);
    } catch (error) {
        console.error('[PROXY] ESPN Agregado ERRO:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Erro ao agregar ESPN', detail: error.message }));
    }
}


// ========== PROXY OPENWEATHER ==========
async function handleOpenWeather(req, res) {
    const reqUrl = new URL(req.url, `http://localhost:${PORT}`);
    const cidade = reqUrl.searchParams.get('cidade');
    const lat = reqUrl.searchParams.get('lat');
    const lon = reqUrl.searchParams.get('lon');
    const API_KEY = process.env.OPENWEATHER_KEY || 'd8a712318e5df5a5b810e508669eed61';

    setCORSHeaders(req, res);

    if (!cidade && (!lat || !lon)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Informe "cidade" ou "lat" e "lon"' }));
        return;
    }

    let targetUrl;
    if (lat && lon) {
        targetUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=pt_br`;
    } else {
        targetUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cidade)}&appid=${API_KEY}&units=metric&lang=pt_br`;
    }

    console.log(`[PROXY] OpenWeather → ${targetUrl.replace(API_KEY, '***')}`);

    try {
        const response = await fetch(targetUrl);
        const data = await response.json();

        if (!response.ok) {
            res.writeHead(response.status, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: data.message || 'Erro OpenWeather' }));
            return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=600' });
        res.end(JSON.stringify(data));
        console.log(`[PROXY] SUCCESS OpenWeather (${cidade || `${lat},${lon}`})`);
    } catch (error) {
        console.error(`[PROXY] ERROR OpenWeather:`, error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Falha ao buscar dados do clima', details: error.message }));
    }
}

// ========== SERVIR ARQUIVOS ESTÁTICOS ==========
function serveStatic(req, res) {
    const reqUrl = new URL(req.url, `http://localhost:${PORT}`);
    let filePath = path.join(__dirname, reqUrl.pathname === '/' ? 'index.html' : reqUrl.pathname);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 - Arquivo não encontrado');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Erro interno do servidor');
            }
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
}

// ========== SERVIDOR HTTP ==========
const server = http.createServer((req, res) => {
    const reqUrl = new URL(req.url, `http://localhost:${PORT}`);

    // Rotas de API
    if (reqUrl.pathname === '/api/flashscore') {
        return handleFlashscore(req, res);
    }

    if (reqUrl.pathname === '/api/sofascore') {
        return handleSofaScore(req, res);
    }

    if (reqUrl.pathname === '/api/espn') {
        return handleESPN(req, res);
    }

    if (reqUrl.pathname === '/api/espn-agregado') {
        return handleESPNAgregado(req, res);
    }

    if (reqUrl.pathname === '/api/openweather') {
        return handleOpenWeather(req, res);
    }

    // Arquivos estáticos
    serveStatic(req, res);
});

server.listen(PORT, () => {
    console.log('');
    console.log('  [APP] PlacarFut Dev Server');
    console.log('  ─────────────────────────────');
    console.log(`  Local:   http://localhost:${PORT}`);
    console.log('');
    console.log('  Rotas disponíveis:');
    console.log('    GET /                    → index.html');
    console.log('    GET /api/flashscore      → Proxy Flashscore (Primário - Sem Captcha)');
    console.log('    GET /api/espn-agregado   → Proxy ESPN Agregado (Fallback 1)');
    console.log('    GET /api/sofascore       → Proxy SofaScore (Fallback 2)');
    console.log('    GET /api/espn            → Proxy ESPN (Raw)');
    console.log('    GET /api/openweather     → Proxy OpenWeather');
    console.log('');
    console.log('  Aguardando requisições...');
    console.log('');
});
