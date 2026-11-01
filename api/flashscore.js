// ========== api/flashscore.js ==========
// Serverless Handler para Flashscore Ninja Feed (Vercel)
// Compatível com as rotas e formato de resposta do PlacarFut

const { parseFlashscoreFeed, parseFlashscoreStats } = require('./flashscore-parser.js');

const CACHE_TTL_MS = 15000;
const feedCache = new Map(); // key -> { timestamp, data }

const FLASHSCORE_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'X-Fsign': 'SW9D1eZo',
    'Referer': 'https://www.flashscore.com.br/',
    'Accept': '*/*'
};

function getDayOffset(targetDateStr) {
    if (!targetDateStr) return 0;
    try {
        const now = new Date();
        const todayStr = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })).toISOString().slice(0, 10);
        const target = new Date(`${targetDateStr}T00:00:00Z`);
        const today = new Date(`${todayStr}T00:00:00Z`);
        const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return isNaN(diff) ? 0 : diff;
    } catch (e) {
        return 0;
    }
}

async function fetchFeedWithCache(dayOffset) {
    const cacheKey = `feed_${dayOffset}`;
    const cached = feedCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
        return cached.data;
    }

    const url = `https://2.flashscore.ninja/2/x/feed/f_1_${dayOffset}_3_pt-br_1`;
    const response = await fetch(url, { headers: FLASHSCORE_HEADERS });
    if (!response.ok) {
        throw new Error(`Flashscore CDN HTTP ${response.status}`);
    }

    const rawText = await response.text();
    const events = parseFlashscoreFeed(rawText);
    const result = { events, _source: 'flashscore', total: events.length };

    feedCache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
}

async function fetchMatchStats(matchId) {
    const url = `https://2.flashscore.ninja/2/x/feed/df_st_1_${matchId}`;
    try {
        const response = await fetch(url, { headers: FLASHSCORE_HEADERS });
        if (!response.ok) return { statistics: [] };
        const text = await response.text();
        const statistics = parseFlashscoreStats(text);
        return { statistics };
    } catch (e) {
        return { statistics: [] };
    }
}

module.exports = async function handler(req, res) {
    const allowedOrigins = ['https://placarfut.vercel.app', 'http://localhost:8080', 'http://localhost:3000'];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const path = req.query.path || '';
    const dateQuery = req.query.date || '';
    const matchIdQuery = req.query.matchId || '';

    try {
        // 1. Estatísticas de Partida
        const statsMatch = path.match(/event\/([a-zA-Z0-9_-]+)\/statistics/);
        if (statsMatch) {
            const matchId = statsMatch[1];
            const stats = await fetchMatchStats(matchId);
            res.setHeader('Cache-Control', 'public, s-maxage=30');
            return res.status(200).json(stats);
        }

        // 2. Evento Individual (event/:id)
        const eventMatch = path.match(/event\/([a-zA-Z0-9_-]+)/);
        const targetMatchId = matchIdQuery || (eventMatch ? eventMatch[1] : null);
        if (targetMatchId) {
            // Busca no feed do dia atual
            const todayFeed = await fetchFeedWithCache(0);
            let event = todayFeed.events.find(e => e.id === targetMatchId || String(e.numericId) === targetMatchId);
            
            // Se não encontrou hoje, tenta no dia de ontem e amanhã
            if (!event) {
                const tomorrowFeed = await fetchFeedWithCache(1);
                event = tomorrowFeed.events.find(e => e.id === targetMatchId || String(e.numericId) === targetMatchId);
            }
            if (!event) {
                const yesterdayFeed = await fetchFeedWithCache(-1);
                event = yesterdayFeed.events.find(e => e.id === targetMatchId || String(e.numericId) === targetMatchId);
            }

            if (event) {
                res.setHeader('Cache-Control', 'public, s-maxage=10');
                return res.status(200).json({ event });
            }
            return res.status(404).json({ error: 'Partida não encontrada no Flashscore' });
        }

        // 3. Jogos ao Vivo (sport/football/events/live)
        if (path.includes('events/live') || req.query.live === '1') {
            const todayFeed = await fetchFeedWithCache(0);
            const liveEvents = todayFeed.events.filter(e => e.status.type === 'inprogress');
            res.setHeader('Cache-Control', 'public, s-maxage=10');
            return res.status(200).json({ events: liveEvents, _source: 'flashscore', total: liveEvents.length });
        }

        // 4. Jogos Agendados por Data
        const isScheduledPath = !path || /scheduled-events/.test(path);
        if (!isScheduledPath) {
            return res.status(404).json({ error: 'Endpoint não suportado pelo Flashscore', path });
        }

        let targetDate = dateQuery;
        if (!targetDate) {
            const dateMatch = path.match(/(\d{4}-\d{2}-\d{2})/);
            if (dateMatch) targetDate = dateMatch[1];
        }

        const offset = req.query.offset !== undefined
            ? parseInt(req.query.offset, 10)
            : getDayOffset(targetDate);

        const data = await fetchFeedWithCache(offset);
        res.setHeader('Cache-Control', 'public, s-maxage=15');
        return res.status(200).json(data);

    } catch (error) {
        console.error('[FLASHSCORE] Erro:', error.message);
        res.status(500).json({ error: 'Falha ao buscar feed Flashscore', details: error.message });
    }
};

