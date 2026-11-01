// ========== js/broadcast/notificacoes.js ==========
// Banners, overlays e notificações visuais (gol, cartão, sub, VAR, craque)

function atualizarPlacarComEfeito(elementoId, player = 'Atacante', team = 'TIME', showOverlay = false) {
    const el = document.getElementById(elementoId);
    if (!el) return;
    
    el.classList.remove("goal-alert");
    void el.offsetWidth;
    el.classList.add("goal-alert");

    if (!showOverlay) return;

    const overlay = DOM.overlayGol || document.getElementById("overlayGol");
    if (overlay) {
        overlay.classList.remove("hidden");
        overlay.classList.remove("overlay-gol-anim");
        void overlay.offsetWidth;
        overlay.classList.add("overlay-gol-anim");
        setTimeout(() => {
            overlay.classList.add("hidden");
        }, 3500);
    }
}

function mostrarNotificacaoSubstituicao(playerIn, playerOut, isHome = true) {
    const mainScoreRow = document.getElementById("tvMainScoreRow");
    const subPanelInside = document.getElementById("tvSubPanelInside");
    const subLogo = document.getElementById("tvSubLogo");
    const subIn = document.getElementById("tvSubPlayerIn");
    const subOut = document.getElementById("tvSubPlayerOut");
    
    if (!mainScoreRow || !subPanelInside || !subLogo || !subIn || !subOut) return;

    // 1. Configurar os dados da substituição
    subIn.innerText = playerIn;
    subOut.innerText = playerOut;
    
    const logoSrc = isHome ? 
        document.getElementById("imgLogoCasa")?.src : 
        document.getElementById("imgLogoFora")?.src;
    
    if (logoSrc) subLogo.src = logoSrc;

    // 2. Animar a troca (Placar sai -> Sub entra) usando GRID STACK (sem hidden)
    mainScoreRow.classList.add("panel-switch-out");
    mainScoreRow.classList.remove("panel-switch-in");
    
    subPanelInside.classList.remove("panel-switch-out");
    subPanelInside.classList.add("panel-switch-in");

    // 3. Reverter após 7 segundos
    setTimeout(() => {
        subPanelInside.classList.remove("panel-switch-in");
        subPanelInside.classList.add("panel-switch-out");

        mainScoreRow.classList.remove("panel-switch-out");
        mainScoreRow.classList.add("panel-switch-in");
    }, 7000);
}

function mostrarGoalImmersive(player, team, isHome) {
    const overlay = DOM.goalImmersive || document.getElementById("tvGoalImmersive");
    const elTeam = DOM.goalTeamImmersive || document.getElementById("tvGoalTeamImmersive");
    const elPlayer = DOM.goalPlayerImmersive || document.getElementById("tvGoalPlayerImmersive");
    if (!overlay || !elTeam || !elPlayer) return;

    elTeam.innerText = team;
    elPlayer.innerText = player;

    overlay.classList.add("show");
    
    setTimeout(() => {
        overlay.classList.remove("show");
    }, 7000);
}

function mostrarCardNotify(player, cardType, team, time) {
    const notify = DOM.cardNotify || document.getElementById("tvCardNotify");
    const elTitle = DOM.cardTitle || document.getElementById("tvCardTitle");
    const elPlayer = DOM.cardPlayer || document.getElementById("tvCardPlayer");
    const elTime = DOM.cardTime || document.getElementById("tvCardTime");
    const elIcon = DOM.cardIcon || document.getElementById("tvCardIcon");
    
    if (!notify || !elTitle || !elPlayer || !elTime || !elIcon) return;

    const isRed = (cardType === 'RedCard' || cardType === 'SecondYellowCard' || cardType === 'red' || cardType === 'yellowRed');
    
    notify.classList.remove("card-yellow", "card-red");
    elTitle.classList.remove("card-text-yellow", "card-text-red");
    elIcon.classList.remove("card-bg-yellow", "card-bg-red");

    notify.classList.add(isRed ? "card-red" : "card-yellow");
    elTitle.classList.add(isRed ? "card-text-red" : "card-text-yellow");
    elIcon.classList.add(isRed ? "card-bg-red" : "card-bg-yellow");
    
    elTitle.innerText = isRed ? "CARTÃO VERMELHO" : "CARTÃO AMARELO";
    elPlayer.innerText = player;
    elTime.innerText = `${time} - ${team}`;

    notify.classList.add("show");
    
    setTimeout(() => {
        notify.classList.remove("show");
    }, 5000);
}

function toggleVAR() {
    isVARActive = !isVARActive;
    const overlay = DOM.varOverlay || document.getElementById("tvVAROverlay");
    const timerEl = DOM.varTimer || document.getElementById("tvVARTimer");
    const btn = DOM.btnToggleVAR || document.getElementById("btnToggleVAR");
    const btnMan = document.getElementById("btnManVAR");
    
    if (isVARActive) {
        if(overlay) { overlay.classList.remove("hidden"); overlay.classList.add("flex"); }
        if(btn) { btn.classList.replace("bg-gray-900/80", "bg-fuchsia-600"); btn.classList.replace("opacity-20", "opacity-100"); }
        if(btnMan) { btnMan.classList.replace("bg-gray-800", "bg-fuchsia-600"); btnMan.classList.replace("text-fuchsia-500", "text-white"); }
        
        varSeconds = 0;
        if (timerEl) timerEl.innerText = "00:00";
        if (varTimerInterval) clearInterval(varTimerInterval);
        
        varTimerInterval = setInterval(() => {
            varSeconds++;
            if (timerEl) {
                const mins = Math.floor(varSeconds / 60);
                const secs = varSeconds % 60;
                timerEl.innerText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            }
        }, 1000);
        
    } else {
        if(overlay) { overlay.classList.add("hidden"); overlay.classList.remove("flex"); }
        if(btn) { btn.classList.replace("bg-fuchsia-600", "bg-gray-900/80"); btn.classList.replace("opacity-100", "opacity-20"); }
        if(btnMan) { btnMan.classList.replace("bg-fuchsia-600", "bg-gray-800"); btnMan.classList.replace("text-white", "text-fuchsia-500"); }
        
        if (varTimerInterval) {
            clearInterval(varTimerInterval);
            varTimerInterval = null;
        }
    }
}

function toggleArtilheiros() {
    mostrarGols = !mostrarGols;
    const bar = DOM.scorersBar || document.getElementById("tvScorersBar");
    const btnIcon = document.querySelector("#btnToggleGols i");
    if (bar) {
        bar.classList.add("panel-slide");
        if (!mostrarGols) {
            bar.classList.add("hidden");
            if (btnIcon) btnIcon.classList.replace("fa-futbol", "fa-eye-slash");
        } else {
            const scorersCasa = DOM.scorersCasa || document.getElementById('tvScorersCasa');
            const scorersFora = DOM.scorersFora || document.getElementById('tvScorersFora');
            if (scorersCasa.innerHTML.trim() || scorersFora.innerHTML.trim()) {
                bar.classList.remove("hidden");
            }
            if (btnIcon) btnIcon.classList.replace("fa-eye-slash", "fa-futbol");
            buscarIncidentesSofaScore(jogoSelecionadoId);
        }
    }
}

function toggleEstatisticas() {
    mostrarEstatisticas = !mostrarEstatisticas;
    const bar = DOM.statsBar || document.getElementById("tvStatsBar");
    if (bar) {
        bar.classList.add("panel-slide");
        if (!mostrarEstatisticas) {
            bar.classList.add("hidden");
        } else {
            bar.classList.remove("hidden");
            if (jogoSelecionadoId) buscarEstatisticas(jogoSelecionadoId);
        }
    }
}

// ========== MELHOR EM CAMPO ==========

async function buscarMelhorEmCampo(eventId) {
    if (!eventId) {
        exibirJogadorDestaque({ name: "Vinícius Júnior", id: 826131, rating: 9.1 });
        return;
    }

    try {
        const data = await fetchWithFallback(`event/${eventId}/lineups`);
        if (!data || !data.home || !data.away) return;

        let bestPlayer = null;
        let maxRating = 0;

        const processLineup = (players) => {
            players.forEach(p => {
                const rating = parseFloat(p.statistics?.rating);
                if (rating && rating > maxRating) {
                    maxRating = rating;
                    bestPlayer = { name: p.player?.shortName || p.player?.name, id: p.player?.id, rating: rating };
                }
            });
        };

        processLineup(data.home.players);
        processLineup(data.away.players);

        if (bestPlayer) exibirJogadorDestaque(bestPlayer);
    } catch (e) {
        console.error("Erro buscarMelhorEmCampo:", e);
    }
}

function exibirJogadorDestaque(player) {
    const card = DOM.bestPlayerCard || document.getElementById("tvBestPlayerCard");
    const mainScore = DOM.mainScoreRow || document.getElementById("tvMainScoreRow");
    
    if (isBestPlayerShowing) { removerJogadorDestaque(); return; }

    const img = DOM.bestPlayerPhoto || document.getElementById("tvBestPlayerPhoto");
    const name = DOM.bestPlayerName || document.getElementById("tvBestPlayerName");
    const ratingEl = DOM.bestPlayerRating || document.getElementById("tvBestPlayerRating");

    if (!card || !mainScore || !img || !name || !ratingEl) return;

    img.src = sofaImg(`player/${player.id}/image`);
    name.innerText = player.name;
    ratingEl.innerText = player.rating.toFixed(1);

    ratingEl.classList.remove("rating-gold", "rating-green", "rating-lightgreen", "rating-yellow", "rating-orange");
    if (player.rating >= 8.5) ratingEl.style.color = "#ffffff";
    else ratingEl.style.color = "#cccccc";

    if (window.bestPlayerTimeout) clearTimeout(window.bestPlayerTimeout);

    isBestPlayerShowing = true;

    mainScore.classList.add("slide-out");
    card.classList.remove("hidden");
    void card.offsetWidth;
    card.classList.add("show");

    window.bestPlayerTimeout = setTimeout(() => { removerJogadorDestaque(); }, 30000);
}

function removerJogadorDestaque() {
    const card = DOM.bestPlayerCard || document.getElementById("tvBestPlayerCard");
    const mainScore = DOM.mainScoreRow || document.getElementById("tvMainScoreRow");
    
    if (!card || !mainScore) return;

    isBestPlayerShowing = false;
    if (window.bestPlayerTimeout) clearTimeout(window.bestPlayerTimeout);

    card.classList.remove("show");
    mainScore.classList.remove("slide-out");
    
    setTimeout(() => {
        if (!isBestPlayerShowing) card.classList.add("hidden");
    }, 700);
}

// ========== FUNÇÃO DE TESTE ==========

function testarEfeitos() {
    atualizarPlacarComEfeito("tvGolsCasa", "PEDRO (9)", "FLAMENGO", true);
    
    const timeCasaMock = { id: 5981, shortName: 'FLA', name: 'Flamengo' };
    const timeForaMock = { id: 1934, shortName: 'VAS', name: 'Vasco' };
    mostrarAlertaGolTicker('FLAMENGO', timeCasaMock, timeForaMock, 1, 0, 'BRASILEIRÃO SÉRIE A');
    
    mostrarNotificacaoSubstituicao("Pedro (9)", "Gabriel B. (10)");
    
    setTimeout(() => {
        mostrarCardNotify("V. ZANOCELO", "YellowCard", "TIME CASA", "25'");
    }, 2000);

    processarPenaltis([
        { incidentType: 'penaltyShootout', incidentClass: 'scored', isHome: true, sequence: 1 },
        { incidentType: 'penaltyShootout', incidentClass: 'scored', isHome: false, sequence: 1 },
        { incidentType: 'penaltyShootout', incidentClass: 'missed', isHome: true, sequence: 2 },
        { incidentType: 'penaltyShootout', incidentClass: 'scored', isHome: false, sequence: 2 },
        { incidentType: 'penaltyShootout', incidentClass: 'scored', isHome: true, sequence: 3 },
    ]);
}
