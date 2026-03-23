// ========== js/config.js ==========
// Configurações Globais da PlacarFut

// Endpoint do backend na Vercel (Proxy para evitar CORS)
const BACKEND_URL = '/api/sofascore';

// Tempo de cache (30 segundos)
const CACHE_TTL = 30000;

// Fuso oficial usado na interface e nos filtros de data
const APP_TIMEZONE = 'America/Sao_Paulo';

// ==============================================================================
// 🏆 CAMPEONATOS PELO CÓDIGO (FIXOS)
// Torneios que sempre aparecerão mesmo sem o usuário favoritar.
// ==============================================================================
const CAMPEONATOS_FIXOS_CODIGO = [
    325,    // Brasileirão Série A
    390,    // Brasileirão Série B
    1281,   // Brasileirão Série C
    10326,  // Brasileirão Série D
    13076,  // Brasileirão Feminino
    10257,  // Brasileirão Feminino A1 Women
    73,     // Copa do Brasil
    17015,  // Copa Verde
    384,    // Copa Libertadores
    480,    // Copa Sul-Americana
    11539,  // Recopa Sul-Americana
    7,      // Champions League
    679,    // Europa League
    17,     // Premier League
    8,      // La Liga
    23,     // Serie A (Itália)
    35,     // Bundesliga
    34      // Ligue 1
];

// Lista de IDs para o Ticker (Giro da Rodada)
const GIRO_TORNEIOS_IDS = [
    325,    // Série A
    390,    // Série B
    1281,   // Série C
    10326,  // Série D
    13076,  // Brasileirão Feminino
    10257,  // Brasileirão Feminino A1 Women
    73,     // Copa do Brasil
    17015,  // Copa Verde
    384,    // Copa Libertadores
    480,    // Copa Sul-Americana
    11539,  // Recopa Sul-Americana
    7,      // Champions League
    679,    // Europa League
    17,     // Premier League
    8,      // La Liga
    23,     // Serie A (Itália)
    35,     // Bundesliga
    34,     // Ligue 1
    378,    // Cearense A
    19855   // Cearense B
];
