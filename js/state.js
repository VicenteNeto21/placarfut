// ========== js/state.js ==========
// Cofre de Estados da Aplicação

// Estado do fluxo principal
let modoAtual = 'auto'; // 'auto' ou 'manual'
let jogoSelecionadoId = null;
let ultimoPlacar = { casa: -1, fora: -1 };

// Timers e Intervals
let loopDados = null;
let loopCronometro = null;
let manualLoop = null;

// Variáveis de tempo
let minAtual = 0;
let segAtual = 0;
let cronometroRodando = false;
let manualTimerRunning = false;

// Estado do Auto
let todosOsJogos = [];
let cacheJogos = null;
let ultimoFetchCache = 0;
let offsetDias = 0; // 0 = hoje, -1 = ontem, +1 = amanhã
let torneiosOcultos = JSON.parse(localStorage.getItem('futlive_ocultos')) || [];

// Estado do Manual
let manValGolsCasa = 0;
let manValGolsFora = 0;

// ========== TORNEIOS CUSTOMIZADOS (LocalStorage) ==========
let meusTorneios = JSON.parse(localStorage.getItem('futlive_torneios')) || [];

let todosEventosGlobaisParaFiltro = []; // Guarda todos os eventos do dia para popular o Select

function salvarMeusTorneios() {
    localStorage.setItem('futlive_torneios', JSON.stringify(meusTorneios));
}

function salvarTorneiosOcultos() {
    localStorage.setItem('futlive_ocultos', JSON.stringify(torneiosOcultos));
}
