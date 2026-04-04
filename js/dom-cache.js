// ========== js/dom-cache.js ==========
// Cache centralizado de elementos DOM para evitar chamadas repetidas a getElementById

const DOM = {};

function cacheDOM() {
    // Placar principal
    DOM.golsCasa = document.getElementById('tvGolsCasa');
    DOM.golsFora = document.getElementById('tvGolsFora');
    DOM.periodo = document.getElementById('tvPeriodo');
    DOM.periodLabel = document.getElementById('tvPeriodLabel');
    DOM.campeonato = document.getElementById('tvCampeonato');
    DOM.nomeCasa = document.getElementById('tvNomeCasa');
    DOM.nomeFora = document.getElementById('tvNomeFora');
    DOM.imgLogoCasa = document.getElementById('imgLogoCasa');
    DOM.imgLogoFora = document.getElementById('imgLogoFora');
    DOM.logoComp = document.getElementById('tvLogoComp');

    // Badge ao vivo
    DOM.badgeAoVivo = document.getElementById('tvBadgeAoVivo');
    DOM.bolinhaAoVivo = document.getElementById('tvBolinhaAoVivo');
    DOM.textoBadge = document.getElementById('tvTextoBadge');

    // Cartões
    DOM.yellowCardCasa = document.getElementById('tvYellowCardCasa');
    DOM.yellowCardFora = document.getElementById('tvYellowCardFora');
    DOM.redCardCasa = document.getElementById('tvRedCardCasa');
    DOM.redCardFora = document.getElementById('tvRedCardFora');

    // Pênaltis e agregado
    DOM.penaltisCasa = document.getElementById('tvPenaltisCasa');
    DOM.penaltisFora = document.getElementById('tvPenaltisFora');
    DOM.agregado = document.getElementById('tvAgregado');
    DOM.acrescimo = document.getElementById('tvAcrescimo');

    // Artilheiros / Scorers
    DOM.scorersCasa = document.getElementById('tvScorersCasa');
    DOM.scorersFora = document.getElementById('tvScorersFora');
    DOM.scorersBar = document.getElementById('tvScorersBar');

    // Pênaltis bar
    DOM.penaltyBar = document.getElementById('tvPenaltyBar');
    DOM.penaltyDotsCasa = document.getElementById('tvPenaltyDotsCasa');
    DOM.penaltyDotsFora = document.getElementById('tvPenaltyDotsFora');

    // Estatísticas
    DOM.statsBar = document.getElementById('tvStatsBar');
    DOM.posseCasa = document.getElementById('tvPosseCasa');
    DOM.posseFora = document.getElementById('tvPosseFora');
    DOM.posseBarraCasa = document.getElementById('tvPosseBarraCasa');
    DOM.posseBarraFora = document.getElementById('tvPosseBarraFora');
    DOM.chutesCasa = document.getElementById('tvChutesCasa');
    DOM.chutesFora = document.getElementById('tvChutesFora');
    DOM.escanteiosCasa = document.getElementById('tvEscanteiosCasa');
    DOM.escanteiosFora = document.getElementById('tvEscanteiosFora');
    DOM.faltasCasa = document.getElementById('tvFaltasCasa');
    DOM.faltasFora = document.getElementById('tvFaltasFora');
    DOM.cartoesCasa = document.getElementById('tvCartoesCasa');
    DOM.cartoesFora = document.getElementById('tvCartoesFora');
    DOM.chancesCasa = document.getElementById('tvChancesCasa');
    DOM.chancesFora = document.getElementById('tvChancesFora');

    // VAR
    DOM.varOverlay = document.getElementById('tvVAROverlay');
    DOM.varTimer = document.getElementById('tvVARTimer');

    // Substituição
    DOM.subBanner = document.getElementById('tvSubBanner');
    DOM.subIn = document.getElementById('tvSubIn');
    DOM.subOut = document.getElementById('tvSubOut');
    DOM.subBannerAbove = document.getElementById('tvSubBannerAbove');
    DOM.subInAbove = document.getElementById('tvSubInAbove');
    DOM.subOutAbove = document.getElementById('tvSubOutAbove');

    // Melhor em campo
    DOM.bestPlayerCard = document.getElementById('tvBestPlayerCard');
    DOM.bestPlayerPhoto = document.getElementById('tvBestPlayerPhoto');
    DOM.bestPlayerName = document.getElementById('tvBestPlayerName');
    DOM.bestPlayerRating = document.getElementById('tvBestPlayerRating');
    DOM.mainScoreRow = document.getElementById('tvMainScoreRow');

    // Gol overlay
    DOM.overlayGol = document.getElementById('overlayGol');
    DOM.goalImmersive = document.getElementById('tvGoalImmersive');
    DOM.goalTeamImmersive = document.getElementById('tvGoalTeamImmersive');
    DOM.goalPlayerImmersive = document.getElementById('tvGoalPlayerImmersive');

    // Card notify
    DOM.cardNotify = document.getElementById('tvCardNotify');
    DOM.cardTitle = document.getElementById('tvCardTitle');
    DOM.cardPlayer = document.getElementById('tvCardPlayer');
    DOM.cardTime = document.getElementById('tvCardTime');
    DOM.cardIcon = document.getElementById('tvCardIcon');

    // Painéis e wrappers
    DOM.painelAdmin = document.getElementById('painelAdmin');
    DOM.uiTransmissao = document.getElementById('uiTransmissao');
    DOM.placarCard = document.getElementById('placarCard');
    DOM.placarWrapper = document.getElementById('placarWrapper');
    DOM.textoTamanho = document.getElementById('textoTamanho');
    DOM.dragHandle = document.getElementById('dragHandle');

    // Tabela
    DOM.panelTabela = document.getElementById('tvPanelTabela');
    DOM.tabelaHandle = document.getElementById('tvTabelaHandle');
    DOM.tabelaBody = document.getElementById('tabTabelaBody');
    DOM.tabelaNomeCamp = document.getElementById('tabNomeCamp');

    // Confrontos / Mata-mata
    DOM.panelConfrontos = document.getElementById('tvPanelConfrontos');
    DOM.confrontosHandle = document.getElementById('tvConfrontosHandle');
    DOM.confrontosBody = document.getElementById('tvConfrontosBody');
    DOM.confNomeCamp = document.getElementById('confNomeCamp');

    // H2H
    DOM.h2hOverlay = document.getElementById('tvH2HOverlay');
    DOM.h2hCard = document.getElementById('h2hCard');

    // Ticker
    DOM.ticker = document.getElementById('tvTicker');
    DOM.tickerLabel = document.getElementById('tickerLabel');
    DOM.tickerLabelText = document.getElementById('tickerLabelText');
    DOM.tickerGoalOverlay = document.getElementById('tickerGoalOverlay');
    DOM.tickerGoalText = document.getElementById('tickerGoalText');

    // Admin panel
    DOM.listaDeJogos = document.getElementById('listaDeJogos');
    DOM.statusPainel = document.getElementById('statusPainel');
    DOM.dataLabel = document.getElementById('dataLabel');
    DOM.dataBadge = document.getElementById('dataBadge');

    // Botões toggle
    DOM.btnToggleVAR = document.getElementById('btnToggleVAR');
    DOM.btnToggleH2H = document.getElementById('btnToggleH2H');
    DOM.btnToggleGols = document.getElementById('btnToggleGols');
    DOM.btnToggleTabela = document.getElementById('btnToggleTabela');
    DOM.btnToggleConfrontos = document.getElementById('btnToggleConfrontos');
}

/**
 * Helper para buscar elemento do DOM com fallback.
 * Tenta o cache primeiro, senão busca direto.
 */
function getDOM(key) {
    if (DOM[key]) return DOM[key];
    return document.getElementById(key);
}
