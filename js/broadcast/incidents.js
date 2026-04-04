// ========== js/broadcast/incidents.js ==========
// Incidentes (gols, cartões, substituições), estatísticas e pênaltis

async function buscarIncidentesSofaScore(eventId, isLive = true) {
    if (modoAtual === 'manual' || !eventId) return;

    const scorersCasa = DOM.scorersCasa || document.getElementById('tvScorersCasa');
    const scorersFora = DOM.scorersFora || document.getElementById('tvScorersFora');
    const scorersBar = DOM.scorersBar || document.getElementById('tvScorersBar');
    if (!scorersCasa || !scorersFora || !scorersBar) return;

    try {
        const data = await fetchSofaScore(`event/${eventId}/incidents`);
        if (!data || !data.incidents) {
            scorersCasa.innerHTML = '';
            scorersFora.innerHTML = '';
            scorersBar.classList.add('hidden');
            const elYcC = DOM.yellowCardCasa || document.getElementById("tvYellowCardCasa");
            if (elYcC) elYcC.classList.add("hidden");
            const elYcF = DOM.yellowCardFora || document.getElementById("tvYellowCardFora");
            if (elYcF) elYcF.classList.add("hidden");
            return;
        }

        // Auto-detect VAR (Apenas se o jogo estiver AO VIVO)
        const varOverlay = DOM.varOverlay || document.getElementById("tvVAROverlay");
        if (varOverlay) {
            const hasActiveVAR = isLive && data.incidents.some(inc => inc.incidentType === 'varDecision' && !inc.confirmed);
            if (hasActiveVAR) {
                varOverlay.classList.remove("hidden");
            } else {
                varOverlay.classList.add("hidden");
            }
        }

        const goleiros = { casa: [], fora: [] };
        let ycC = 0, ycF = 0;
        let rcC_count = 0, rcF_count = 0;
        
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
                const nome = escapeHTML(inc.player?.shortName || inc.player?.name || 'Gol');
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
        const elYcCasa = DOM.yellowCardCasa || document.getElementById("tvYellowCardCasa");
        const elYcFora = DOM.yellowCardFora || document.getElementById("tvYellowCardFora");
        const elRcCasa = DOM.redCardCasa || document.getElementById("tvRedCardCasa");
        const elRcFora = DOM.redCardFora || document.getElementById("tvRedCardFora");

        if (elYcCasa) {
            if (ycC > 0) { elYcCasa.classList.remove("hidden"); elYcCasa.innerHTML = ycC; } else { elYcCasa.classList.add("hidden"); }
        }
        if (elYcFora) {
            if (ycF > 0) { elYcFora.classList.remove("hidden"); elYcFora.innerHTML = ycF; } else { elYcFora.classList.add("hidden"); }
        }
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
    const penaltyBar = DOM.penaltyBar || document.getElementById("tvPenaltyBar");

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

    const dotsCasa = DOM.penaltyDotsCasa || document.getElementById("tvPenaltyDotsCasa");
    const dotsFora = DOM.penaltyDotsFora || document.getElementById("tvPenaltyDotsFora");
    if (dotsCasa) dotsCasa.innerHTML = renderDots(homePens);
    if (dotsFora) dotsFora.innerHTML = renderDots(awayPens);
    if (penaltyBar) penaltyBar.classList.remove("hidden");
}

async function buscarEstatisticas(eventId) {
    const statsBar = DOM.statsBar || document.getElementById("tvStatsBar");
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

        const posseCasa = DOM.posseCasa || document.getElementById("tvPosseCasa");
        const posseFora = DOM.posseFora || document.getElementById("tvPosseFora");
        const posseBarraCasa = DOM.posseBarraCasa || document.getElementById("tvPosseBarraCasa");
        const posseBarraFora = DOM.posseBarraFora || document.getElementById("tvPosseBarraFora");

        if (posseCasa) posseCasa.innerText = valC + "%";
        if (posseFora) posseFora.innerText = valF + "%";
        if (posseBarraCasa) { posseBarraCasa.style.width = valC + "%"; posseBarraCasa.style.backgroundColor = teamColorCasa; }
        if (posseBarraFora) { posseBarraFora.style.width = valF + "%"; posseBarraFora.style.backgroundColor = teamColorFora; }

        const chutesCasa = DOM.chutesCasa || document.getElementById("tvChutesCasa");
        const chutesFora = DOM.chutesFora || document.getElementById("tvChutesFora");
        if (chutesCasa) chutesCasa.innerText = stats.chutes.c;
        if (chutesFora) chutesFora.innerText = stats.chutes.f;

        const escanteiosCasa = DOM.escanteiosCasa || document.getElementById("tvEscanteiosCasa");
        const escanteiosFora = DOM.escanteiosFora || document.getElementById("tvEscanteiosFora");
        if (escanteiosCasa) escanteiosCasa.innerText = stats.escanteios.c;
        if (escanteiosFora) escanteiosFora.innerText = stats.escanteios.f;

        const faltasCasa = DOM.faltasCasa || document.getElementById("tvFaltasCasa");
        const faltasFora = DOM.faltasFora || document.getElementById("tvFaltasFora");
        if (faltasCasa) faltasCasa.innerText = stats.faltas.c;
        if (faltasFora) faltasFora.innerText = stats.faltas.f;

        const cartoesCasa = DOM.cartoesCasa || document.getElementById("tvCartoesCasa");
        const cartoesFora = DOM.cartoesFora || document.getElementById("tvCartoesFora");
        if (cartoesCasa) cartoesCasa.innerText = stats.cartoes.c;
        if (cartoesFora) cartoesFora.innerText = stats.cartoes.f;

        const chancesCasa = DOM.chancesCasa || document.getElementById("tvChancesCasa");
        const chancesFora = DOM.chancesFora || document.getElementById("tvChancesFora");
        if (chancesCasa) chancesCasa.innerText = stats.chances.c;
        if (chancesFora) chancesFora.innerText = stats.chances.f;

        if (mostrarEstatisticas) {
            statsBar.classList.remove('hidden');
        }

        if (mostrarTabela && currentTournamentId && currentSeasonId) {
            carregarTabela(true);
        }
    } catch (e) {
        statsBar.classList.add('hidden');
    }
}
