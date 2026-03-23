// ========== js/broadcast.js ==========
// Lógica de Tela Cheia e Transmissão para OBS (SofaScore Auto)

function iniciarTransmissaoSofaScore(id) {
    jogoSelecionadoId = id;
    modoAtual = 'auto';
    document.getElementById("painelAdmin").style.display = "none";
    document.getElementById("uiTransmissao").style.display = "block";
    ultimoPlacar = { casa: -1, fora: -1 };
    
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

function voltarAoPainel() {
    // Limpar todos os intervalos
    if (loopDados) { clearInterval(loopDados); loopDados = null; }
    if (loopCronometro) { clearInterval(loopCronometro); loopCronometro = null; }
    if (manualLoop) { clearInterval(manualLoop); manualLoop = null; }
    if (tickerObserverLoop) { clearInterval(tickerObserverLoop); tickerObserverLoop = null; }
    if (scrollTabelaInterval) { clearInterval(scrollTabelaInterval); scrollTabelaInterval = null; }
    if (scrollTabelaTimeout) { clearTimeout(scrollTabelaTimeout); scrollTabelaTimeout = null; }

    // Resetar estado global
    jogoSelecionadoId = null;
    cronometroRodando = false;
    manualTimerRunning = false;
    minAtual = 0;
    segAtual = 0;
    ultimoPlacar = { casa: -1, fora: -1 };
    ultimoPlacarTicker = {};
    
    currentTournamentId = null;
    currentSeasonId = null;
    currentTournamentLabel = "";
    currentHomeTeamId = null;
    currentAwayTeamId = null;
    mostrarGols = true;
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

    // Trocar visibilidade
    document.getElementById("uiTransmissao").style.display = "none";
    document.getElementById("painelAdmin").style.display = "";
}

function aplicarTemaPlacar(tornId) {
    const placar = document.getElementById("placarCard");
    if (!placar) return;
    
    // Reseta o tema atual mantendo as classes fixas
    placar.className = "placar-compacto rounded-xl flex flex-col overflow-hidden relative z-10";
    
    let isCopa = false;

    if (tornId === 384) { placar.classList.add("theme-libertadores"); isCopa = true; }
    else if (tornId === 480 || tornId === 11539) { placar.classList.add("theme-sulamericana"); isCopa = true; }
    else if (tornId === 11620) { placar.classList.add("theme-nordeste"); isCopa = true; }
    else if (tornId === 73) { placar.classList.add("theme-brasil"); isCopa = true; }
    else if (tornId === 17015) { placar.classList.add("theme-verde"); isCopa = true; }
    else if (tornId === 13076 || tornId === 10257) { placar.classList.add("theme-feminino"); isCopa = true; }

    if (isCopa) {
        placar.classList.remove("rounded-xl");
        placar.classList.add("layout-copa");
    }
}

async function atualizarDadosSofaScore() {
    if (!jogoSelecionadoId) return;

    try {
        const eventData = await fetchSofaScore(`event/${jogoSelecionadoId}`);
        const jogo = eventData.event;
        
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

        document.getElementById("tvCampeonato").innerHTML = (jogo.tournament?.name || "SOFASCORE LIVE").toUpperCase();
        // Usar sigla de exatamente 3 letras como o usuário solicitou (ex: PAL x SAN)
        const nomeCasaFull = (jogo.homeTeam.shortName || jogo.homeTeam.name || '?').toUpperCase();
        const nomeForaFull = (jogo.awayTeam.shortName || jogo.awayTeam.name || '?').toUpperCase();
        document.getElementById("tvNomeCasa").innerHTML = nomeCasaFull.substring(0, 3);
        document.getElementById("tvNomeFora").innerHTML = nomeForaFull.substring(0, 3);
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
            if (statusCode === 31) txt = "INTERVALO";
            if (statusCode === 0 || type === 'notstarted') txt = "PRÉ-JOGO";
            if (statusCode === 60 || type === 'postponed') txt = "ADIADO";
            if (statusCode === 70 || type === 'canceled') txt = "CANCELADO";
            
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
            if (golsC > ultimoPlacar.casa) piscarGol("tvGolsCasa");
            if (golsF > ultimoPlacar.fora) piscarGol("tvGolsFora");
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
        buscarArtilheiros(jogoSelecionadoId, golsC, golsF);
        
        if (mostrarEstatisticas) {
            buscarEstatisticas(jogoSelecionadoId);
        }
        
        // Se a tabela estiver na tela, atualiza os pontos em tempo real silenciosamente
        if (mostrarTabela) {
            carregarTabela(true);
        }
        
    } catch (error) {
        console.error("Erro ao atualizar dados:", error);
    }
}

// ========== ARTILHEIROS ==========
async function buscarArtilheiros(eventId, golsC, golsF) {
    const scorersCasa = document.getElementById('tvScorersCasa');
    const scorersFora = document.getElementById('tvScorersFora');
    const scorersBar = document.getElementById('tvScorersBar');
    if (!scorersCasa || !scorersFora || !scorersBar) return;

    try {
        const data = await fetchSofaScore(`event/${eventId}/incidents`);
        if (!data.incidents) { 
            scorersCasa.innerHTML = '';
            scorersFora.innerHTML = '';
            scorersBar.classList.add('hidden');
            const elYcCasa = document.getElementById("tvYellowCardCasa");
            if (elYcCasa) elYcCasa.classList.add("hidden");
            const elYcFora = document.getElementById("tvYellowCardFora");
            if (elYcFora) elYcFora.classList.add("hidden");
            processarPenaltis([]);
            return; 
        }

        const goleiros = { casa: [], fora: [] };
        let ycC = 0, ycF = 0;
        let temNovaSub = false;
        let subIn = "";
        let subOut = "";

        data.incidents.forEach(inc => {
            if (inc.incidentType === 'card' && (inc.incidentClass === 'yellow' || inc.incidentClass === 'yellowRed')) {
                if (inc.isHome) ycC++; else ycF++;
            }
            if (inc.incidentType === 'substitution') {
                if (!ultimosIncidentesIds.has(inc.id)) {
                    ultimosIncidentesIds.add(inc.id);
                    if (!primeiraCargaIncidentes) {
                        temNovaSub = true;
                        subIn = inc.playerIn?.shortName || inc.playerIn?.name || "Jogador";
                        subOut = inc.playerOut?.shortName || inc.playerOut?.name || "Jogador";
                    }
                }
            }
            if (inc.incidentType !== 'goal') return;
            const nome = inc.player?.shortName || inc.player?.name || 'Gol';
            const min = inc.time ? `${inc.time}'` : '';
            const isOG = inc.incidentClass === 'ownGoal' || inc.isOwnGoal;
            
            let display = `${nome} ${min}`.trim();
            if (isOG) display += ' (cg)';
            if (inc.incidentClass === 'penalty') display += ' (p)';

            if (inc.isHome && !isOG) goleiros.casa.push(display);
            else if (!inc.isHome && !isOG) goleiros.fora.push(display);
            // Gol contra: conta para o adversário
            else if (inc.isHome && isOG) goleiros.fora.push(display);
            else if (!inc.isHome && isOG) goleiros.casa.push(display);
        });

        const elYcCasa = document.getElementById("tvYellowCardCasa");
        const elYcFora = document.getElementById("tvYellowCardFora");
        if (elYcCasa) {
            if (ycC > 0) { elYcCasa.classList.remove("hidden"); elYcCasa.innerHTML = ycC > 1 ? ycC : ""; } else { elYcCasa.classList.add("hidden"); }
        }
        if (elYcFora) {
            if (ycF > 0) { elYcFora.classList.remove("hidden"); elYcFora.innerHTML = ycF > 1 ? ycF : ""; } else { elYcFora.classList.add("hidden"); }
        }

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
        if (temNovaSub) {
            mostrarNotificacaoSubstituicao(subIn, subOut);
        }

        processarPenaltis(data.incidents);
    } catch (e) {
        scorersBar.classList.add('hidden');
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
        let posseC = '50%', posseF = '50%';
        let chutesC = 0, chutesF = 0;

        periodStats.forEach(grupo => {
            grupo.statisticsItems.forEach(item => {
                if (item.name === "Ball possession" || item.name === "Posse de bola") { posseC = item.home; posseF = item.away; }
                if (item.name === "Shots on target" || item.name === "Chutes no gol") { chutesC = item.home; chutesF = item.away; }
            });
        });

        let valC = parseInt(posseC) || 50;
        let valF = parseInt(posseF) || 50;

        document.getElementById("tvPosseCasa").innerText = valC + "%";
        document.getElementById("tvPosseFora").innerText = valF + "%";
        document.getElementById("tvPosseBarraCasa").style.width = valC + "%";
        document.getElementById("tvPosseBarraCasa").style.backgroundColor = teamColorCasa;
        document.getElementById("tvPosseBarraFora").style.width = valF + "%";
        document.getElementById("tvPosseBarraFora").style.backgroundColor = teamColorFora;

        document.getElementById("tvChutesCasa").innerText = chutesC;
        document.getElementById("tvChutesFora").innerText = chutesF;

        if (mostrarEstatisticas) {
            statsBar.classList.remove('hidden');
        }
    } catch (e) {
        statsBar.classList.add('hidden');
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

        // Filtrar apenas os torneios solicitados
        const eventosFiltrados = eventos.filter(j => {
            const tornId = j.tournament?.uniqueTournament?.id || j.tournament?.id;
            return GIRO_TORNEIOS_IDS.includes(tornId);
        });

        if (eventosFiltrados.length > 0) {
            // Ordena primeiro pela ordem do GIRO_TORNEIOS_IDS (Série A > B > C...), depois por status (ao vivo primeiro) e horário
            eventosFiltrados.sort((a, b) => {
                const tornIdA = a.tournament?.uniqueTournament?.id || a.tournament?.id;
                const tornIdB = b.tournament?.uniqueTournament?.id || b.tournament?.id;
                
                const idxA = GIRO_TORNEIOS_IDS.indexOf(tornIdA);
                const idxB = GIRO_TORNEIOS_IDS.indexOf(tornIdB);

                if (idxA !== idxB) return (idxA !== -1 ? idxA : 999) - (idxB !== -1 ? idxB : 999);

                const aLive = isJogoAoVivo(a);
                const bLive = isJogoAoVivo(b);
                if (aLive && !bLive) return -1;
                if (!aLive && bLive) return 1;
                return (a.startTimestamp || 0) - (b.startTimestamp || 0);
            });

            let currentTournamentName = "";

            eventosFiltrados.forEach(j => {
                const isLive = isJogoAoVivo(j);
                const status = j.status?.code;
                const type = j.status?.type;

                const currentHome = j.homeScore?.current ?? 0;
                const currentAway = j.awayScore?.current ?? 0;
                const tornId = j.tournament?.uniqueTournament?.id || j.tournament?.id;

                // Detecção de gol no Giro da Rodada (Apenas em jogos rolando)
                if (ultimoPlacarTicker[j.id] && isLive) {
                    const golCasa = currentHome > ultimoPlacarTicker[j.id].home;
                    const golFora = currentAway > ultimoPlacarTicker[j.id].away;
                    if (golCasa || golFora) {
                        let timeGol = golCasa ? (j.homeTeam.shortName || j.homeTeam.name) : (j.awayTeam.shortName || j.awayTeam.name);
                        mostrarAlertaGolTicker(timeGol, j.homeTeam, j.awayTeam, currentHome, currentAway, j.tournament.name);
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
                if (j.tournament.name !== currentTournamentName) {
                    tickerHTML += `
                        <div class="ticker-item !border-none !px-4 ml-8" data-tournament="${j.tournament.name}" data-logo="${logoTorneio}">
                            <div class="bg-gray-800 text-white font-black uppercase tracking-widest px-5 py-1.5 rounded-full shadow-lg flex items-center gap-2 border border-gray-600">
                                <img src="${logoTorneio}" class="w-4 h-4 object-contain brightness-200" onerror="this.style.display='none'"> ${j.tournament.name}
                            </div>
                        </div>
                    `;
                    currentTournamentName = j.tournament.name;
                }

                tickerHTML += `
                    <div class="ticker-item" data-tournament="${j.tournament.name}" data-logo="${logoTorneio}">
                        <span class="ticker-status ${isLive ? 'text-sky-400' : 'text-gray-400'} mr-2">[${tempoStr}]</span>
                        <img src="${BACKEND_URL}?path=team/${j.homeTeam.id}/image" class="h-5 mr-2 object-contain rounded">
                        ${j.homeTeam.shortName || j.homeTeam.name}${rcC}
                        ${extraPenC}
                        <span class="text-white font-black mx-1">${currentHome}</span>
                        <span class="text-gray-400">vs</span>
                        <span class="text-white font-black mx-1">${currentAway}</span>
                        ${extraPenF}
                        ${rcF}${j.awayTeam.shortName || j.awayTeam.name}
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
    
    overlay.classList.remove("ticker-goal-anim");
    void overlay.offsetWidth; // Reflow forçar reinício da animação
    overlay.classList.add("ticker-goal-anim");
}

function startTickerObserver() {
    if (tickerObserverLoop) clearInterval(tickerObserverLoop);
    currentTournamentLabel = "GIRO DA RODADA";
    
    tickerObserverLoop = setInterval(() => {
        const labelEl = document.getElementById('tickerLabel');
        if (!labelEl || document.getElementById('uiTransmissao').style.display === "none") return;

        const triggerX = labelEl.getBoundingClientRect().right;

        const items = document.querySelectorAll('.ticker-item[data-tournament]');
        for (let item of items) {
            const rect = item.getBoundingClientRect();
            // O gatilho dispara quando a borda esquerda do jogo passa pela borda direita do título
            if (rect.left >= triggerX - 100 && rect.left <= triggerX + 20) {
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
    if (!labelBg || !labelText) return;

    labelBg.className = `ticker-label transition-colors duration-500 overflow-hidden relative min-w-[300px] flex justify-center z-[5] bg-gradient-to-b from-gray-900 to-black border-r border-gray-700`;

    labelText.style.transform = 'translateY(-100%)';
    labelText.style.opacity = '0';

    setTimeout(() => {
        const imgHtml = logo ? `<img src="${logo}" class="w-5 h-5 object-contain mr-2 brightness-200" onerror="this.style.display='none'">` : `<i class="fa-solid fa-trophy mr-2 text-gray-400"></i>`;
        labelText.innerHTML = `${imgHtml} ${novoTexto}`;
        labelText.style.transition = 'none';
        labelText.style.transform = 'translateY(100%)';
        
        void labelText.offsetWidth; // Reflow para forçar a aplicação sem animar

        labelText.style.transition = 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
        labelText.style.transform = 'translateY(0)';
        labelText.style.opacity = '1';
    }, 500); 
}

async function carregarH2H() {
    document.getElementById("h2hNomeCasa").innerText = document.getElementById("tvNomeCasa").innerText;
    document.getElementById("h2hNomeFora").innerText = document.getElementById("tvNomeFora").innerText;
    document.getElementById("h2hLogoCasa").src = document.getElementById("imgLogoCasa").src;
    document.getElementById("h2hLogoFora").src = document.getElementById("imgLogoFora").src;

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
            renderForm(extrairFormaRecente(eventos, teamId), containerId);
        } catch (e) {
            renderForm([], containerId);
        }
    };

    if (!currentHomeTeamId || !currentAwayTeamId) {
        renderForm([], "h2hFormCasa");
        renderForm([], "h2hFormFora");
        return;
    }

    await Promise.all([
        carregarFormaTime(currentHomeTeamId, "h2hFormCasa"),
        carregarFormaTime(currentAwayTeamId, "h2hFormFora")
    ]);
}

function toggleH2H() {
    mostrarH2H = !mostrarH2H;
    const overlay = document.getElementById("tvH2HOverlay");
    const btn = document.getElementById("btnToggleH2H");
    
    if (mostrarH2H) {
        if(overlay) { overlay.classList.remove("hidden"); overlay.classList.add("flex"); }
        if(btn) { btn.classList.replace("bg-gray-900/80", "bg-orange-600"); btn.classList.replace("opacity-20", "opacity-100"); }
        carregarH2H();
    } else {
        if(overlay) { overlay.classList.add("hidden"); overlay.classList.remove("flex"); }
        if(btn) { btn.classList.replace("bg-orange-600", "bg-gray-900/80"); btn.classList.replace("opacity-100", "opacity-20"); }
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

function mostrarNotificacaoSubstituicao(playerIn, playerOut) {
    const banner = document.getElementById("tvSubBanner");
    const elIn = document.getElementById("tvSubIn");
    const elOut = document.getElementById("tvSubOut");
    if (!banner || !elIn || !elOut) return;

    elIn.innerText = playerIn;
    elOut.innerText = playerOut;

    banner.classList.remove("-translate-y-full", "opacity-0");
    banner.classList.add("translate-y-0", "opacity-100");

    setTimeout(() => {
        banner.classList.remove("translate-y-0", "opacity-100");
        banner.classList.add("-translate-y-full", "opacity-0");
    }, 5000);
}

// Função de Teste para visualizar os efeitos
function testarEfeitos() {
    piscarGol("tvGolsCasa");
    
    const timeCasaMock = { id: 5981, shortName: 'FLA', name: 'Flamengo' };
    const timeForaMock = { id: 1934, shortName: 'VAS', name: 'Vasco' };
    mostrarAlertaGolTicker('FLAMENGO', timeCasaMock, timeForaMock, 1, 0, 'BRASILEIRÃO SÉRIE A');
    
    mostrarNotificacaoSubstituicao("Pedro (9)", "Gabriel B. (10)");

    processarPenaltis([
        { incidentType: 'penaltyShootout', incidentClass: 'scored', isHome: true, sequence: 1 },
        { incidentType: 'penaltyShootout', incidentClass: 'scored', isHome: false, sequence: 1 },
        { incidentType: 'penaltyShootout', incidentClass: 'missed', isHome: true, sequence: 2 },
        { incidentType: 'penaltyShootout', incidentClass: 'scored', isHome: false, sequence: 2 },
        { incidentType: 'penaltyShootout', incidentClass: 'scored', isHome: true, sequence: 3 },
    ]);
}

function piscarGol(elementoId) {
    const el = document.getElementById(elementoId);
    if (!el) return;
    el.classList.remove("goal-alert");
    void el.offsetWidth;
    el.classList.add("goal-alert");

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
    
    if (mostrarTabela) {
        painel.classList.remove("translate-x-[120%]", "opacity-0");
        painel.classList.add("translate-x-0", "opacity-100");
        carregarTabela();
    } else {
        painel.classList.remove("translate-x-0", "opacity-100");
        painel.classList.add("translate-x-[120%]", "opacity-0");
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
            if (tourData.seasons && tourData.seasons.length > 0) {
                currentSeasonId = tourData.seasons[0].id;
            }
        } catch(e) {}
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

        // Iniciar scroll automático
        if (scrollTabelaInterval) { clearInterval(scrollTabelaInterval); scrollTabelaInterval = null; }
        if (scrollTabelaTimeout) { clearTimeout(scrollTabelaTimeout); scrollTabelaTimeout = null; }
        scrollTabelaTimeout = setTimeout(() => {
            const container = document.querySelector('#tvPanelTabela .overflow-y-auto');
            if (container && mostrarTabela && container.scrollHeight > container.clientHeight) {
                iniciarAutoScrollTabela();
            }
        }, 500);

    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Erro ao carregar tabela</td></tr>`;
    }
}

function iniciarAutoScrollTabela() {
    const container = document.querySelector('#tvPanelTabela .overflow-y-auto');
    if (!container || !mostrarTabela) return;
    
    container.scrollTop = 0; // Começa sempre do topo
    
    scrollTabelaTimeout = setTimeout(() => {
        if (!mostrarTabela) return;
        
        scrollTabelaInterval = setInterval(() => {
            if (!mostrarTabela) {
                clearInterval(scrollTabelaInterval);
                return;
            }
            
            // Desce a tabela em 1 pixel gradativamente
            container.scrollTop += 1;
            
            // Se encostar no final
            if (container.scrollTop + container.clientHeight >= container.scrollHeight - 1) {
                clearInterval(scrollTabelaInterval);
                scrollTabelaTimeout = setTimeout(() => {
                    if (mostrarTabela) iniciarAutoScrollTabela();
                }, 4000); // Espera 4 segundos no final e reinicia
            }
        }, 40); // Velocidade do scroll (40ms)
    }, 3000); // Espera 3 segundos no topo antes de começar a rolar
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
let escalaPlacar = 1.0;
function mudarTamanho(valor) {
    escalaPlacar += valor;
    if (escalaPlacar < 0.5) escalaPlacar = 0.5;
    if (escalaPlacar > 1.8) escalaPlacar = 1.8;
    document.getElementById("placarCard").style.transform = `scale(${escalaPlacar})`;
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
            wrapperPlacar.style.transform = 'none';
            wrapperPlacar.style.left = rect.left + 'px';
            wrapperPlacar.style.top = rect.top + 'px';
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
