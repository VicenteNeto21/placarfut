// ========== js/state.js ==========
// Cofre de Estados da Aplicação

// Estado do fluxo principal
let modoAtual = 'auto'; // 'auto' ou 'manual'
let jogoSelecionadoId = null;
let ultimoPlacar = { casa: -1, fora: -1 };
let ultimoPlacarTicker = {}; // Guarda placares do Giro da Rodada para detectar gols simultâneos

// Timers e Intervals
let loopDados = null;
let loopCronometro = null;
let manualLoop = null;
let loopIncidentes = null;
let varTimerInterval = null;
let varSeconds = 0;

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
let ultimoStatusSistema = {
    tipo: 'idle',
    mensagem: 'Aguardando atualização.',
    atualizadoEm: null,
    origem: 'idle'
};
let currentEventData = null;

// Estado do Manual
let manValGolsCasa = 0;
let manValGolsFora = 0;

// Estados Especiais do Placar
let isVARActive = false;
let ultimosIncidentesIds = new Set();
let primeiraCargaIncidentes = true;
let teamColorCasa = '#3b82f6';
let teamColorFora = '#ef4444';
let mostrarH2H = false;
let mostrarGols = true;
let mostrarConfrontos = false;
let mostrarTabela = false;
let mostrarArtilheiros = false;
let mostrarEstatisticas = false;

// ========== TORNEIOS CUSTOMIZADOS (LocalStorage) ==========
let meusTorneios = JSON.parse(localStorage.getItem('futlive_torneios')) || [];

let todosEventosGlobaisParaFiltro = []; // Guarda todos os eventos do dia para popular o Select

function salvarMeusTorneios() {
    localStorage.setItem('futlive_torneios', JSON.stringify(meusTorneios));
}

function salvarTorneiosOcultos() {
    localStorage.setItem('futlive_ocultos', JSON.stringify(torneiosOcultos));
}

// ========== PERSISTÊNCIA DE SESSÃO ATIVA ==========

function salvarSessaoAtiva() {
    const sessao = {
        modo: modoAtual,
        jogoId: jogoSelecionadoId,
        timestamp: Date.now()
    };
    
    if (modoAtual === 'manual') {
        sessao.manualData = {
            camp: document.getElementById("manCamp")?.value,
            casaNome: document.getElementById("manCasaNome")?.value,
            foraNome: document.getElementById("manForaNome")?.value,
            casaLogo: document.getElementById("manCasaLogo")?.value,
            foraLogo: document.getElementById("manForaLogo")?.value,
            golsCasa: manValGolsCasa,
            golsFora: manValGolsFora,
            min: document.getElementById("manMin")?.value,
            seg: document.getElementById("manSeg")?.value,
            acrescimo: document.getElementById("manAcrescimo")?.value,
            periodo: document.getElementById("manPeriodo")?.value,
            tema: document.getElementById("manTema")?.value,
            penCasa: document.getElementById("manPenCasa")?.value,
            penFora: document.getElementById("manPenFora")?.value,
            agrCasa: document.getElementById("manAgrCasa")?.value,
            agrFora: document.getElementById("manAgrFora")?.value
        };
    }
    
    localStorage.setItem('placarfut_active_session', JSON.stringify(sessao));
}

function limparSessaoAtiva() {
    localStorage.removeItem('placarfut_active_session');
}

function carregarSessaoAtiva() {
    const raw = localStorage.getItem('placarfut_active_session');
    if (!raw) return null;
    try {
        const sessao = JSON.parse(raw);
        // Expira após 6 horas de inatividade
        if (Date.now() - sessao.timestamp > 6 * 60 * 60 * 1000) {
            limparSessaoAtiva();
            return null;
        }
        return sessao;
    } catch (e) {
        return null;
    }
}
