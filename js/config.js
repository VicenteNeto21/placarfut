// ========== js/config.js ==========
// Configurações Globais da PlacarFut

// Endpoint do backend local ou produção (Proxy para evitar CORS)
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
    10257,  // Brasileirão Feminino A1 Women
    373,    // Copa do Brasil
    384,    // Copa Libertadores
    480,    // Copa Sul-Americana
    490,    // Recopa Sul-Americana
    1596,   // Copa do Nordeste
    33495,  // Copa sulsudeste
    10158,  // Copa Verde
    851,    // Amistosos Internacionais
    19855,  // Campeonato Cearense Serie B
    16,     // FIFA World Cup
    11,     // World Cup Qual. UEFA
    10618   // World Cup Qual. Inter-Confed
];

// Lista de IDs para o Ticker (Giro da Rodada)
const GIRO_TORNEIOS_IDS = [
    325,    // Brasileirão Série A
    390,    // Brasileirão Série B
    1281,   // Brasileirão Série C
    10326,  // Brasileirão Série D
    10257,  // Brasileirão Feminino A1 Women
    373,    // Copa do Brasil
    384,    // Copa Libertadores
    480,    // Copa Sul-Americana
    490,    // Recopa Sul-Americana
    1596,   // Copa do Nordeste
    33495,  // Copa sulsudeste
    10158,  // Copa Verde
    851,    // Amistosos Internacionais
    19855,  // Campeonato Cearense Serie B
    16,     // FIFA World Cup
    11,     // World Cup Qual. UEFA
    10618   // World Cup Qual. Inter-Confed
];
