// ========== js/broadcast.js ==========
// Lógica de Tela Cheia e Transmissão para OBS (SofaScore Auto)

function iniciarTransmissaoSofaScore(id) {
    jogoSelecionadoId = id;
    modoAtual = 'auto';
    salvarSessaoAtiva(); // SALVAR PERSISTÊNCIA
    document.getElementById("painelAdmin").style.display = "none";
    document.getElementById("uiTransmissao").style.display = "block";
    ultimoPlacar = { casa: -1, fora: -1 };

    // Escala padrão do placar: 95%
    escalaPlacar = 0.95;
    const wrapper = document.getElementById("placarWrapper");
    if (wrapper) {
        const isCentered = !wrapper.style.left || wrapper.style.left === "50%";
        const transX = isCentered ? "translateX(-50%) " : "";
        wrapper.style.transformOrigin = "bottom center";
        wrapper.style.transform = `${transX}scale(${escalaPlacar})`;
    }
    const txtTam = document.getElementById("textoTamanho");
    if (txtTam) txtTam.innerText = "95%";
    
    // Limpa a tela antes de carregar
    document.getElementById("tvGolsCasa").innerHTML = "-";
    document.getElementById("tvGolsFora").innerHTML = "-";
    document.getElementById("tvPeriodo").innerHTML = "--:--";
    document.getElementById("tvScorersCasa").innerHTML = "";
    document.getElementById("tvScorersFora").innerHTML = "";
    const scorersBar = document.getElementById("tvScorersBar");
    if (scorersBar) scorersBar.classList.add("hidden");
    const penaltyBar = document.getElementById("tvPenaltyBar");
    if (penaltyBar) penaltyBar.classList.add("hidden");
    
    primeiraCargaIncidentes = true;
    ultimosIncidentesIds.clear();
    atualizarDadosSofaScore();
    iniciarCronometroSofaScore();

    if (loopDados) clearInterval(loopDados);
    loopDados = setInterval(atualizarDadosSofaScore, 10000);

    if (loopIncidentes) clearInterval(loopIncidentes);
    loopIncidentes = setInterval(() => buscarIncidentesSofaScore(id), 15000); // Polling de 15s para incidentes

    startTickerObserver();
}

let mostrarEstatisticas = false;
let mostrarTabela = false;
let currentTournamentId = null;
let currentSeasonId = null;
let currentTournamentLabel = "";
let tickerObserverLoop = null;
let currentHomeTeamId = null;
let currentAwayTeamId = null;
let scrollTabelaInterval = null;
let scrollTabelaTimeout = null;
let prevTablePositions = {};
let tableTrends = {}; // Guarda a tendência das setas para manter na tela
let h2hCountdownInterval = null;
let h2hSlideAtual = 0;
let h2hSlideInterval = null;

// Gestão de Incidentes (Gols, Cartões) - Referenciados do state.js

function voltarAoPainel() {
    // Limpar todos os intervalos
    if (loopDados) { clearInterval(loopDados); loopDados = null; }
    if (loopCronometro) { clearInterval(loopCronometro); loopCronometro = null; }
    if (manualLoop) { clearInterval(manualLoop); manualLoop = null; }
    if (loopIncidentes) { clearInterval(loopIncidentes); loopIncidentes = null; }
    if (tickerObserverLoop) { clearInterval(tickerObserverLoop); tickerObserverLoop = null; }
    
    limparSessaoAtiva(); // LIMPAR PERSISTÊNCIA
    if (scrollTabelaInterval) { clearInterval(scrollTabelaInterval); scrollTabelaInterval = null; }
    if (scrollTabelaTimeout) { clearTimeout(scrollTabelaTimeout); scrollTabelaTimeout = null; }
    if (h2hCountdownInterval) { clearInterval(h2hCountdownInterval); h2hCountdownInterval = null; }
    if (h2hSlideInterval) { clearInterval(h2hSlideInterval); h2hSlideInterval = null; }

    // Resetar estado global
    jogoSelecionadoId = null;
    cronometroRodando = false;
    manualTimerRunning = false;
    minAtual = 0;
    segAtual = 0;
    ultimoPlacar = { casa: -1, fora: -1 };
    ultimoPlacarTicker = ultimoPlacarTicker || {}; // Manter persistência do giro
    currentEventData = null;
    
    currentTournamentId = null;
    currentSeasonId = null;
    currentTournamentLabel = "";
    currentHomeTeamId = null;
    currentAwayTeamId = null;
    mostrarTabela = false;
    mostrarEstatisticas = false;
    prevTablePositions = {};
    tableTrends = {};
    mostrarH2H = false;

    isVARActive = false;
    const tvVAROverlay = document.getElementById("tvVAROverlay");
    if(tvVAROverlay) { tvVAROverlay.classList.add("hidden"); tvVAROverlay.classList.remove("flex"); }
    const btnToggleVAR = document.getElementById("btnToggleVAR");
    if(btnToggleVAR) {
        btnToggleVAR.classList.replace("bg-fuchsia-600", "bg-gray-900/80");
        btnToggleVAR.classList.replace("opacity-100", "opacity-20");
    }

    const tvH2HOverlay = document.getElementById("tvH2HOverlay");
    if (tvH2HOverlay) { tvH2HOverlay.classList.add("hidden"); tvH2HOverlay.classList.remove("flex"); }
    const btnToggleH2H = document.getElementById("btnToggleH2H");
    if (btnToggleH2H) {
        btnToggleH2H.classList.replace("bg-orange-600", "bg-gray-900/80");
        btnToggleH2H.classList.replace("opacity-100", "opacity-20");
    }

    const btnIconGols = document.querySelector("#btnToggleGols i");
    if (btnIconGols && btnIconGols.classList.contains("fa-eye-slash")) {
        btnIconGols.classList.replace("fa-eye-slash", "fa-futbol");
    }

    // Ocultar painel da tabela ao sair
    const painelTabela = document.getElementById("tvPanelTabela");
    if(painelTabela) {
        painelTabela.classList.remove("translate-x-0", "opacity-100");
        painelTabela.classList.add("translate-x-[120%]", "opacity-0");
    }
    document.getElementById("tabTabelaBody").innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">Aguardando...</td></tr>';
    
    const statsBar = document.getElementById("tvStatsBar");
    if (statsBar) statsBar.classList.add("hidden");

    const elYcCasa = document.getElementById("tvYellowCardCasa");
    if(elYcCasa) elYcCasa.classList.add("hidden");
    const elYcFora = document.getElementById("tvYellowCardFora");
    if(elYcFora) elYcFora.classList.add("hidden");
    
    const elAgregado = document.getElementById("tvAgregado");
    if (elAgregado) elAgregado.classList.add("hidden");
    const elPenCasa = document.getElementById("tvPenaltisCasa");
    if (elPenCasa) elPenCasa.classList.add("hidden");
    const elPenFora = document.getElementById("tvPenaltisFora");
    if (elPenFora) elPenFora.classList.add("hidden");

    const elAcrescimo = document.getElementById("tvAcrescimo");
    if (elAcrescimo) elAcrescimo.classList.add("hidden");

    const scorersBar = document.getElementById("tvScorersBar");
    if (scorersBar) scorersBar.classList.add("hidden");
    document.getElementById("tvScorersCasa").innerHTML = "";
    document.getElementById("tvScorersFora").innerHTML = "";
    const penaltyBar = document.getElementById("tvPenaltyBar");
    if (penaltyBar) penaltyBar.classList.add("hidden");

    const bannerSub = document.getElementById("tvSubBanner");
    if (bannerSub) {
        bannerSub.classList.remove("translate-y-0", "opacity-100");
        bannerSub.classList.add("-translate-y-full", "opacity-0");
    }

    // Resetar placar visual
    document.getElementById("tvGolsCasa").innerHTML = "0";
    document.getElementById("tvGolsFora").innerHTML = "0";
    document.getElementById("tvPeriodo").innerHTML = "00:00";
    document.getElementById("tvCampeonato").innerHTML = "SOFASCORE LIVE";
    document.getElementById("tvNomeCasa").innerHTML = "CASA";
    document.getElementById("tvNomeFora").innerHTML = "FORA";
    document.getElementById("tvTextoBadge").innerHTML = "AGUARDANDO";

    const labelBg = document.getElementById("tickerLabel");
    const labelText = document.getElementById("tickerLabelText");
    if (labelBg && labelText) {
        labelBg.className = "ticker-label bg-gradient-to-b from-gray-900 to-black border-r border-gray-700 overflow-hidden relative min-w-[300px] flex justify-center z-[5]";
        labelText.innerHTML = '<i class="fa-solid fa-bolt mr-2 text-sky-400"></i> GIRO DA RODADA';
        labelText.style.transform = 'translateY(0)';
        labelText.style.opacity = '1';
    }

    // Trocar visibilidade e garantir que os jogos sejam recarregados se o painel estiver vazio
    document.getElementById("uiTransmissao").style.display = "none";
    document.getElementById("painelAdmin").style.display = "";
    
    // Reforço: Se a lista estiver vazia, provoca uma busca
    const lista = document.getElementById("listaDeJogos");
    if (!lista || lista.innerHTML.trim() === "" || lista.innerHTML.includes("Aguardando")) {
        if (typeof buscarJogosSofaScore === 'function') buscarJogosSofaScore();
    }
}

function aplicarTemaPlacar(tornId) {
    const placar = document.getElementById("placarCard");
    const h2hCard = document.getElementById("h2hCard");
    const wrapper = document.getElementById("placarWrapper");
    if (!placar) return;
    
    // Reseta o tema atual mantendo as classes fixas
    placar.className = "placar-compacto rounded-xl flex flex-col overflow-hidden relative z-10 transition-transform duration-500";
    if (h2hCard) h2hCard.className = "h2h-panel theme-bg-dark border theme-border p-8 rounded-[2rem] shadow-2xl flex flex-col items-center w-[1100px] relative overflow-hidden transition-all duration-300";
    if (wrapper) wrapper.classList.remove("layout-nordeste2025", "layout-copa");
    
    let isCopa = false;
    let isNordeste2025 = false;
    let temaClass = "";

    if (tornId === 384) { temaClass = "theme-libertadores"; isCopa = true; }
    else if (tornId === 480 || tornId === 11539) { temaClass = "theme-sulamericana"; isCopa = true; }
    else if (tornId === 1596 || tornId === 11620) { temaClass = "theme-nordeste2025"; isNordeste2025 = true; }
    else if (tornId === 73) { temaClass = "theme-brasil"; isCopa = true; }
    else if (tornId === 17015) { temaClass = "theme-verde"; isCopa = true; }
    else if (tornId === 13076 || tornId === 10257) { temaClass = "theme-feminino"; isCopa = true; }

    if (temaClass) {
        placar.classList.add(temaClass);
        if (h2hCard) h2hCard.classList.add(temaClass);
    }

    if (isNordeste2025) {
        placar.classList.add("layout-nordeste2025");
        if (wrapper) wrapper.classList.add("layout-nordeste2025");
        if (h2hCard) h2hCard.classList.add("layout-nordeste2025");
        // Escala 95% solicitada pelo usuário
        escalaPlacar = 0.95;
        if (wrapper) {
            const isCentered = !wrapper.style.left || wrapper.style.left === "50%";
            const transX = isCentered ? "translateX(-50%) " : "";
            wrapper.style.transformOrigin = "bottom center";
            wrapper.style.transform = `${transX}scale(${escalaPlacar})`;
        }
        const txtTam = document.getElementById("textoTamanho");
        if (txtTam) txtTam.innerText = "95%";
    } else if (isCopa) {
        placar.classList.remove("rounded-xl");
        placar.classList.add("layout-copa");
        if (h2hCard) {
            h2hCard.classList.remove("rounded-[2rem]");
            h2hCard.classList.add("layout-copa");
        }
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
            // Tenta buscar a season atual se não vier no evento (raro)
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
        const elPenC = document.getElementById("tvPenaltisCasa");
        const elPenF = document.getElementById("tvPenaltisFora");
        if (penC !== undefined && penF !== undefined) {
            elPenC.innerHTML = `(${penC})`; elPenF.innerHTML = `(${penF})`;
            elPenC.classList.remove("hidden"); elPenF.classList.remove("hidden");
        } else {
            elPenC.classList.add("hidden"); elPenF.classList.add("hidden");
        }

        // Placar Agregado
        const agrC = jogo.homeScore?.aggregated ?? jogo.homeScore?.aggregate;
        const agrF = jogo.awayScore?.aggregated ?? jogo.awayScore?.aggregate;
        const elAgregado = document.getElementById("tvAgregado");
        if (agrC !== undefined && agrF !== undefined) {
            elAgregado.innerHTML = `AGR. ${agrC} - ${agrF}`;
            elAgregado.classList.remove("hidden");
        } else {
            elAgregado.classList.add("hidden");
        }

        const tidTv = jogo.tournament?.uniqueTournament?.id || jogo.tournament?.id || 0;
        document.getElementById("tvCampeonato").innerHTML = nomeCampeonatoExibicao(tidTv, jogo.tournament?.name, 'SOFASCORE LIVE').toUpperCase();
        
        // Logo da Competição
        const elLogoComp = document.getElementById("tvLogoComp");
        if (elLogoComp) {
            if (currentTournamentId === 1596 || currentTournamentId === 11620) {
                elLogoComp.src = `${BACKEND_URL}?path=unique-tournament/${currentTournamentId}/image&_t=${Date.now()}`;
                elLogoComp.classList.remove("hidden");
            } else {
                elLogoComp.classList.add("hidden");
            }
        }
        // Usar sigla de exatamente 3 letras como o usuário solicitou (ex: PAL x SAN)
        // Nome Inteligente: Seleções usa nome cheio traduzido, Clubes usa Sigla (3 letras)
        // O segundo parâmetro 'jogo.tournament' ajuda a decidir se é uma seleção ou clube.
        const nomeCasaFull = getScoreboardName(jogo.homeTeam, jogo.tournament).toUpperCase();
        const nomeForaFull = getScoreboardName(jogo.awayTeam, jogo.tournament).toUpperCase();
        
        const elNomeCasa = document.getElementById("tvNomeCasa");
        const elNomeFora = document.getElementById("tvNomeFora");
        
        elNomeCasa.innerHTML = nomeCasaFull;
        elNomeFora.innerHTML = nomeForaFull;

        // Ajuste dinâmico de fonte para nomes muito longos no placar
        if (nomeCasaFull.length > 10) elNomeCasa.style.fontSize = "1.2rem";
        else elNomeCasa.style.fontSize = "";
        
        if (nomeForaFull.length > 10) elNomeFora.style.fontSize = "1.2rem";
        else elNomeFora.style.fontSize = "";
        document.getElementById("imgLogoCasa").src = `${BACKEND_URL}?path=team/${jogo.homeTeam.id}/image&_t=${Date.now()}`;
        document.getElementById("imgLogoFora").src = `${BACKEND_URL}?path=team/${jogo.awayTeam.id}/image&_t=${Date.now()}`;

        teamColorCasa = jogo.homeTeam.teamColors?.primary || '#3b82f6';
        teamColorFora = jogo.awayTeam.teamColors?.primary || '#ef4444';

        const rcC = jogo.homeRedCards || 0;
        const rcF = jogo.awayRedCards || 0;
        const elRcCasa = document.getElementById("tvRedCardCasa");
        const elRcFora = document.getElementById("tvRedCardFora");
        if (rcC > 0) { elRcCasa.classList.remove("hidden"); elRcCasa.innerHTML = rcC > 1 ? rcC : ""; } else { elRcCasa.classList.add("hidden"); }
        if (rcF > 0) { elRcFora.classList.remove("hidden"); elRcFora.innerHTML = rcF > 1 ? rcF : ""; } else { elRcFora.classList.add("hidden"); }

        const statusCode = jogo.status.code;
        const type = jogo.status?.type;
        const isLive = isJogoAoVivo(jogo);
        
        if (isLive) {
            document.getElementById("tvBadgeAoVivo").classList.add("text-red-500");
            document.getElementById("tvBadgeAoVivo").classList.remove("text-gray-500");
            document.getElementById("tvBolinhaAoVivo").classList.add("bg-red-500");
            document.getElementById("tvBolinhaAoVivo").classList.remove("bg-gray-500");
            document.getElementById("tvBadgeAoVivo").classList.add("animate-pulse");
            document.getElementById("tvTextoBadge").innerHTML = "AO VIVO";
            document.getElementById("tvPeriodo").classList.add("theme-text");
            document.getElementById("tvPeriodo").classList.remove("text-gray-400", "text-sky-400");
            cronometroRodando = true;
        } else {
            document.getElementById("tvBadgeAoVivo").classList.remove("text-red-500");
            document.getElementById("tvBadgeAoVivo").classList.add("text-gray-500");
            document.getElementById("tvBolinhaAoVivo").classList.remove("bg-red-500");
            document.getElementById("tvBolinhaAoVivo").classList.add("bg-gray-500");
            document.getElementById("tvBadgeAoVivo").classList.remove("animate-pulse");
            
            let txt = "ENCERRADO";
            if (statusCode === 7) txt = "INTERVALO";
            else if (statusCode === 31) txt = "2º TEMPO"; 
            else if (statusCode === 0 || type === 'notstarted') txt = "PRÉ-JOGO";
            else if (statusCode === 60 || type === 'postponed') txt = "ADIADO";
            else if (statusCode === 70 || type === 'canceled') txt = "CANCELADO";
            else if (statusCode === 120) txt = "PÊNALTIS";
            else if (statusCode === 100) txt = "ENCERRADO";
            
            document.getElementById("tvTextoBadge").innerHTML = txt;
            document.getElementById("tvPeriodo").innerHTML = txt;
            document.getElementById("tvPeriodo").classList.remove("theme-text", "text-sky-400");
            document.getElementById("tvPeriodo").classList.add("text-gray-400");
            cronometroRodando = false;
        }
        
        let currentInjuryTime = 0;

        if (isLive && jogo.time?.currentPeriodStartTimestamp) {
            let decorrido = Math.floor(Date.now() / 1000) - jogo.time.currentPeriodStartTimestamp;
            if (decorrido < 0) decorrido = 0;
            let calcMin = Math.floor(decorrido / 60);
            let calcSec = decorrido % 60;

            // Detecção de período:
            // 1º tempo: code 6        | 2º tempo: code 7 ou desc '2nd half'
            // Prorrogação 1ª parte: code 100  | Prorrogação 2ª parte: code 105
            // Prorrogação intervalo: code 131 | Pênaltis: code 110, 120
            // Intervalo: code 31
            if (statusCode === 6) currentInjuryTime = jogo.time?.injuryTime1 || jogo.time?.injuryTime || 0;
            if ([7, 12].includes(statusCode) || jogo.status?.description?.toLowerCase().includes('2nd')) {
                calcMin += 45;
                currentInjuryTime = jogo.time?.injuryTime2 || jogo.time?.injuryTime || 0;
            }
            if ([100, 101].includes(statusCode)) {
                calcMin += 90; // Prorrogação 1ª parte
                currentInjuryTime = jogo.time?.injuryTime3 || jogo.time?.injuryTime || 0;
            }
            if ([105, 106].includes(statusCode)) {
                calcMin += 105; // Prorrogação 2ª parte
                currentInjuryTime = jogo.time?.injuryTime4 || jogo.time?.injuryTime || 0;
            }
            if (statusCode === 31) { calcMin = 45; calcSec = 0; }   // Intervalo
            if (statusCode === 131) { calcMin = 105; calcSec = 0; } // Intervalo da prorrogação
            
            // Sincroniza se desvio for maior que 2 segundos
            if (Math.abs(minAtual - calcMin) > 0 || Math.abs(segAtual - calcSec) > 2) {
                minAtual = calcMin;
                segAtual = calcSec;
            }

            const periodLabel = document.getElementById("tvPeriodLabel");
            if (periodLabel) {
                let tempText = "";
                if (statusCode === 6) tempText = "1T";
                else if (statusCode === 7 || jogo.status?.description?.toLowerCase().includes('2nd')) tempText = "2T";
                else if (statusCode === 31) tempText = "INT";
                else if ([100, 101].includes(statusCode)) tempText = "1T PRO";
                else if ([105, 106].includes(statusCode)) tempText = "2T PRO";
                else if (statusCode === 131) tempText = "INT PRO";
                else if ([110, 120].includes(statusCode)) tempText = "PEN";
                
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
            if (golsC > ultimoPlacar.casa) atualizarPlacarComEfeito("tvGolsCasa", null, null, false);
            if (golsF > ultimoPlacar.fora) atualizarPlacarComEfeito("tvGolsFora", null, null, false);
        }
        document.getElementById("tvGolsCasa").innerHTML = golsC;
        document.getElementById("tvGolsFora").innerHTML = golsF;
        ultimoPlacar = { casa: golsC, fora: golsF };
        
        const elAcrescimo = document.getElementById("tvAcrescimo");
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
        
        // Carrega tabela automaticamente se o painel estiver aberto
        if (mostrarTabela) {
             buscarTabelaSofaScore(jogo.tournament.id, jogo.season.id);
        }
        
        // Se a tabela estiver na tela, atualiza os pontos em tempo real silenciosamente
        if (mostrarTabela) {
            carregarTabela(true);
        }
        
    } catch (error) {
        console.error("Erro ao atualizar dados:", error);
    }
}

// ========== INCIDENTES (Gols, Cartões, Subs) ==========
async function buscarIncidentesSofaScore(eventId, isLive = true) {
    if (modoAtual === 'manual' || !eventId) return;

    const scorersCasa = document.getElementById('tvScorersCasa');
    const scorersFora = document.getElementById('tvScorersFora');
    const scorersBar = document.getElementById('tvScorersBar');
    if (!scorersCasa || !scorersFora || !scorersBar) return;

    try {
        const data = await fetchSofaScore(`event/${eventId}/incidents`);
        if (!data || !data.incidents) {
            scorersCasa.innerHTML = '';
            scorersFora.innerHTML = '';
            scorersBar.classList.add('hidden');
            const elYcC = document.getElementById("tvYellowCardCasa");
            if (elYcC) elYcC.classList.add("hidden");
            const elYcF = document.getElementById("tvYellowCardFora");
            if (elYcF) elYcF.classList.add("hidden");
            return;
        }

        // Auto-detect VAR (Apenas se o jogo estiver AO VIVO)
        const varOverlay = document.getElementById("tvVAROverlay");
        if (varOverlay) {
            const hasActiveVAR = isLive && data.incidents.some(inc => inc.incidentType === 'varDecision' && !inc.confirmed);
            if (hasActiveVAR) {
                varOverlay.classList.remove("hidden");
            } else {
                // Se não houver VAR ativo agora ou o jogo acabou, ocultamos
                // Mas não ocultamos se o VAR foi ativado manualmente e o banner ainda deve aparecer?
                // O VAR automático só deve "ativar". Se o usuário quer esconder, ele desativa.
                varOverlay.classList.add("hidden");
            }
        }

        const goleiros = { casa: [], fora: [] };
        let ycC = 0, ycF = 0;
        let rcC_count = 0, rcF_count = 0;
        
        // Processar incidentes
        data.incidents.forEach(inc => {
            // Cartões para o Placar
            if (inc.incidentType === 'card') {
                if (inc.incidentClass === 'yellow' || inc.incidentClass === 'yellowRed') {
                    if (inc.isHome) ycC++; else ycF++;
                }
                if (inc.incidentClass === 'red' || inc.incidentClass === 'yellowRed') {
                    if (inc.isHome) rcC_count++; else rcF_count++;
                }
            }

            // Gols para a Barra de Artilheiros
            if (inc.incidentType === 'goal') {
                const nome = inc.player?.shortName || inc.player?.name || 'Gol';
                const min = inc.time ? `${inc.time}'` : '';
                const isOG = inc.incidentClass === 'ownGoal' || inc.isOwnGoal;
                let display = `${nome} ${min}`.trim();
                if (isOG) display += ' (cg)';
                if (inc.incidentClass === 'penalty') display += ' (p)';

                if (inc.isHome && !isOG) goleiros.casa.push(display);
                else if (!inc.isHome && !isOG) goleiros.fora.push(display);
                else if (inc.isHome && isOG) goleiros.fora.push(display);
                else if (!inc.isHome && isOG) goleiros.casa.push(display);
            }

            // --- Triggers de Automação (Apenas novos incidentes) ---
            const id = inc.id || `${inc.incidentType}-${inc.time}-${inc.player?.name}`;
            if (!ultimosIncidentesIds.has(id)) {
                ultimosIncidentesIds.add(id);
                if (!primeiraCargaIncidentes) {
                    if (inc.incidentType === 'substitution') {
                        const sIn = inc.playerIn?.shortName || inc.playerIn?.name;
                        const sOut = inc.playerOut?.shortName || inc.playerOut?.name;
                        if (sIn && sOut) {
                            mostrarNotificacaoSubstituicao(sIn, sOut, inc.isHome);
                        }
                    }
                    else if (inc.incidentType === 'goal') {
                        const pName = inc.player?.name || inc.playerName;
                        if (pName) {
                            const tName = inc.isHome ? (currentEventData?.homeTeam?.name || 'CASA') : (currentEventData?.awayTeam?.name || 'FORA');
                            atualizarPlacarComEfeito(inc.isHome ? "tvGolsCasa" : "tvGolsFora", pName.toUpperCase(), tName.toUpperCase(), true);
                        }
                    }
                    else if (inc.incidentType === 'card') {
                        const pName = inc.player?.name || inc.playerName;
                        if (pName) {
                            const tName = inc.isHome ? (currentEventData?.homeTeam?.name || 'CASA') : (currentEventData?.awayTeam?.name || 'FORA');
                            mostrarCardNotify(pName.toUpperCase(), inc.incidentClass, tName.toUpperCase(), inc.time + "'");
                        }
                    }
                }
            }
        });

        // Atualizar UI de Cartões no Placar
        const elYcCasa = document.getElementById("tvYellowCardCasa");
        const elYcFora = document.getElementById("tvYellowCardFora");
        const elRcCasa = document.getElementById("tvRedCardCasa");
        const elRcFora = document.getElementById("tvRedCardFora");

        if (elYcCasa) {
            if (ycC > 0) { elYcCasa.classList.remove("hidden"); elYcCasa.innerHTML = ycC; } else { elYcCasa.classList.add("hidden"); }
        }
        if (elYcFora) {
            if (ycF > 0) { elYcFora.classList.remove("hidden"); elYcFora.innerHTML = ycF; } else { elYcFora.classList.add("hidden"); }
        }
        // Redilizar cartões vermelhos (Apenas se bater com o SofaScore ou vir de incidentes)
        if (elRcCasa && rcC_count > 0) {
            elRcCasa.classList.remove("hidden"); elRcCasa.innerHTML = rcC_count;
        }
        if (elRcFora && rcF_count > 0) {
            elRcFora.classList.remove("hidden"); elRcFora.innerHTML = rcF_count;
        }

        // Atualizar Barra de Artilheiros
        const textCasa = goleiros.casa.join(' • ');
        const textFora = goleiros.fora.join(' • ');
        scorersCasa.innerHTML = textCasa ? `<i class="fa-solid fa-futbol text-[9px] mr-1"></i> ${textCasa}` : '';
        scorersFora.innerHTML = textFora ? `${textFora} <i class="fa-solid fa-futbol text-[9px] ml-1"></i>` : '';
        if ((textCasa || textFora) && mostrarGols) {
            scorersBar.classList.remove('hidden');
        } else {
            scorersBar.classList.add('hidden');
        }

        primeiraCargaIncidentes = false;
        processarPenaltis(data.incidents);

    } catch (e) {
        console.error("Erro buscarIncidentes:", e);
    }
}

function processarPenaltis(incidents) {
    const penaltis = incidents.filter(i => i.incidentType === 'penaltyShootout');
    const penaltyBar = document.getElementById("tvPenaltyBar");

    if (penaltis.length === 0) {
        if (penaltyBar) penaltyBar.classList.add("hidden");
        return;
    }

    let homePens = [];
    let awayPens = [];

    penaltis.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
    penaltis.forEach(p => {
        const status = p.incidentClass === 'scored' ? 'scored' : 'missed';
        if (p.isHome) homePens.push(status);
        else awayPens.push(status);
    });

    const totalRounds = Math.max(5, homePens.length, awayPens.length);

    const renderDots = (pens) => {
        let html = '';
        for (let i = 0; i < totalRounds; i++) {
            if (i < pens.length) {
                if (pens[i] === 'scored') html += `<div class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></div>`;
                else html += `<div class="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_5px_rgba(220,38,38,0.8)]"></div>`;
            } else {
                html += `<div class="w-2.5 h-2.5 rounded-full bg-gray-800 border border-gray-600"></div>`;
            }
        }
        return html;
    };

    document.getElementById("tvPenaltyDotsCasa").innerHTML = renderDots(homePens);
    document.getElementById("tvPenaltyDotsFora").innerHTML = renderDots(awayPens);
    if (penaltyBar) penaltyBar.classList.remove("hidden");
}

async function buscarEstatisticas(eventId) {
    const statsBar = document.getElementById("tvStatsBar");
    if (!statsBar) return;

    try {
        const data = await fetchSofaScore(`event/${eventId}/statistics`);
        if (!data.statistics || data.statistics.length === 0) {
            statsBar.classList.add('hidden');
            return;
        }

        const periodStats = data.statistics[0].groups;
        let stats = {
            posse: { c: '50%', f: '50%' },
            chutes: { c: 0, f: 0 },
            escanteios: { c: 0, f: 0 },
            faltas: { c: 0, f: 0 },
            cartoes: { c: 0, f: 0 },
            chances: { c: 0, f: 0 }
        };

        const mapTerms = {
            "Ball possession": "posse", "Posse de bola": "posse",
            "Shots on target": "chutes", "Chutes no gol": "chutes",
            "Corner kicks": "escanteios", "Escanteios": "escanteios",
            "Fouls": "faltas", "Faltas": "faltas",
            "Yellow cards": "cartoes", "Cartões amarelos": "cartoes",
            "Big chances": "chances", "Grandes chances": "chances"
        };

        periodStats.forEach(grupo => {
            grupo.statisticsItems.forEach(item => {
                const term = item.name;
                const key = mapTerms[term];
                if (key) {
                    stats[key] = { c: item.home, f: item.away };
                }
            });
        });

        let valC = parseInt(stats.posse.c) || 50;
        let valF = parseInt(stats.posse.f) || 50;

        document.getElementById("tvPosseCasa").innerText = valC + "%";
        document.getElementById("tvPosseFora").innerText = valF + "%";
        document.getElementById("tvPosseBarraCasa").style.width = valC + "%";
        document.getElementById("tvPosseBarraCasa").style.backgroundColor = teamColorCasa;
        document.getElementById("tvPosseBarraFora").style.width = valF + "%";
        document.getElementById("tvPosseBarraFora").style.backgroundColor = teamColorFora;

        document.getElementById("tvChutesCasa").innerText = stats.chutes.c;
        document.getElementById("tvChutesFora").innerText = stats.chutes.f;
        document.getElementById("tvEscanteiosCasa").innerText = stats.escanteios.c;
        document.getElementById("tvEscanteiosFora").innerText = stats.escanteios.f;
        document.getElementById("tvFaltasCasa").innerText = stats.faltas.c;
        document.getElementById("tvFaltasFora").innerText = stats.faltas.f;
        document.getElementById("tvCartoesCasa").innerText = stats.cartoes.c;
        document.getElementById("tvCartoesFora").innerText = stats.cartoes.f;
        document.getElementById("tvChancesCasa").innerText = stats.chances.c;
        document.getElementById("tvChancesFora").innerText = stats.chances.f;

        if (mostrarEstatisticas) {
            statsBar.classList.remove('hidden');
        }

        // Tabela Automática
        if (mostrarTabela && jogo.tournament && jogo.season) {
            buscarTabelaSofaScore(jogo.tournament.id, jogo.season.id);
        }
    } catch (e) {
        // Se for 404, significa que o jogo não tem estatísticas (comum em ligas menores ou jogos futuros)
        // Ocultamos a barra silenciosamente sem poluir o console.
        statsBar.classList.add('hidden');
    }
}

/**
 * Busca o jogador com a maior nota (SofaScore Rating) e exibe o card
 */
async function buscarMelhorEmCampo(eventId) {
    if (!eventId) {
        // Mock para teste se não houver ID
        exibirJogadorDestaque({
            name: "Vinícius Júnior",
            id: 826131,
            rating: 9.1
        });
        return;
    }

    try {
        const data = await fetchSofaScore(`event/${eventId}/lineups`);
        if (!data || !data.home || !data.away) return;

        let bestPlayer = null;
        let maxRating = 0;

        const processLineup = (players) => {
            players.forEach(p => {
                const rating = parseFloat(p.statistics?.rating);
                if (rating && rating > maxRating) {
                    maxRating = rating;
                    bestPlayer = {
                        name: p.player?.shortName || p.player?.name,
                        id: p.player?.id,
                        rating: rating
                    };
                }
            });
        };

        processLineup(data.home.players);
        processLineup(data.away.players);

        if (bestPlayer) {
            exibirJogadorDestaque(bestPlayer);
        }
    } catch (e) {
        console.error("Erro buscarMelhorEmCampo:", e);
    }
}

let isBestPlayerShowing = false;

function exibirJogadorDestaque(player) {
    const card = document.getElementById("tvBestPlayerCard");
    const mainScore = document.getElementById("tvMainScoreRow");
    
    // Se já estiver aparecendo e clicarmos de novo, retiramos imediatamente
    if (isBestPlayerShowing) {
        removerJogadorDestaque();
        return;
    }

    const img = document.getElementById("tvBestPlayerPhoto");
    const name = document.getElementById("tvBestPlayerName");
    const ratingEl = document.getElementById("tvBestPlayerRating");

    if (!card || !mainScore || !img || !name || !ratingEl) return;

    // Configura os dados do jogador
    img.src = `${BACKEND_URL}?path=player/${player.id}/image`;
    name.innerText = player.name;
    ratingEl.innerText = player.rating.toFixed(1);

    // Nota sempre branca para manter contraste (cores apenas sutis se necessário)
    ratingEl.classList.remove("rating-gold", "rating-green", "rating-lightgreen", "rating-yellow", "rating-orange");
    if (player.rating >= 8.5) ratingEl.style.color = "#ffffff";
    else ratingEl.style.color = "#cccccc";

    // Limpar timeouts anteriores
    if (window.bestPlayerTimeout) clearTimeout(window.bestPlayerTimeout);

    // MARCAR COMO APARECENDO
    isBestPlayerShowing = true;

    // INICIAR TRANSIÇÃO (Placar sai, Craque entra)
    mainScore.classList.add("slide-out");
    card.classList.remove("hidden");
    
    // Forçar reflow
    void card.offsetWidth;
    card.classList.add("show");

    // Sair automaticamente após 30 segundos
    window.bestPlayerTimeout = setTimeout(() => {
        removerJogadorDestaque();
    }, 30000);
}

function removerJogadorDestaque() {
    const card = document.getElementById("tvBestPlayerCard");
    const mainScore = document.getElementById("tvMainScoreRow");
    
    if (!card || !mainScore) return;

    isBestPlayerShowing = false;
    if (window.bestPlayerTimeout) clearTimeout(window.bestPlayerTimeout);

    card.classList.remove("show");
    mainScore.classList.remove("slide-out");
    
    // Esconder o card fisicamente após a animação de saída
    setTimeout(() => {
        if (!isBestPlayerShowing) {
            card.classList.add("hidden");
        }
    }, 700);
}
async function buscarTabelaSofaScore(tournId, seasonId) {
    const tableBody = document.getElementById("tabTabelaBody");
    if (!tableBody) return;

    try {
        const data = await fetchSofaScore(`tournament/${tournId}/season/${seasonId}/standings/total`);
        if (!data.standings || data.standings.length === 0) return;

        const rows = data.standings[0].rows;
        let html = '';

        // Pegar apenas os 10 primeiros ou os times em volta do jogo atual
        // Para simplificar agora, pegaremos os 10 primeiros
        rows.slice(0, 10).forEach(row => {
            const isHome = row.team.id === (jogoAtualGlobal?.homeTeam?.id);
            const isAway = row.team.id === (jogoAtualGlobal?.awayTeam?.id);
            const activeClass = (isHome || isAway) ? "bg-white/10" : "";
            
            html += `
                <tr class="border-b border-white/5 ${activeClass}">
                    <td class="py-2 pl-2 text-left font-black text-gray-400">${row.position}</td>
                    <td class="py-2">
                        <div class="flex items-center gap-2">
                            <img src="${BACKEND_URL}?path=team/${row.team.id}/image" class="w-4 h-4 object-contain">
                            <span class="truncate max-w-[100px] uppercase font-bold text-[10px]">${(row.team.nameCode || row.team.shortName || row.team.name).toUpperCase()}</span>
                        </div>
                    </td>
                    <td class="py-2 text-center font-black text-white">${row.points}</td>
                    <td class="py-2 text-center text-gray-400">${row.matches}</td>
                    <td class="py-2 text-center text-gray-400">${row.pointsDiff}</td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
    } catch (e) {
        console.error("Erro ao buscar tabela:", e);
    }
}


async function atualizarRodapeSofaScore() {
    try {
        const { iso: dataHoje } = getDataComOffset(0);
        
        // Buscar eventos agendados e ao vivo simultaneamente para ter os dados mais rápidos
        const [dataSched, dataLive] = await Promise.all([
            fetchSofaScore(`sport/football/scheduled-events/${dataHoje}`),
            fetchSofaScore('sport/football/events/live').catch(() => ({ events: [] }))
        ]);
        
        let tickerHTML = "";
        const eventos = dataSched.events || [];

        // Mesclar dados ao vivo para garantir que os gols apareçam instantaneamente
        if (dataLive.events) {
            dataLive.events.forEach(liveEv => {
                const idx = eventos.findIndex(e => e.id === liveEv.id);
                if (idx !== -1) eventos[idx] = liveEv;
                else eventos.push(liveEv);
            });
        }

        // Filtrar apenas os torneios solicitados (Expandido para incluir todos os fixos)
        const eventosFiltrados = eventos.filter(j => {
            const tornId = j.tournament?.uniqueTournament?.id || j.tournament?.id;
            return GIRO_TORNEIOS_IDS.includes(tornId) || CAMPEONATOS_FIXOS_CODIGO.includes(tornId);
        });

        if (eventosFiltrados.length > 0) {
            // Ordena cronologicamente por horário de início para mostrar a sequência real do dia
            eventosFiltrados.sort((a, b) => {
                const timeA = a.startTimestamp || 0;
                const timeB = b.startTimestamp || 0;
                
                if (timeA !== timeB) return timeA - timeB;

                const tornIdA = a.tournament?.uniqueTournament?.id || a.tournament?.id;
                const tornIdB = b.tournament?.uniqueTournament?.id || b.tournament?.id;
                const idxA = GIRO_TORNEIOS_IDS.indexOf(tornIdA);
                const idxB = GIRO_TORNEIOS_IDS.indexOf(tornIdB);
                
                return (idxA !== -1 ? idxA : 999) - (idxB !== -1 ? idxB : 999);
            });

            let currentTournamentName = "";

            eventosFiltrados.forEach(j => {
                const isLive = isJogoAoVivo(j);
                const status = j.status?.code;
                const type = j.status?.type;

                const currentHome = j.homeScore?.current ?? 0;
                const currentAway = j.awayScore?.current ?? 0;
                const tornId = j.tournament?.uniqueTournament?.id || j.tournament?.id;

                let roundText = "";
                if (j.roundInfo?.round) {
                    roundText = ` - RODADA ${String(j.roundInfo.round).padStart(2, '0')}`;
                } else if (j.roundInfo?.name) {
                    roundText = ` - ${mapTraducoesCampeonato(j.roundInfo.name).toUpperCase()}`;
                }
                const nomeCompeticaoTicker = `${mapTraducoesCampeonato(j.tournament.name)}${roundText}`;

                // Detecção de gol no Giro da Rodada (Apenas em jogos rolando)
                if (ultimoPlacarTicker[j.id] && isLive) {
                    const golCasa = currentHome > ultimoPlacarTicker[j.id].home;
                    const golFora = currentAway > ultimoPlacarTicker[j.id].away;
                    if (golCasa || golFora) {
                        let timeGol = golCasa ? (j.homeTeam.shortName || j.homeTeam.name) : (j.awayTeam.shortName || j.awayTeam.name);
                        mostrarAlertaGolTicker(traduzirNomeEquipe(timeGol), j.homeTeam, j.awayTeam, currentHome, currentAway, nomeCompeticaoTicker);
                    }
                }
                ultimoPlacarTicker[j.id] = { home: currentHome, away: currentAway };

                let tempoStr = "";
                if (isLive) {
                    if (j.time?.currentPeriodStartTimestamp) {
                        let decorrido = Math.floor(Date.now() / 1000) - j.time.currentPeriodStartTimestamp;
                        if (decorrido < 0) decorrido = 0;
                        let min = Math.floor(decorrido / 60);
                        let sec = decorrido % 60;
                        if (status === 7 || status === 12 || status === 34 || status === 35) min += 45;
                        if (status === 31) { min = 45; sec = 0; }
                        let display = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
                        tempoStr = `<span data-tempo-jogo="true" data-ts="${j.time.currentPeriodStartTimestamp}" data-code="${status}">${display}</span>`;
                    } else {
                        tempoStr = j.statusTime?.current ? j.statusTime.current + "'" : "AO VIVO";
                    }
                } else {
                    const dt = new Date(j.startTimestamp * 1000);
                    const dataLocalIso = dt.toLocaleDateString('en-CA', { timeZone: APP_TIMEZONE });
                    const isHoje = dataLocalIso === dataHoje;
                    const diaMes = dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: APP_TIMEZONE });

                    if (status === 100 || type === 'finished') {
                        tempoStr = isHoje ? "FIM" : `FIM ${diaMes}`;
                    }
                    else if (status === 31) tempoStr = "INT";
                    else if (status === 0 || type === 'notstarted') {
                        const horaLocal = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                        tempoStr = isHoje ? horaLocal : `${diaMes} ${horaLocal}`;
                    }
                    else tempoStr = "---";
                }

                // Pênaltis e Agregado para o Giro da Rodada
                const penC = j.homeScore?.penalties;
                const penF = j.awayScore?.penalties;
                const agrC = j.homeScore?.aggregated ?? j.homeScore?.aggregate;
                const agrF = j.awayScore?.aggregated ?? j.awayScore?.aggregate;

                let extraPenC = penC !== undefined ? `<span class="text-sky-400 text-sm font-black mx-1">(${penC})</span>` : '';
                let extraPenF = penF !== undefined ? `<span class="text-sky-400 text-sm font-black mx-1">(${penF})</span>` : '';
                let extraAgr = (agrC !== undefined && agrF !== undefined) ? `<span class="text-gray-400 text-[11px] ml-4 font-bold uppercase tracking-widest bg-gray-800 px-2 py-0.5 rounded border border-gray-600">AGR. ${agrC} - ${agrF}</span>` : '';

                let rcC = "";
                if (j.homeRedCards) {
                    for(let i=0; i<j.homeRedCards; i++) rcC += `<span class="bg-red-600 w-1.5 h-2.5 inline-block rounded-[1px] ml-1 shadow-[0_0_2px_rgba(220,38,38,0.8)]"></span>`;
                }
                let rcF = "";
                if (j.awayRedCards) {
                    for(let i=0; i<j.awayRedCards; i++) rcF += `<span class="bg-red-600 w-1.5 h-2.5 inline-block rounded-[1px] mr-1 shadow-[0_0_2px_rgba(220,38,38,0.8)]"></span>`;
                }

                const logoTorneio = `${BACKEND_URL}?path=unique-tournament/${tornId}/image`;

                // Cria a "Faixa" flutuante de separação entre campeonatos
                if (nomeCompeticaoTicker !== currentTournamentName) {
                    tickerHTML += `
                        <div class="ticker-item !border-none !px-4 ml-8" data-tournament="${nomeCompeticaoTicker}" data-logo="${logoTorneio}">
                            <div class="bg-gray-800 text-white font-black uppercase tracking-widest px-5 py-1.5 rounded-full shadow-lg flex items-center gap-2 border border-gray-600">
                                <img src="${logoTorneio}" class="w-4 h-4 object-contain brightness-200" onerror="this.style.display='none'"> ${nomeCompeticaoTicker}
                            </div>
                        </div>
                    `;
                    currentTournamentName = nomeCompeticaoTicker;
                }

                tickerHTML += `
                    <div class="ticker-item" data-tournament="${nomeCompeticaoTicker}" data-logo="${logoTorneio}">
                        <span class="ticker-status ${isLive ? 'text-sky-400' : 'text-gray-400'} mr-2">[${tempoStr}]</span>
                        <img src="${BACKEND_URL}?path=team/${j.homeTeam.id}/image" class="h-5 mr-2 object-contain rounded">
                        ${traduzirNomeEquipe(j.homeTeam.shortName || j.homeTeam.name)}${rcC}
                        ${extraPenC}
                        <span class="text-white font-black mx-1">${currentHome}</span>
                        <span class="text-gray-400">vs</span>
                        <span class="text-white font-black mx-1">${currentAway}</span>
                        ${extraPenF}
                        ${rcF}${traduzirNomeEquipe(j.awayTeam.shortName || j.awayTeam.name)}
                        <img src="${BACKEND_URL}?path=team/${j.awayTeam.id}/image" class="h-5 ml-2 object-contain rounded">
                        ${extraAgr}
                    </div>
                `;
            });
        }
        
        if (tickerHTML === "") {
            tickerHTML = "<div class='ticker-item'><i class='fa-solid fa-futbol mr-1'></i> Nenhum jogo dos principais campeonatos brasileiros hoje.</div>";
        }
        
        document.getElementById("tvTicker").innerHTML = tickerHTML + tickerHTML;
    } catch (e) { 
        console.error("Erro no ticker:", e); 
    }
}

function mostrarAlertaGolTicker(timeGolNome, timeCasa, timeFora, golsC, golsF, torneioNome) {
    const overlay = document.getElementById("tickerGoalOverlay");
    const textEl = document.getElementById("tickerGoalText");
    if (!overlay || !textEl) return;

    const siglaCasa = (timeCasa.shortName || timeCasa.name).substring(0, 3).toUpperCase();
    const siglaFora = (timeFora.shortName || timeFora.name).substring(0, 3).toUpperCase();

    // Puxando escudos dos times
    const logoC = `${BACKEND_URL}?path=team/${timeCasa.id}/image`;
    const logoF = `${BACKEND_URL}?path=team/${timeFora.id}/image`;

    textEl.innerHTML = `
        <span class="bg-gray-800 border border-gray-600 text-white px-3 py-0.5 rounded-full text-[10px] uppercase tracking-widest shadow-md mr-4 flex items-center gap-1.5"><i class="fa-solid fa-trophy text-gray-400"></i> ${torneioNome}</span>
        <span class="text-sky-400 italic mr-5 flex items-center gap-2"><i class="fa-solid fa-futbol animate-bounce"></i> GOL DO ${timeGolNome.toUpperCase()}!</span>
        <img src="${logoC}" class="h-6 mx-2 object-contain drop-shadow-md" onerror="this.style.display='none'">
        <span class="font-normal mx-1">${siglaCasa}</span> 
        <span class="text-white font-black mx-1">${golsC}</span> 
        <span class="text-gray-500 font-normal text-sm mx-1">x</span> 
        <span class="text-white font-black mx-1">${golsF}</span> 
        <span class="font-normal mx-1">${siglaFora}</span>
        <img src="${logoF}" class="h-6 mx-2 object-contain drop-shadow-md" onerror="this.style.display='none'">
    `;
    
    // Suporte a tema Nordeste no Giro
    if (torneioNome.toUpperCase().includes("NORDESTE")) {
        overlay.classList.add("nordeste-theme");
    } else {
        overlay.classList.remove("nordeste-theme");
    }

    overlay.classList.remove("ticker-goal-anim");
    void overlay.offsetWidth; // Reflow forçar reinício da animação
    overlay.classList.add("ticker-goal-anim");
}

let estaTrocandoLabel = false;
function startTickerObserver() {
    if (tickerObserverLoop) clearInterval(tickerObserverLoop);
    currentTournamentLabel = "GIRO DA RODADA";
    estaTrocandoLabel = false;
    
    tickerObserverLoop = setInterval(() => {
        const labelEl = document.getElementById('tickerLabel');
        if (!labelEl || estaTrocandoLabel || document.getElementById('uiTransmissao').style.display === "none") return;

        const triggerX = labelEl.getBoundingClientRect().right;

        const items = document.querySelectorAll('.ticker-item[data-tournament]');
        for (let item of items) {
            const rect = item.getBoundingClientRect();
            // O gatilho dispara quando a borda esquerda do jogo passa pela borda direita do título
            if (rect.left >= triggerX - 80 && rect.left <= triggerX + 20) {
                const tourn = item.getAttribute('data-tournament');
                const logo = item.getAttribute('data-logo');
                
                if (tourn && tourn !== currentTournamentLabel) {
                    currentTournamentLabel = tourn;
                    animarTrocaLabel(tourn, logo);
                }
                break;
            }
        }
    }, 150);
}

function animarTrocaLabel(novoTexto, logo) {
    const labelBg = document.getElementById('tickerLabel');
    const labelText = document.getElementById('tickerLabelText');
    if (!labelBg || !labelText || estaTrocandoLabel) return;

    estaTrocandoLabel = true;

    // Reset de classes apenas se necessário, mantendo a largura fixa
    labelBg.className = `ticker-label overflow-hidden relative flex items-center justify-center z-[5] bg-gradient-to-b from-gray-900 to-black border-r border-gray-700 shadow-[5px_0_15px_rgba(0,0,0,0.5)]`;

    labelText.style.transition = 'all 0.4s cubic-bezier(0.5, 0, 0.5, 1)';
    labelText.style.transform = 'translateY(-100%)';
    labelText.style.opacity = '0';

    setTimeout(() => {
        const imgHtml = logo ? `<img src="${logo}" class="w-6 h-6 object-contain mr-3 brightness-200" onerror="this.style.display='none'">` : `<i class="fa-solid fa-trophy mr-3 text-gray-400"></i>`;
        labelText.innerHTML = `<div class="flex items-center px-4 w-full justify-center truncate text-[12px] whitespace-nowrap">${imgHtml}${novoTexto.toUpperCase()}</div>`;
        
        labelText.style.transition = 'none';
        labelText.style.transform = 'translateY(100%)';
        
        void labelText.offsetWidth; // Reflow forçado

        labelText.style.transition = 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
        labelText.style.transform = 'translateY(0)';
        labelText.style.opacity = '1';

        // Libera a trava após a animação de entrada terminar
        setTimeout(() => {
            estaTrocandoLabel = false;
        }, 600);
    }, 450); 
}

function atualizarDotsH2H() {
    const dots = document.querySelectorAll('#h2hDots .h2h-dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('h2h-dot-active', index === h2hSlideAtual);
    });
}

function irParaSlideH2H(index) {
    const track = document.getElementById('h2hSlidesTrack');
    if (!track) return;
    const totalSlides = track.children.length;
    h2hSlideAtual = (index + totalSlides) % totalSlides;
    track.style.transform = `translateX(-${h2hSlideAtual * 100}%)`;
    atualizarDotsH2H();
}

function mudarSlideH2H(delta) {
    irParaSlideH2H(h2hSlideAtual + delta);
}

function iniciarSlidesH2H() {
    if (h2hSlideInterval) clearInterval(h2hSlideInterval);
    h2hSlideInterval = setInterval(() => mudarSlideH2H(1), 6000);
}

const H2H_TRANSLATIONS = {
    // Status
    'Expected': 'Previsto',
    'Postponed': 'Adiado',
    'Canceled': 'Cancelado',
    'Finished': 'Encerrado',
    'Ended': 'Encerrado',
    'In progress': 'Em andamento',
    'Not started': 'Não iniciado',
    'Halftime': 'Intervalo',
    'Awaiting updates': 'Aguardando atualizações',
    'LIVE': 'AO VIVO',
    'ROLANDO': 'AO VIVO',
    // Rodadas / Fases
    'Round': 'Rodada',
    'Quarter-finals': 'Quartas de Final',
    'Semi-finals': 'Semifinais',
    'Final': 'Final',
    'Group': 'Grupo',
    'Group A': 'Grupo A',
    'Group B': 'Grupo B',
    'Group C': 'Grupo C',
    'Group D': 'Grupo D',
    'Group E': 'Grupo E',
    'Group f': 'Grupo F',
    'Group G': 'Grupo G',
    'Group H': 'Grupo H',
    'Round of 16': 'Oitavas de Final',
    'Round of 32': 'Dezesseis-avos de Final',
    'Round of 64': 'Trinta-e-dois-avos de Final',
    'Round of 128': 'Sessenta-e-quatro-avos de Final',
    'First leg': 'Ida',
    'Second leg': 'Volta',
    'Third place': 'Terceiro Lugar',
    'Play-offs': 'Play-offs',
    'Qualification': 'Qualificação',
    'Pre-match': 'Pré-jogo',
};

function traduzirH2H(texto) {
    if (!texto) return '';
    let traduzido = texto;
    Object.keys(H2H_TRANSLATIONS).forEach(key => {
        const regex = new RegExp(key, 'gi');
        traduzido = traduzido.replace(regex, H2H_TRANSLATIONS[key]);
    });
    return traduzido;
}

async function carregarH2H() {
    document.getElementById("h2hNomeCasa").innerText = document.getElementById("tvNomeCasa").innerText;
    document.getElementById("h2hNomeFora").innerText = document.getElementById("tvNomeFora").innerText;
    document.getElementById("h2hLogoCasa").src = document.getElementById("imgLogoCasa").src;
    document.getElementById("h2hLogoFora").src = document.getElementById("imgLogoFora").src;
    
    const isManual = modoAtual === 'manual';
    
    const tidH2h = currentEventData?.tournament?.uniqueTournament?.id || currentTournamentId || 0;
    const tornNameApi = currentEventData?.tournament?.name || '';
    const tornName = nomeCampeonatoExibicao(tidH2h, tornNameApi, document.getElementById("tvCampeonato").innerText || '-');
    document.getElementById("h2hCompetition").innerText = tornName.toUpperCase();
    
    const tornId = currentEventData?.tournament?.uniqueTournament?.id || currentTournamentId;
    const logoComp = document.getElementById("h2hCompLogo");
    if (tornId) {
        logoComp.src = `${BACKEND_URL}?path=unique-tournament/${tornId}/image`;
        logoComp.style.display = 'block';
    } else {
        logoComp.style.display = 'none';
    }

    const roundName = currentEventData?.roundInfo?.name || "";
    const roundInfo = traduzirH2H(roundName || "PRÉ-JOGO");
    document.getElementById("h2hPhase").innerText = roundInfo.toUpperCase();
    document.getElementById("h2hRound").innerText = roundInfo.toUpperCase();
    document.getElementById("h2hStatus").innerText = traduzirH2H(currentEventData?.status?.description || 'PRÉ-JOGO').toUpperCase();

    const dtStart = currentEventData?.startTimestamp;
    if (dtStart) {
        document.getElementById("h2hKickoff").innerText = new Date(dtStart * 1000).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: APP_TIMEZONE
        });
    } else {
        document.getElementById("h2hKickoff").innerText = '-';
    }

    const venue = currentEventData?.venue?.name || currentEventData?.venue?.city?.name || 'Local não informado';
    document.getElementById("h2hVenue").innerText = venue;
    document.getElementById("h2hCity").innerText = (currentEventData?.venue?.city?.name || '-').toUpperCase();
    
    // Busca o Manager e o Árbitro na API principal
    let referee = currentEventData?.referee?.name || 'Árbitro não informado';
    document.getElementById("h2hReferee").innerText = referee;

    let managerCasa = currentEventData?.homeTeam?.manager?.name || currentEventData?.homeManager?.name || '-';
    let managerFora = currentEventData?.awayTeam?.manager?.name || currentEventData?.awayManager?.name || '-';
    document.getElementById("h2hManagerCasa").innerText = managerCasa.toUpperCase();
    document.getElementById("h2hManagerFora").innerText = managerFora.toUpperCase();
    
    try {
        // Tentativa de buscar info extras se não vieram no payload principal
        const mData = await fetchSofaScore(`event/${jogoSelecionadoId}/managers`);
        if (mData.homeManager?.name) document.getElementById("h2hManagerCasa").innerText = mData.homeManager.name.toUpperCase();
        if (mData.awayManager?.name) document.getElementById("h2hManagerFora").innerText = mData.awayManager.name.toUpperCase();
    } catch(e) {}

    if (h2hCountdownInterval) clearInterval(h2hCountdownInterval);
    const countdownEl = document.getElementById("h2hCountdown");
    const countdownLabelEl = document.getElementById("h2hCountdownLabel");
    if (dtStart && currentEventData?.status?.type === 'notstarted') {
        const updateCountdown = () => {
            const now = Math.floor(Date.now() / 1000);
            let diff = dtStart - now;
            if (diff <= 0) {
                if (countdownLabelEl) countdownLabelEl.innerText = "STATUS";
                countdownEl.innerText = traduzirH2H(currentEventData?.status?.description || "AO VIVO").toUpperCase();
                countdownEl.classList.remove("theme-text", "text-orange-500");
                countdownEl.classList.add("text-emerald-500", "text-long");
                clearInterval(h2hCountdownInterval);
                return;
            }
            countdownEl.classList.remove("text-emerald-500", "text-orange-500", "text-long");
            countdownEl.classList.add("theme-text");
            const h = Math.floor(diff / 3600);
            diff %= 3600;
            const m = Math.floor(diff / 60);
            const s = diff % 60;
            if (h > 24) {
                const d = Math.floor(h / 24);
                if (countdownLabelEl) countdownLabelEl.innerText = "FALTAM";
                countdownEl.innerText = `${d} DIAS`;
                countdownEl.classList.add("text-long");
            } else {
                if (countdownLabelEl) countdownLabelEl.innerText = "INÍCIO EM";
                countdownEl.innerText = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
            }
        };
        updateCountdown();
        h2hCountdownInterval = setInterval(updateCountdown, 1000);
    } else {
        if (countdownLabelEl) countdownLabelEl.innerText = "STATUS";
        countdownEl.innerText = currentEventData?.status?.description?.toUpperCase() || (isManual ? "MODO MANUAL" : "AO VIVO");
        countdownEl.classList.remove("theme-text", "text-orange-500");
        countdownEl.classList.add("text-emerald-500", "text-long");
    }

    const renderForm = (formArray, containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        if (!formArray || formArray.length === 0) {
            container.innerHTML = '<span class="text-gray-500 text-xs font-bold">Sem dados recentes</span>';
            return;
        }
        let html = '';
        formArray.forEach(char => {
            let bg = 'bg-gray-600'; let pt = char;
            if (char === 'W') { bg = 'bg-emerald-500'; pt = 'V'; }
            if (char === 'D') { bg = 'bg-gray-500'; pt = 'E'; }
            if (char === 'L') { bg = 'bg-red-500'; pt = 'D'; }
            html += `<div class="w-7 h-7 rounded flex items-center justify-center text-white font-black text-[12px] ${bg} shadow-md">${pt}</div>`;
        });
        container.innerHTML = html;
    };

    const renderResumo = (formArray, resumeId) => {
        const el = document.getElementById(resumeId);
        if (!el) return;
        if (!formArray || formArray.length === 0) {
            el.innerText = 'Sem histórico recente';
            return;
        }

        const wins = formArray.filter(r => r === 'W').length;
        const draws = formArray.filter(r => r === 'D').length;
        const losses = formArray.filter(r => r === 'L').length;
        el.innerText = `${wins}V ${draws}E ${losses}D nas últimas ${formArray.length}`;
    };

    const renderRecentes = (eventos, teamId, containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        const recentes = (eventos || [])
            .filter(ev => ev.status?.code === 100 || ev.status?.type === 'finished')
            .slice(0, 4);

        if (!recentes.length) {
            container.innerHTML = '<div class="text-center text-gray-500 text-xs italic">Sem jogos recentes</div>';
            return;
        }

        container.innerHTML = recentes.map(ev => {
            const isHome = ev.homeTeam?.id === teamId;
            const rival = isHome ? (ev.awayTeam?.shortName || ev.awayTeam?.name || '-') : (ev.homeTeam?.shortName || ev.homeTeam?.name || '-');
            const golsPro = isHome ? (ev.homeScore?.current ?? 0) : (ev.awayScore?.current ?? 0);
            const golsContra = isHome ? (ev.awayScore?.current ?? 0) : (ev.homeScore?.current ?? 0);
            const data = ev.startTimestamp
                ? new Date(ev.startTimestamp * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: APP_TIMEZONE })
                : '--/--';
            const resultado = golsPro > golsContra ? 'V' : golsPro < golsContra ? 'D' : 'E';
            const cor = resultado === 'V' ? 'text-emerald-400' : resultado === 'D' ? 'text-red-400' : 'text-gray-300';

            return `
                <div class="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2">
                    <div class="flex flex-col min-w-0">
                        <span class="text-white font-bold text-sm truncate">${rival}</span>
                        <span class="text-[10px] uppercase tracking-widest text-gray-500">${data}</span>
                    </div>
                    <div class="flex items-center gap-3 shrink-0">
                        <span class="text-sm font-black ${cor}">${resultado}</span>
                        <span class="text-white font-black text-sm">${golsPro}-${golsContra}</span>
                    </div>
                </div>
            `;
        }).join('');
    };

    const extrairFormaRecente = (eventos, teamId) => {
        if (!Array.isArray(eventos)) return [];

        return eventos
            .filter(ev => {
                const code = ev.status?.code;
                const type = ev.status?.type;
                return code === 100 || type === 'finished';
            })
            .slice(0, 5)
            .map(ev => {
                const isHome = ev.homeTeam?.id === teamId;
                const golsPro = isHome ? (ev.homeScore?.current ?? 0) : (ev.awayScore?.current ?? 0);
                const golsContra = isHome ? (ev.awayScore?.current ?? 0) : (ev.homeScore?.current ?? 0);

                if (golsPro > golsContra) return 'W';
                if (golsPro < golsContra) return 'L';
                return 'D';
            });
    };

    const carregarFormaTime = async (teamId, containerId) => {
        try {
            const data = await fetchSofaScore(`team/${teamId}/events/last/0`);
            const eventos = data?.events || data?.lastEvents || data?.previousEvents || [];
            const forma = extrairFormaRecente(eventos, teamId);
            renderForm(forma, containerId);
            renderResumo(forma, containerId === "h2hFormCasa" ? "h2hResumoCasa" : "h2hResumoFora");
            renderRecentes(eventos, teamId, containerId === "h2hFormCasa" ? "h2hRecentCasa" : "h2hRecentFora");
        } catch (e) {
            renderForm([], containerId);
            renderResumo([], containerId === "h2hFormCasa" ? "h2hResumoCasa" : "h2hResumoFora");
            renderRecentes([], teamId, containerId === "h2hFormCasa" ? "h2hRecentCasa" : "h2hRecentFora");
        }
    };

    const renderStandings = async () => {
        const container = document.getElementById("h2hStandingsContainer");
        if (isManual || !currentTournamentId || !currentSeasonId) {
            container.innerHTML = '<div class="text-center text-gray-500 text-xs italic">Tabela não disponível</div>';
            return;
        }
        try {
            const data = await fetchSofaScore(`unique-tournament/${currentTournamentId}/season/${currentSeasonId}/standings/total`);
            if (!data.standings || data.standings.length === 0) throw new Error();
            
            let html = '';
            data.standings.forEach(std => {
                const rows = std.rows.filter(r => r.team.id === currentHomeTeamId || r.team.id === currentAwayTeamId);
                rows.forEach(r => {
                    const pos = r.position;
                    const isHome = r.team.id === currentHomeTeamId;
                    const color = isHome ? teamColorCasa : teamColorFora;
                    const pts = r.points || 0;
                    const jogos = r.matches || 0;
                    const vit = r.wins || 0;
                    const emp = r.draws || 0;
                    const der = r.losses || 0;
                    const sg = (r.scoresFor || 0) - (r.scoresAgainst || 0);

                    html += `
                        <div class="flex items-center justify-between theme-bg border theme-border rounded-lg px-4 py-2" style="border-left: 4px solid ${color}">
                            <div class="flex items-center gap-3 w-1/3 min-w-[120px]">
                                <span class="text-lg font-black text-gray-300 w-6 text-center">${pos}º</span>
                                <img src="${BACKEND_URL}?path=team/${r.team.id}/image" class="w-6 h-6 object-contain">
                                <span class="font-bold text-white truncate text-sm" style="max-width: 90px">${r.team.shortName || r.team.name}</span>
                            </div>
                            <div class="flex items-center justify-between flex-1 px-2 text-center gap-2">
                                <div class="flex flex-col"><span class="text-[9px] text-gray-500 font-bold">PTS</span><span class="font-black text-white">${pts}</span></div>
                                <div class="flex flex-col"><span class="text-[9px] text-gray-500 font-bold">J</span><span class="font-black text-white">${jogos}</span></div>
                                <div class="flex flex-col"><span class="text-[9px] text-gray-500 font-bold">V</span><span class="font-black text-white">${vit}</span></div>
                                <div class="flex flex-col"><span class="text-[9px] text-gray-500 font-bold">E</span><span class="font-black text-white">${emp}</span></div>
                                <div class="flex flex-col"><span class="text-[9px] text-gray-500 font-bold">D</span><span class="font-black text-white">${der}</span></div>
                                <div class="flex flex-col"><span class="text-[9px] text-gray-500 font-bold">SG</span><span class="font-black text-white">${sg > 0 ? '+'+sg : sg}</span></div>
                            </div>
                        </div>
                    `;
                });
            });
            container.innerHTML = html || '<div class="text-center text-gray-500 text-xs italic">Times não encontrados na tabela</div>';
        } catch (e) {
            container.innerHTML = '<div class="text-center text-gray-500 text-xs italic">Tabela não disponível para este formato</div>';
        }
    };

    if (!currentHomeTeamId || !currentAwayTeamId) {
        renderForm([], "h2hFormCasa");
        renderForm([], "h2hFormFora");
        document.getElementById("h2hRecentCasa").innerHTML = '<div class="text-center text-gray-500 text-xs italic">Sem jogos recentes</div>';
        document.getElementById("h2hRecentFora").innerHTML = '<div class="text-center text-gray-500 text-xs italic">Sem jogos recentes</div>';
        renderStandings();
        irParaSlideH2H(0);
        iniciarSlidesH2H();
        return;
    }

    await Promise.all([
        carregarFormaTime(currentHomeTeamId, "h2hFormCasa"),
        carregarFormaTime(currentAwayTeamId, "h2hFormFora"),
        renderStandings()
    ]);
    irParaSlideH2H(0);
    iniciarSlidesH2H();
}

function toggleH2H() {
    mostrarH2H = !mostrarH2H;
    const overlay = document.getElementById("tvH2HOverlay");
    const btn = document.getElementById("btnToggleH2H");
    const placar = document.getElementById("placarWrapper");
    
    if (mostrarH2H) {
        if(overlay) { overlay.classList.remove("hidden"); overlay.classList.add("flex"); }
        if(btn) { btn.classList.replace("bg-gray-900/80", "bg-orange-600"); btn.classList.replace("opacity-20", "opacity-100"); }
        if(placar) placar.classList.add("hidden");
        carregarH2H();
    } else {
        if(overlay) { overlay.classList.add("hidden"); overlay.classList.remove("flex"); }
        if(btn) { btn.classList.replace("bg-orange-600", "bg-gray-900/80"); btn.classList.replace("opacity-100", "opacity-20"); }
        if(placar) placar.classList.remove("hidden");
        if(h2hCountdownInterval) { clearInterval(h2hCountdownInterval); h2hCountdownInterval = null; }
        if(h2hSlideInterval) { clearInterval(h2hSlideInterval); h2hSlideInterval = null; }
    }
}

function toggleVAR() {
    isVARActive = !isVARActive;
    const overlay = document.getElementById("tvVAROverlay");
    const btn = document.getElementById("btnToggleVAR");
    const btnMan = document.getElementById("btnManVAR");
    
    if (isVARActive) {
        if(overlay) { overlay.classList.remove("hidden"); overlay.classList.add("flex"); }
        if(btn) { btn.classList.replace("bg-gray-900/80", "bg-fuchsia-600"); btn.classList.replace("opacity-20", "opacity-100"); }
        if(btnMan) { btnMan.classList.replace("bg-gray-800", "bg-fuchsia-600"); btnMan.classList.replace("text-fuchsia-500", "text-white"); }
    } else {
        if(overlay) { overlay.classList.add("hidden"); overlay.classList.remove("flex"); }
        if(btn) { btn.classList.replace("bg-fuchsia-600", "bg-gray-900/80"); btn.classList.replace("opacity-100", "opacity-20"); }
        if(btnMan) { btnMan.classList.replace("bg-fuchsia-600", "bg-gray-800"); btnMan.classList.replace("text-white", "text-fuchsia-500"); }
    }
}

function mostrarNotificacaoSubstituicao(playerIn, playerOut, isHome = true) {
    const isNordeste = (currentTournamentId === 1596 || currentTournamentId === 11620 || document.getElementById("manTema")?.value === 'theme-nordeste2025');
    
    if (isNordeste) {
        const banner = document.getElementById("tvSubBannerAbove");
        const elIn = document.getElementById("tvSubInAbove");
        const elOut = document.getElementById("tvSubOutAbove");
        if (!banner || !elIn || !elOut) return;

        elIn.innerText = playerIn;
        elOut.innerText = playerOut;

        // Visual cue for which team is substituting
        banner.style.borderBottom = isHome ? "2px solid #FEBA0F" : "none";
        banner.style.borderTop = !isHome ? "2px solid #FEBA0F" : "1px solid rgba(254, 186, 15, 0.3)";

        banner.classList.remove("hidden");
        banner.classList.add("flex");
        
        setTimeout(() => {
            banner.classList.remove("flex");
            banner.classList.add("hidden");
        }, 5000);
    } else {
        const banner = document.getElementById("tvSubBanner");
        const elIn = document.getElementById("tvSubIn");
        const elOut = document.getElementById("tvSubOut");
        if (!banner || !elIn || !elOut) return;

        elIn.innerText = playerIn;
        elOut.innerText = playerOut;

        // Indicação visual no banner padrão
        banner.style.borderLeft = isHome ? "4px solid #10b981" : "none";
        banner.style.borderRight = !isHome ? "4px solid #ef4444" : "none";

        banner.classList.remove("-translate-y-full", "translate-y-full", "opacity-0");
        banner.classList.add("translate-y-0", "opacity-100");

        setTimeout(() => {
            banner.classList.remove("translate-y-0", "opacity-100");
            banner.classList.add("-translate-y-full", "opacity-0");
        }, 5000);
    }
}

function mostrarGoalImmersive(player, team, isHome) {
    const overlay = document.getElementById("tvGoalImmersive");
    const elTeam = document.getElementById("tvGoalTeamImmersive");
    const elPlayer = document.getElementById("tvGoalPlayerImmersive");
    if (!overlay || !elTeam || !elPlayer) return;

    elTeam.innerText = team;
    elPlayer.innerText = player;

    overlay.classList.add("show");
    
    setTimeout(() => {
        overlay.classList.remove("show");
    }, 7000);
}

function mostrarCardNotify(player, cardType, team, time) {
    const notify = document.getElementById("tvCardNotify");
    const elTitle = document.getElementById("tvCardTitle");
    const elPlayer = document.getElementById("tvCardPlayer");
    const elTime = document.getElementById("tvCardTime");
    const elIcon = document.getElementById("tvCardIcon");
    
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

// Função de Teste para visualizar os efeitos
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


function atualizarPlacarComEfeito(elementoId, player = 'Atacante', team = 'TIME', showOverlay = false) {
    const el = document.getElementById(elementoId);
    if (!el) return;
    
    // 1. Efeito visual no número do placar (Efeito de piscar)
    el.classList.remove("goal-alert");
    void el.offsetWidth;
    el.classList.add("goal-alert");

    // 2. Só disparar o overlay se explicitamente solicitado (quando temos os dados reais do incidente)
    if (!showOverlay) return;

    const overlay = document.getElementById("overlayGol");
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

function toggleArtilheiros() {
    mostrarGols = !mostrarGols;
    const bar = document.getElementById("tvScorersBar");
    const btnIcon = document.querySelector("#btnToggleGols i");
    if (bar) {
        if (!mostrarGols) {
            bar.classList.add("hidden");
            if (btnIcon) btnIcon.classList.replace("fa-futbol", "fa-eye-slash");
        } else {
            if (document.getElementById('tvScorersCasa').innerHTML.trim() || document.getElementById('tvScorersFora').innerHTML.trim()) {
                bar.classList.remove("hidden");
            }
            if (btnIcon) btnIcon.classList.replace("fa-eye-slash", "fa-futbol");
            
            // Força a busca imediata dos gols na API ao clicar no botão
            if (jogoSelecionadoId) {
                const gc = parseInt(document.getElementById("tvGolsCasa").innerText) || 0;
                const gf = parseInt(document.getElementById("tvGolsFora").innerText) || 0;
                buscarArtilheiros(jogoSelecionadoId, gc, gf);
            }
        }
    }
}

function toggleEstatisticas() {
    mostrarEstatisticas = !mostrarEstatisticas;
    const bar = document.getElementById("tvStatsBar");
    if (bar) {
        if (!mostrarEstatisticas) {
            bar.classList.add("hidden");
        } else {
            if (jogoSelecionadoId) buscarEstatisticas(jogoSelecionadoId);
        }
    }
}

function toggleTabela() {
    mostrarTabela = !mostrarTabela;
    const painel = document.getElementById("tvPanelTabela");
    const btn = document.getElementById("btnToggleTabela");
    
    if (mostrarTabela) {
        painel.classList.remove("oculto");
        painel.style.opacity = "1";
        painel.style.transform = "scale(1) translateY(0)";
        if (btn) btn.classList.replace("bg-gray-900/80", "bg-blue-600");
        carregarTabela();
    } else {
        painel.classList.add("oculto");
        if (btn) btn.classList.replace("bg-blue-600", "bg-gray-900/80");
        if (scrollTabelaInterval) { clearInterval(scrollTabelaInterval); scrollTabelaInterval = null; }
        if (scrollTabelaTimeout) { clearTimeout(scrollTabelaTimeout); scrollTabelaTimeout = null; }
    }
}

async function carregarTabela(silencioso = false) {
    const tbody = document.getElementById("tabTabelaBody");
    if (!silencioso) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Carregando...</td></tr>`;
    }

    if (!currentSeasonId && currentTournamentId) {
        try {
            const tourData = await fetchSofaScore(`unique-tournament/${currentTournamentId}/seasons`);
            if (tourData && tourData.seasons && tourData.seasons.length > 0) {
                currentSeasonId = tourData.seasons[0].id;
            } else {
                 console.warn("Nenhuma temporada encontrada para o torneio:", currentTournamentId);
            }
        } catch(e) {
            console.error("Erro ao buscar temporadas:", e);
        }
    }

    if (!currentTournamentId || !currentSeasonId) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500">Dados de tabela indisponíveis.</td></tr>`;
        return;
    }
    
    try {
        const data = await fetchSofaScore(`unique-tournament/${currentTournamentId}/season/${currentSeasonId}/standings/total`);
        if (!data.standings || data.standings.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500">Tabela não encontrada para esta fase.</td></tr>`;
            return;
        }

        document.getElementById("tabNomeCamp").innerText = (data.standings[0].tournament?.name || 'Classificação').toUpperCase();

        let html = '';
        let currentTablePositions = {};
        data.standings.forEach(std => {
            if (data.standings.length > 1 && std.name) {
                html += `<tr><td colspan="5" class="bg-gray-800 border-y border-gray-700 text-center text-[10px] font-bold py-1 text-gray-400 uppercase tracking-widest">${std.name}</td></tr>`;
            }
            std.rows.forEach(r => {
                const pos = r.position;
                const teamId = r.team.id;
                currentTablePositions[teamId] = pos;
                const teamName = r.team.shortName || r.team.name;
                const pts = r.points || 0;
                const jogos = r.matches || 0;
                const sg = (r.scoresFor || 0) - (r.scoresAgainst || 0);

                // Cores da zona de classificação
                let promoColor = 'bg-transparent';
                if (r.promotion) {
                    const txt = (r.promotion.text || '').toLowerCase();
                    if (txt.includes('libertadores')) promoColor = 'bg-sky-500';
                    else if (txt.includes('sul-americana') || txt.includes('sudamericana')) promoColor = 'bg-orange-500';
                    else if (txt.includes('relegation') || txt.includes('rebaixamento') || txt.includes('rebaixado')) promoColor = 'bg-red-500';
                    else if (txt.includes('promotion') || txt.includes('promovido') || txt.includes('série a') || txt.includes('série b')) promoColor = 'bg-emerald-500';
                    else if (txt.includes('qualifiers') || txt.includes('qualificação')) promoColor = 'bg-cyan-500';
                }

                // Calcula a tendência de subida/descida em tempo real
                if (silencioso && prevTablePositions[teamId] !== undefined) {
                    if (pos < prevTablePositions[teamId]) tableTrends[teamId] = 'up';
                    else if (pos > prevTablePositions[teamId]) tableTrends[teamId] = 'down';
                }

                // Setas de Form / Variação de Posição
                let arrowHtml = '<span class="text-gray-600 text-[10px]">-</span>';
                if (tableTrends[teamId] === 'up' || (r.previousPosition !== undefined && pos < r.previousPosition)) {
                    arrowHtml = '<i class="fa-solid fa-caret-up text-green-500"></i>';
                } else if (tableTrends[teamId] === 'down' || (r.previousPosition !== undefined && pos > r.previousPosition)) {
                    arrowHtml = '<i class="fa-solid fa-caret-down text-red-500"></i>';
                }

                const isPlaying = (teamId === currentHomeTeamId || teamId === currentAwayTeamId);
                const highlightClass = isPlaying ? 'bg-sky-900 font-bold text-sky-100' : 'hover:bg-gray-800';
                
                let flashClass = '';
                if (silencioso && prevTablePositions[teamId] !== undefined) {
                    if (pos < prevTablePositions[teamId]) flashClass = 'flash-row-up';
                    else if (pos > prevTablePositions[teamId]) flashClass = 'flash-row-down';
                }

                html += `
                    <tr class="border-b border-gray-800 transition-colors ${highlightClass} ${flashClass}">
                        <td class="py-0.5 pl-0.5">
                            <div class="flex items-center gap-1.5">
                                <div class="w-1 h-4 ${promoColor} rounded-full shrink-0"></div>
                                <span class="text-gray-300 w-3.5 text-center font-bold">${pos}</span>
                                <div class="w-3 flex items-center justify-center shrink-0">${arrowHtml}</div>
                            </div>
                        </td>
                        <td class="py-0.5">
                            <div class="flex items-center gap-1.5">
                                <img src="${BACKEND_URL}?path=team/${teamId}/image" class="w-4 h-4 object-contain rounded" onerror="this.style.display='none'">
                                <span class="truncate max-w-[110px]">${teamName}</span>
                            </div>
                        </td>
                        <td class="py-0.5 text-center font-black">${pts}</td>
                        <td class="py-0.5 text-center text-gray-400">${jogos}</td>
                        <td class="py-0.5 text-center text-gray-400">${sg > 0 ? '+'+sg : sg}</td>
                    </tr>
                `;
            });
        });
        
        tbody.innerHTML = html;
        prevTablePositions = currentTablePositions;

        // Não fazer auto-scroll: tabela deve ficar estática no OBS.
        if (scrollTabelaInterval) { clearInterval(scrollTabelaInterval); scrollTabelaInterval = null; }
        if (scrollTabelaTimeout) { clearTimeout(scrollTabelaTimeout); scrollTabelaTimeout = null; }
        const container = document.querySelector('#tvPanelTabela .overflow-y-auto');
        if (container) container.scrollTop = 0;

    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Erro ao carregar tabela</td></tr>`;
    }
}

function iniciarAutoScrollTabela() {
    // Mantido por compatibilidade, mas a tabela não faz mais auto-scroll.
    return;
    
}

function iniciarCronometroSofaScore() {
    if (loopCronometro) clearInterval(loopCronometro);
    loopCronometro = setInterval(() => {
        if (cronometroRodando) {
            segAtual++;
            if (segAtual >= 60) { segAtual = 0; minAtual++; }
            const m = String(minAtual).padStart(2, '0');
            const s = String(segAtual).padStart(2, '0');
            document.getElementById("tvPeriodo").innerHTML = `${m}:${s}`;
        }
    }, 1000);
}

// ========== CONTROLE DE TAMANHO E ARRASTE ==========
let escalaPlacar = 0.95;
function mudarTamanho(valor) {
    escalaPlacar += valor;
    if (escalaPlacar < 0.5) escalaPlacar = 0.5;
    if (escalaPlacar > 1.8) escalaPlacar = 1.8;
    
    const wrapper = document.getElementById("placarWrapper");
    if (wrapper) {
        const isCentered = !wrapper.style.left || wrapper.style.left === "50%";
        const transX = isCentered ? "translateX(-50%) " : "";
        wrapper.style.transformOrigin = "bottom center";
        wrapper.style.transform = `${transX}scale(${escalaPlacar})`;
    }
    
    document.getElementById("textoTamanho").innerText = Math.round(escalaPlacar * 100) + "%";
}


function inicializarArrastador() {
    const wrapperPlacar = document.getElementById("placarWrapper");
    const dragHandlePlacar = document.getElementById("dragHandle");
    if (wrapperPlacar && dragHandlePlacar) {
        let isDragging = false;
        let offsetX, offsetY;
        dragHandlePlacar.addEventListener('mousedown', (e) => {
            isDragging = true;
            const rect = wrapperPlacar.getBoundingClientRect();
            wrapperPlacar.style.bottom = 'auto';
            wrapperPlacar.style.left = rect.left + 'px';
            wrapperPlacar.style.top = rect.top + 'px';
            wrapperPlacar.style.transformOrigin = "bottom center";
            wrapperPlacar.style.transform = `scale(${escalaPlacar})`;
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
        });
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            wrapperPlacar.style.left = (e.clientX - offsetX) + 'px';
            wrapperPlacar.style.top = (e.clientY - offsetY) + 'px';
        });
        document.addEventListener('mouseup', () => { isDragging = false; });
    }
}

/** Inicializa o arraste do painel de classificação */
function inicializarArrastadorTabela() {
    const wrapper = document.getElementById("tvPanelTabela");
    const handle = document.getElementById("tvTabelaHandle");
    if (wrapper && handle) {
        let isDragging = false;
        let offsetX, offsetY;
        handle.addEventListener('mousedown', (e) => {
            isDragging = true;
            const rect = wrapper.getBoundingClientRect();
            // Desativar transições durante o arraste
            wrapper.style.transition = 'none';
            wrapper.classList.remove("oculto");
            wrapper.style.opacity = '1';
            wrapper.style.transform = 'none'; 
            
            wrapper.style.right = 'auto';
            wrapper.style.left = rect.left + 'px';
            wrapper.style.top = rect.top + 'px';
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
        });
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            wrapper.style.left = (e.clientX - offsetX) + 'px';
            wrapper.style.top = (e.clientY - offsetY) + 'px';
        });
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                // Restaurar transição suave após soltar
                wrapper.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            }
        });
    }
}
