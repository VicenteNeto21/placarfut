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

function espnStatusToSofa(espnType) {
    const name = espnType?.name || '';
    const state = espnType?.state || '';
    if (state === 'pre')  return { code: 0,   type: 'notstarted', description: 'Not started' };
    if (state === 'post') return { code: 100, type: 'finished',   description: 'Ended' };
    if (name === 'STATUS_HALFTIME') return { code: 31, type: 'inprogress', description: 'Halftime' };
    if (name === 'STATUS_IN_PROGRESS' || name === 'STATUS_FIRST_HALF')  return { code: 6,  type: 'inprogress', description: '1st half' };
    if (name === 'STATUS_SECOND_HALF') return { code: 7,  type: 'inprogress', description: '2nd half' };
    if (state === 'in') return { code: 6, type: 'inprogress', description: '1st half' };
    return { code: 0, type: 'notstarted', description: 'Not started' };
}

function espnEventToSofa(event, liga) {
    const comp   = event.competitions?.[0];
    if (!comp) return null;
    const homeCmp = comp.competitors?.find(c => c.homeAway === 'home');
    const awayCmp = comp.competitors?.find(c => c.homeAway === 'away');
    if (!homeCmp || !awayCmp) return null;

    const espnStatus = comp.status || event.status || {};
    const sofaStatus = espnStatusToSofa(espnStatus.type);
    const startTimestamp = Math.floor(new Date(event.date || comp.startDate).getTime() / 1000);

    let timeInfo = {};
    if (sofaStatus.type === 'inprogress') {
        const clockSec = espnStatus.clock || 0;
        const period   = espnStatus.period || 1;
        const nowSec   = Math.floor(Date.now() / 1000);
        timeInfo = {
            currentPeriodStartTimestamp: nowSec - clockSec,
            period
        };
    }

    return {
        id: parseInt(event.id) || 0,
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

    const rawDate = req.query.date || '';
    const espnDate = rawDate.replace(/-/g, '');

    try {
        const results = await Promise.allSettled(
            ESPN_LIGAS.map(liga => fetchEspnLiga(liga, espnDate))
        );

        const todosEventos = [];
        results.forEach(r => {
            if (r.status === 'fulfilled') {
                todosEventos.push(...r.value);
            }
        });

        const seen = new Set();
        const unique = todosEventos.filter(ev => {
            if (seen.has(ev.id)) return false;
            seen.add(ev.id);
            return true;
        });

        res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=30');
        res.status(200).json({ events: unique, _source: 'espn', total: unique.length });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao agregar ESPN', detail: error.message });
    }
};

