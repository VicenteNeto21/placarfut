// ========== js/config.js ==========
// Configurações Globais da PlacarFut

// Endpoint do backend na Vercel (Proxy para evitar CORS)
const BACKEND_URL = '/api/sofascore';

// Tempo de cache (30 segundos)
const CACHE_TTL = 30000;

// ==============================================================================
// 🏆 CAMPEONATOS PELO CÓDIGO (FIXOS)
// Torneios que sempre aparecerão mesmo sem o usuário favoritar.
// ==============================================================================
const CAMPEONATOS_FIXOS_CODIGO = [];

// Lista de IDs para o Ticker (Giro da Rodada)
const GIRO_TORNEIOS_IDS = [
    325,    // Série A
    390,    // Série B
    1281,   // Série C
    10326,  // Série D
    378,    // Cearense A
    19855   // Cearense B
];
