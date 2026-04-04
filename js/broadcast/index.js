// ========== js/broadcast/index.js ==========
// Funções principais do broadcast: iniciar, voltar, atualizar dados, aplicar tema
// Depende de: state.js, dom-cache.js, utils.js, api.js, translations.js

function iniciarTransmissaoSofaScore(id) {
    jogoSelecionadoId = id;
    modoAtual = 'auto';
    salvarSessaoAtiva();
    
    const painelAdmin = DOM.painelAdmin || document.getElementById("painelAdmin");
    const uiTransmissao = DOM.uiTransmissao || document.getElementById("uiTransmissao");
    if (painelAdmin) painelAdmin.style.display = "none";
    if (uiTransmissao) uiTransmissao.style.display = "block";
    
    ultimoPlacar = { casa: -1, fora: -1 };
    definirEscalaPlacar(0.95);
    
    const golsCasa = DOM.golsCasa || document.getElementById("tvGolsCasa");
    const golsFora = DOM.golsFora || document.getElementById("tvGolsFora");
    const periodo = DOM.periodo || document.getElementById("tvPeriodo");
    const scorersCasa = DOM.scorersCasa || document.getElementById("tvScorersCasa");
    const scorersFora = DOM.scorersFora || document.getElementById("tvScorersFora");
    const scorersBar = DOM.scorersBar || document.getElementById("tvScorersBar");
    const penaltyBar = DOM.penaltyBar || document.getElementById("tvPenaltyBar");
    
    if (golsCasa) golsCasa.innerHTML = "-";
    if (golsFora) golsFora.innerHTML = "-";
    if (periodo) periodo.innerHTML = "--:--";
    if (scorersCasa) scorersCasa.innerHTML = "";
    if (scorersFora) scorersFora.innerHTML = "";
    if (scorersBar) scorersBar.classList.add("hidden");
    if (penaltyBar) penaltyBar.classList.add("hidden");
    
    primeiraCargaIncidentes = true;
    ultimosIncidentesIds.clear();
    atualizarDadosSofaScore();
    iniciarCronometroSofaScore();

    if (loopDados) clearInterval(loopDados);
    loopDados = setInterval(atualizarDadosSofaScore, 10000);

    if (loopIncidentes) clearInterval(loopIncidentes);
    loopIncidentes = setInterval(() => buscarIncidentesSofaScore(id), 15000);

    startTickerObserver();
}

function voltarAoPainel() {
    // Limpar todos os intervals de uma vez
    limparTodosIntervals();
    limparSessaoAtiva();
    
    // Resetar estado global
    resetarEstadoGlobal();
    ultimoPlacarTicker = ultimoPlacarTicker || {};

    // Resetar UI do VAR
    const varOverlay = DOM.varOverlay || document.getElementById("tvVAROverlay");
    if (varOverlay) { varOverlay.classList.add("hidden"); varOverlay.classList.remove("flex"); }
    const btnVAR = DOM.btnToggleVAR || document.getElementById("btnToggleVAR");
    if (btnVAR) { btnVAR.classList.replace("bg-fuchsia-600", "bg-gray-900/80"); btnVAR.classList.replace("opacity-100", "opacity-20"); }

    // Resetar UI do H2H
    const h2hOverlay = DOM.h2hOverlay || document.getElementById("tvH2HOverlay");
    if (h2hOverlay) { h2hOverlay.classList.add("hidden"); h2hOverlay.classList.remove("flex"); }
    const btnH2H = DOM.btnToggleH2H || document.getElementById("btnToggleH2H");
    if (btnH2H) { btnH2H.classList.replace("bg-orange-600", "bg-gray-900/80"); btnH2H.classList.replace("opacity-100", "opacity-20"); }

    const btnIconGols = document.querySelector("#btnToggleGols i");
    if (btnIconGols && btnIconGols.classList.contains("fa-eye-slash")) {
        btnIconGols.classList.replace("fa-eye-slash", "fa-futbol");
    }

    // Ocultar painel da tabela
    const painelTabela = DOM.panelTabela || document.getElementById("tvPanelTabela");
    if (painelTabela) { painelTabela.classList.remove("translate-x-0", "opacity-100"); painelTabela.classList.add("translate-x-[120%]", "opacity-0"); }
    const tabelaBody = DOM.tabelaBody || document.getElementById("tabTabelaBody");
    if (tabelaBody) tabelaBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">Aguardando...</td></tr>';
    
    // Ocultar barras auxiliares
    const statsBar = DOM.statsBar || document.getElementById("tvStatsBar");
    if (statsBar) statsBar.classList.add("hidden");

    const elYcCasa = DOM.yellowCardCasa || document.getElementById("tvYellowCardCasa");
    if (elYcCasa) elYcCasa.classList.add("hidden");
    const elYcFora = DOM.yellowCardFora || document.getElementById("tvYellowCardFora");
    if (elYcFora) elYcFora.classList.add("hidden");
    
    const elAgregado = DOM.agregado || document.getElementById("tvAgregado");
    if (elAgregado) elAgregado.classList.add("hidden");
    const elPenCasa = DOM.penaltisCasa || document.getElementById("tvPenaltisCasa");
    if (elPenCasa) elPenCasa.classList.add("hidden");
    const elPenFora = DOM.penaltisFora || document.getElementById("tvPenaltisFora");
    if (elPenFora) elPenFora.classList.add("hidden");
    const elAcrescimo = DOM.acrescimo || document.getElementById("tvAcrescimo");
    if (elAcrescimo) elAcrescimo.classList.add("hidden");

    const scorersBar = DOM.scorersBar || document.getElementById("tvScorersBar");
    if (scorersBar) scorersBar.classList.add("hidden");
    const scorersCasa = DOM.scorersCasa || document.getElementById("tvScorersCasa");
    if (scorersCasa) scorersCasa.innerHTML = "";
    const scorersFora = DOM.scorersFora || document.getElementById("tvScorersFora");
    if (scorersFora) scorersFora.innerHTML = "";
    const penaltyBar = DOM.penaltyBar || document.getElementById("tvPenaltyBar");
    if (penaltyBar) penaltyBar.classList.add("hidden");

    const bannerSub = DOM.subBanner || document.getElementById("tvSubBanner");
    if (bannerSub) { bannerSub.classList.remove("translate-y-0", "opacity-100"); bannerSub.classList.add("-translate-y-full", "opacity-0"); }

    // Resetar placar visual
    const golsCasa = DOM.golsCasa || document.getElementById("tvGolsCasa");
    const golsFora = DOM.golsFora || document.getElementById("tvGolsFora");
    const periodo = DOM.periodo || document.getElementById("tvPeriodo");
    const campeonato = DOM.campeonato || document.getElementById("tvCampeonato");
    const nomeCasa = DOM.nomeCasa || document.getElementById("tvNomeCasa");
    const nomeFora = DOM.nomeFora || document.getElementById("tvNomeFora");
    const textoBadge = DOM.textoBadge || document.getElementById("tvTextoBadge");
    
    if (golsCasa) golsCasa.innerHTML = "0";
    if (golsFora) golsFora.innerHTML = "0";
    if (periodo) periodo.innerHTML = "00:00";
    if (campeonato) campeonato.innerHTML = "SOFASCORE LIVE";
    if (nomeCasa) nomeCasa.innerHTML = "CASA";
    if (nomeFora) nomeFora.innerHTML = "FORA";
    if (textoBadge) textoBadge.innerHTML = "AGUARDANDO";

    const labelBg = DOM.tickerLabel || document.getElementById("tickerLabel");
    const labelText = DOM.tickerLabelText || document.getElementById("tickerLabelText");
    if (labelBg && labelText) {
        labelBg.className = "ticker-label bg-gradient-to-b from-gray-900 to-black border-r border-gray-700 overflow-hidden relative min-w-[300px] flex justify-center z-[5]";
        labelText.innerHTML = '<i class="fa-solid fa-bolt mr-2 text-sky-400"></i> GIRO DA RODADA';
        labelText.style.transform = 'translateY(0)';
        labelText.style.opacity = '1';
    }

    // Trocar visibilidade
    const uiTransmissao = DOM.uiTransmissao || document.getElementById("uiTransmissao");
    const painelAdmin = DOM.painelAdmin || document.getElementById("painelAdmin");
    if (uiTransmissao) uiTransmissao.style.display = "none";
    if (painelAdmin) painelAdmin.style.display = "";
    
    const lista = DOM.listaDeJogos || document.getElementById("listaDeJogos");
    if (!lista || lista.innerHTML.trim() === "" || lista.innerHTML.includes("Aguardando")) {
        if (typeof buscarJogosSofaScore === 'function') buscarJogosSofaScore();
    }
}

function aplicarTemaPlacar(tornId) {
    const placar = DOM.placarCard || document.getElementById("placarCard");
    const h2hCard = DOM.h2hCard || document.getElementById("h2hCard");
    const wrapper = DOM.placarWrapper || document.getElementById("placarWrapper");
    if (!placar) return;
    
    placar.className = "placar-compacto rounded-xl flex flex-col overflow-hidden relative z-10 transition-transform duration-500";
    if (h2hCard) h2hCard.className = "h2h-panel theme-bg-dark border theme-border p-8 rounded-[2rem] shadow-2xl flex flex-col items-center w-[1100px] relative overflow-hidden transition-all duration-300";
    if (wrapper) wrapper.classList.remove("layout-nordeste2025", "layout-copa", "layout-seried");
    
    let isCopa = false;
    let isNordeste2025 = false;
    let isSerieD = false;
    let temaClass = "";

    if (tornId === 384) { temaClass = "theme-libertadores"; isCopa = true; }
    else if (tornId === 480 || tornId === 11539) { temaClass = "theme-sulamericana"; isCopa = true; }
    else if (tornId === 1596 || tornId === 11620) { temaClass = "theme-nordeste2025"; isNordeste2025 = true; }
    else if (tornId === 73) { temaClass = "theme-brasil"; isCopa = true; }
    else if (tornId === 17015) { temaClass = "theme-verde"; isCopa = true; }
    else if (tornId === 13076 || tornId === 10257) { temaClass = "theme-feminino"; isCopa = true; }
    else if (tornId === 16 || tornId === 482 || tornId === 704 || tornId === 712 || tornId === 1406 || tornId === 1045 || tornId === 10618 || tornId === 11) { temaClass = "theme-fifa2026"; isCopa = true; }
    else if (tornId === 10326) { temaClass = "theme-serieD"; isSerieD = true; }

    if (temaClass) {
        placar.classList.add(temaClass);
        if (h2hCard) h2hCard.classList.add(temaClass);
    }

    if (isNordeste2025) {
        placar.classList.add("layout-nordeste2025");
        if (wrapper) wrapper.classList.add("layout-nordeste2025");
        if (h2hCard) h2hCard.classList.add("layout-nordeste2025");
        definirEscalaPlacar(0.95);
        const txtTam = DOM.textoTamanho || document.getElementById("textoTamanho");
        if (txtTam) txtTam.innerText = "95%";
    } else if (isSerieD) {
        placar.classList.remove("rounded-xl");
        placar.classList.add("layout-seried");
        if (wrapper) wrapper.classList.add("layout-seried");
        if (h2hCard) { h2hCard.classList.remove("rounded-[2rem]"); h2hCard.classList.add("layout-seried"); }
    } else if (isCopa) {
        placar.classList.remove("rounded-xl");
        placar.classList.add("layout-copa");
        if (h2hCard) { h2hCard.classList.remove("rounded-[2rem]"); h2hCard.classList.add("layout-copa"); }
    }
}

async function atualizarDadosSofaScore() {
    if (!jogoSelecionadoId) return;

    try {
        const eventData = await fetchSofaScore(`event/${jogoSelecionadoId}`);
        const jogo = eventData.event;
        currentEventData = jogo;
        
        currentTournamentId = jogo.tournament?.uniqueTournament?.id || jogo.tournament?.id;
        currentSeasonId = jogo.season?.id;
        if (!currentSeasonId && currentTournamentId) {
            try {
                const tourData = await fetchSofaScore(`unique-tournament/${currentTournamentId}/seasons`);
                if (tourData.seasons && tourData.seasons.length > 0) {
                    currentSeasonId = tourData.seasons[0].id;
                }
            } catch(e) {}
        }
        currentHomeTeamId = jogo.homeTeam.id;
        currentAwayTeamId = jogo.awayTeam.id;
        
        aplicarTemaPlacar(currentTournamentId);

        const golsC = jogo.homeScore?.current || 0;
        const golsF = jogo.awayScore?.current || 0;

        // Pênaltis
        const penC = jogo.homeScore?.penalties;
        const penF = jogo.awayScore?.penalties;
        const elPenC = DOM.penaltisCasa || document.getElementById("tvPenaltisCasa");
        const elPenF = DOM.penaltisFora || document.getElementById("tvPenaltisFora");
        if (penC !== undefined && penF !== undefined) {
            elPenC.innerHTML = `(${penC})`; elPenF.innerHTML = `(${penF})`;
            elPenC.classList.remove("hidden"); elPenF.classList.remove("hidden");
        } else {
            elPenC.classList.add("hidden"); elPenF.classList.add("hidden");
        }

        // Placar Agregado
        const agrC = jogo.homeScore?.aggregated ?? jogo.homeScore?.aggregate;
        const agrF = jogo.awayScore?.aggregated ?? jogo.awayScore?.aggregate;
        const elAgregado = DOM.agregado || document.getElementById("tvAgregado");
        if (agrC !== undefined && agrF !== undefined) {
            elAgregado.innerHTML = `AGR. ${agrC} - ${agrF}`;
            elAgregado.classList.remove("hidden");
        } else {
            elAgregado.classList.add("hidden");
        }

        const tidTv = jogo.tournament?.uniqueTournament?.id || jogo.tournament?.id || 0;
        const campeonato = DOM.campeonato || document.getElementById("tvCampeonato");
        if (campeonato) campeonato.innerHTML = nomeCampeonatoExibicao(tidTv, jogo.tournament?.name, 'SOFASCORE LIVE').toUpperCase();
        
        // Logo da Competição
        const elLogoComp = DOM.logoComp || document.getElementById("tvLogoComp");
        if (elLogoComp) {
            const placarEl = DOM.placarCard || document.getElementById("placarCard");
            if (placarEl && placarEl.classList.contains('theme-fifa2026')) {
                elLogoComp.src = "https://digitalhub.fifa.com/transform/157d23bf-7e13-4d7b-949e-5d27d340987e/WC26_Logo?&io=transform:fill,height:210&quality=75";
                elLogoComp.classList.remove("hidden");
            } else if (currentTournamentId === 1596 || currentTournamentId === 11620) {
                elLogoComp.src = `${BACKEND_URL}?path=unique-tournament/${currentTournamentId}/image`;
                elLogoComp.classList.remove("hidden");
            } else {
                elLogoComp.classList.add("hidden");
            }
        }

        const nomeCasaFull = getScoreboardName(jogo.homeTeam, jogo.tournament).toUpperCase();
        const nomeForaFull = getScoreboardName(jogo.awayTeam, jogo.tournament).toUpperCase();
        
        const elNomeCasa = DOM.nomeCasa || document.getElementById("tvNomeCasa");
        const elNomeFora = DOM.nomeFora || document.getElementById("tvNomeFora");
        
        if (elNomeCasa) elNomeCasa.innerHTML = escapeHTML(nomeCasaFull);
        if (elNomeFora) elNomeFora.innerHTML = escapeHTML(nomeForaFull);

        if (nomeCasaFull.length > 10 && elNomeCasa) elNomeCasa.style.fontSize = "1.2rem";
        else if (elNomeCasa) elNomeCasa.style.fontSize = "";
        if (nomeForaFull.length > 10 && elNomeFora) elNomeFora.style.fontSize = "1.2rem";
        else if (elNomeFora) elNomeFora.style.fontSize = "";

        const imgLogoCasa = DOM.imgLogoCasa || document.getElementById("imgLogoCasa");
        const imgLogoFora = DOM.imgLogoFora || document.getElementById("imgLogoFora");
        if (imgLogoCasa) imgLogoCasa.src = `${BACKEND_URL}?path=team/${jogo.homeTeam.id}/image`;
        if (imgLogoFora) imgLogoFora.src = `${BACKEND_URL}?path=team/${jogo.awayTeam.id}/image`;

        teamColorCasa = jogo.homeTeam.teamColors?.primary || '#3b82f6';
        teamColorFora = jogo.awayTeam.teamColors?.primary || '#ef4444';

        const rcC = jogo.homeRedCards || 0;
        const rcF = jogo.awayRedCards || 0;
        const elRcCasa = DOM.redCardCasa || document.getElementById("tvRedCardCasa");
        const elRcFora = DOM.redCardFora || document.getElementById("tvRedCardFora");
        if (rcC > 0) { elRcCasa.classList.remove("hidden"); elRcCasa.innerHTML = rcC > 1 ? rcC : ""; } else { elRcCasa.classList.add("hidden"); }
        if (rcF > 0) { elRcFora.classList.remove("hidden"); elRcFora.innerHTML = rcF > 1 ? rcF : ""; } else { elRcFora.classList.add("hidden"); }

        const statusCode = jogo.status.code;
        const type = jogo.status?.type;
        const isLive = isJogoAoVivo(jogo);
        
        const elBadgeAoVivo = DOM.badgeAoVivo || document.getElementById("tvBadgeAoVivo");
        const elBolinhaAoVivo = DOM.bolinhaAoVivo || document.getElementById("tvBolinhaAoVivo");
        const elTextoBadge = DOM.textoBadge || document.getElementById("tvTextoBadge");
        const elPeriodo = DOM.periodo || document.getElementById("tvPeriodo");
        
        if (isLive) {
            elBadgeAoVivo.classList.add("text-red-500");
            elBadgeAoVivo.classList.remove("text-gray-500", "animate-pulse");
            elBadgeAoVivo.classList.add("animate-pulse");
            elBolinhaAoVivo.classList.add("bg-red-500");
            elBolinhaAoVivo.classList.remove("bg-gray-500");
            elTextoBadge.innerHTML = "AO VIVO";
            elPeriodo.classList.add("theme-text");
            elPeriodo.classList.remove("text-gray-400", "text-sky-400");
            cronometroRodando = true;
        } else {
            elBadgeAoVivo.classList.remove("text-red-500", "animate-pulse");
            elBadgeAoVivo.classList.add("text-gray-500");
            elBolinhaAoVivo.classList.remove("bg-red-500");
            elBolinhaAoVivo.classList.add("bg-gray-500");
            
            let txt = "ENCERRADO";
            if (statusCode === 7) txt = "INTERVALO";
            else if (statusCode === 31) txt = "2º TEMPO"; 
            else if (statusCode === 0 || type === 'notstarted') txt = "PRÉ-JOGO";
            else if (statusCode === 60 || type === 'postponed') txt = "ADIADO";
            else if (statusCode === 70 || type === 'canceled') txt = "CANCELADO";
            else if (statusCode === 120) txt = "PÊNALTIS";
            else if (statusCode === 100) txt = "ENCERRADO";
            
            elTextoBadge.innerHTML = txt;
            elPeriodo.innerHTML = txt;
            elPeriodo.classList.remove("theme-text", "text-sky-400");
            elPeriodo.classList.add("text-gray-400");
            cronometroRodando = false;
        }
        
        let currentInjuryTime = 0;

        if (isLive && jogo.time?.currentPeriodStartTimestamp) {
            const calc = calcularTempoDecorrido(jogo.time.currentPeriodStartTimestamp, statusCode);
            
            // Handle 2nd half detection by description
            if ([7, 12].includes(statusCode) || jogo.status?.description?.toLowerCase().includes('2nd')) {
                // Already handled in calcularTempoDecorrido for code 7
            }

            // Get injury time
            if (calc.injuryTimeKey) {
                currentInjuryTime = jogo.time?.[calc.injuryTimeKey] || jogo.time?.injuryTime || 0;
            }
            
            // Sincroniza se desvio for maior que 2 segundos
            if (Math.abs(minAtual - calc.min) > 0 || Math.abs(segAtual - calc.sec) > 2) {
                minAtual = calc.min;
                segAtual = calc.sec;
            }

            const periodLabel = DOM.periodLabel || document.getElementById("tvPeriodLabel");
            if (periodLabel) {
                const tempText = getPeriodLabel(statusCode, jogo.status?.description);
                if (tempText) {
                    periodLabel.innerHTML = tempText;
                    periodLabel.classList.remove("hidden");
                } else {
                    periodLabel.classList.add("hidden");
                }
            }
        } else if (jogo.statusTime?.current != null && isLive) {
            let tempoMin = jogo.statusTime.current;
            if (Math.abs(minAtual - tempoMin) > 1) { minAtual = tempoMin; segAtual = 0; }
        }

        if (ultimoPlacar.casa !== -1) {
            if (golsC > ultimoPlacar.casa) {
                atualizarPlacarComEfeito("tvGolsCasa", null, null, false);
            }
            if (golsF > ultimoPlacar.fora) {
                atualizarPlacarComEfeito("tvGolsFora", null, null, false);
            }
        }
        const golsCasaEl = DOM.golsCasa || document.getElementById("tvGolsCasa");
        const golsForaEl = DOM.golsFora || document.getElementById("tvGolsFora");
        if (golsCasaEl) golsCasaEl.innerHTML = golsC;
        if (golsForaEl) golsForaEl.innerHTML = golsF;
        ultimoPlacar = { casa: golsC, fora: golsF };
        
        const elAcrescimo = DOM.acrescimo || document.getElementById("tvAcrescimo");
        if (elAcrescimo) {
            if (currentInjuryTime > 0 && isLive) {
                elAcrescimo.innerHTML = `+${currentInjuryTime}`;
                elAcrescimo.classList.remove("hidden");
            } else {
                elAcrescimo.classList.add("hidden");
            }
        }

        atualizarRodapeSofaScore();
        buscarIncidentesSofaScore(jogoSelecionadoId, isLive);
        
        if (mostrarEstatisticas) {
            buscarEstatisticas(jogoSelecionadoId);
        }
        
        if (mostrarTabela) {
            carregarTabela(true);
        }
        
    } catch (error) {
        console.error("Erro ao atualizar dados:", error);
    }
}
