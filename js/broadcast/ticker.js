// ========== js/broadcast/ticker.js ==========
// Giro da Rodada — Ticker de resultados na barra inferior

async function atualizarRodapeSofaScore() {
    try {
        const { iso: dataHoje } = getDataComOffset(0);

        const [dataSched, dataLive] = await Promise.all([
            fetchWithFallback(`sport/football/scheduled-events/${dataHoje}`),
            fetchWithFallback('sport/football/events/live').catch(() => ({ events: [] }))
        ]);

        let tickerHTML = "";
        const eventos = dataSched.events || [];

        if (dataLive.events) {
            dataLive.events.forEach(liveEv => {
                const idx = eventos.findIndex(e => e.id === liveEv.id);
                if (idx !== -1) eventos[idx] = liveEv;
                else eventos.push(liveEv);
            });
        }

        const eventosFiltrados = eventos.filter(j => {
            const tornId = j.tournament?.uniqueTournament?.id || j.tournament?.id;
            return GIRO_TORNEIOS_IDS.includes(tornId)
                || CAMPEONATOS_FIXOS_CODIGO.includes(tornId)
                || j._source === 'espn'
                || (j._source === 'flashscore' && (GIRO_TORNEIOS_IDS.includes(tornId) || CAMPEONATOS_FIXOS_CODIGO.includes(tornId) || j.tournament?.country === 'Brazil'));
        });

        if (eventosFiltrados.length > 0) {
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

                // Detecção de gol no Giro da Rodada
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
                        const calc = calcularTempoDecorrido(j.time.currentPeriodStartTimestamp, status);
                        let display = `${String(calc.min).padStart(2, '0')}:${String(calc.sec).padStart(2, '0')}`;
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

                const penC = j.homeScore?.penalties;
                const penF = j.awayScore?.penalties;
                const agrC = j.homeScore?.aggregated ?? j.homeScore?.aggregate;
                const agrF = j.awayScore?.aggregated ?? j.awayScore?.aggregate;

                let extraPenC = penC !== undefined ? `<span class="text-sky-400 text-sm font-black mx-1">(${penC})</span>` : '';
                let extraPenF = penF !== undefined ? `<span class="text-sky-400 text-sm font-black mx-1">(${penF})</span>` : '';
                let extraAgr = (agrC !== undefined && agrF !== undefined) ? `<span class="text-gray-400 text-[11px] ml-4 font-bold uppercase tracking-widest bg-gray-800 px-2 py-0.5 rounded border border-gray-600">AGR. ${agrC} - ${agrF}</span>` : '';

                let rcC = "";
                if (j.homeRedCards) {
                    for (let i = 0; i < j.homeRedCards; i++) rcC += `<span class="bg-red-600 w-1.5 h-2.5 inline-block rounded-[1px] ml-1 shadow-[0_0_2px_rgba(220,38,38,0.8)]"></span>`;
                }
                let rcF = "";
                if (j.awayRedCards) {
                    for (let i = 0; i < j.awayRedCards; i++) rcF += `<span class="bg-red-600 w-1.5 h-2.5 inline-block rounded-[1px] mr-1 shadow-[0_0_2px_rgba(220,38,38,0.8)]"></span>`;
                }

                const logoTorneio = j.tournament?.logo || sofaImg(`unique-tournament/${tornId}/image`);
                const homeTeamName = escapeHTML(traduzirNomeEquipe(j.homeTeam.shortName || j.homeTeam.name));
                const awayTeamName = escapeHTML(traduzirNomeEquipe(j.awayTeam.shortName || j.awayTeam.name));

                if (nomeCompeticaoTicker !== currentTournamentName) {
                    tickerHTML += `
                        <div class="ticker-item !border-none !px-3 ml-4" data-tournament="${escapeHTML(nomeCompeticaoTicker)}" data-logo="${logoTorneio}">
                            <div class="bg-white/10 text-white font-extrabold uppercase tracking-wider text-[11px] px-3.5 py-1 rounded-md shadow-sm flex items-center gap-2 border border-white/15">
                                <img src="${logoTorneio}" class="w-4 h-4 object-contain brightness-125" onerror="this.style.display='none'">
                                <span>${escapeHTML(nomeCompeticaoTicker)}</span>
                            </div>
                        </div>
                    `;
                    currentTournamentName = nomeCompeticaoTicker;
                }

                const logoHome = j.homeTeam.logo || j.homeTeam._espnLogo || sofaImg(`team/${j.homeTeam.id}/image`);
                const logoAway = j.awayTeam.logo || j.awayTeam._espnLogo || sofaImg(`team/${j.awayTeam.id}/image`);

                tickerHTML += `
                    <div class="ticker-item" data-tournament="${escapeHTML(nomeCompeticaoTicker)}" data-logo="${logoTorneio}">
                        <span class="ticker-status ${isLive ? 'text-emerald-400 font-black' : 'text-gray-400 font-bold'} mr-2.5 px-2 py-0.5 bg-white/5 rounded text-[11px] tracking-wide">${tempoStr}</span>
                        <div class="w-5 h-5 rounded-full bg-white/10 p-0.5 inline-flex items-center justify-center mr-1.5 overflow-hidden flex-shrink-0 shadow-sm">
                            <img src="${logoHome}" onerror="this.style.display='none'" class="w-full h-full object-contain">
                        </div>
                        <span class="font-bold mr-1 text-white uppercase text-xs sm:text-sm tracking-tight">${homeTeamName}</span>${rcC}
                        ${extraPenC}
                        <div class="inline-flex items-center gap-1 bg-black/60 border border-white/15 px-2 py-0.5 rounded text-white font-black mx-1.5 tabular-nums text-xs shadow-inner">
                            <span>${currentHome}</span>
                            <span class="text-white/30 text-[10px] font-light">x</span>
                            <span>${currentAway}</span>
                        </div>
                        ${extraPenF}
                        ${rcF}<span class="font-bold ml-1 text-white uppercase text-xs sm:text-sm tracking-tight">${awayTeamName}</span>
                        <div class="w-5 h-5 rounded-full bg-white/10 p-0.5 inline-flex items-center justify-center ml-1.5 overflow-hidden flex-shrink-0 shadow-sm">
                            <img src="${logoAway}" onerror="this.style.display='none'" class="w-full h-full object-contain">
                        </div>
                        ${extraAgr}
                    </div>
                `;
            });
        }

        if (tickerHTML === "") {
            tickerHTML = "<div class='ticker-item'><i class='fa-solid fa-futbol mr-1'></i> Nenhum jogo dos principais campeonatos brasileiros hoje.</div>";
        }

        const novoHTML = tickerHTML + tickerHTML;
        const container = DOM.ticker || document.getElementById("tvTicker");
        if (container) {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = novoHTML;
            if (container.children.length !== tempDiv.children.length) {
                container.innerHTML = novoHTML;
            } else {
                for (let i = 0; i < container.children.length; i++) {
                    if (container.children[i].innerHTML !== tempDiv.children[i].innerHTML) {
                        container.children[i].innerHTML = tempDiv.children[i].innerHTML;
                        ['tournament', 'logo'].forEach(attr => {
                            if (tempDiv.children[i].dataset[attr] !== container.children[i].dataset[attr]) {
                                container.children[i].dataset[attr] = tempDiv.children[i].dataset[attr];
                            }
                        });
                    }
                }
            }
        }
    } catch (e) {
        console.error("Erro no ticker:", e);
    }
}

function mostrarAlertaGolTicker(timeGolNome, timeCasa, timeFora, golsC, golsF, torneioNome) {
    const overlay = DOM.tickerGoalOverlay || document.getElementById("tickerGoalOverlay");
    const textEl = DOM.tickerGoalText || document.getElementById("tickerGoalText");
    const container = document.getElementById("tvTickerContainer");
    if (!overlay || !textEl) return;

    const nomeCasa = (typeof getScoreboardName === 'function' ? getScoreboardName(timeCasa) : (timeCasa.shortName || timeCasa.name)).toUpperCase();
    const nomeFora = (typeof getScoreboardName === 'function' ? getScoreboardName(timeFora) : (timeFora.shortName || timeFora.name)).toUpperCase();
    const nomeGol = (typeof traduzirNomeEquipe === 'function' ? traduzirNomeEquipe(timeGolNome) : timeGolNome).toUpperCase();

    const logoC = timeCasa.logo || timeCasa._espnLogo || sofaImg(`team/${timeCasa.id}/image`);
    const logoF = timeFora.logo || timeFora._espnLogo || sofaImg(`team/${timeFora.id}/image`);

    const isGolCasa = nomeGol.includes(nomeCasa) || nomeCasa.includes(nomeGol);
    const isGolFora = nomeGol.includes(nomeFora) || nomeFora.includes(nomeGol);

    textEl.innerHTML = `
        <div class="flex items-center justify-center gap-3 sm:gap-5 w-full h-full text-white">
            <!-- BADGE PULSANTE DE GOL -->
            <div class="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-[1000] text-xs uppercase tracking-widest px-3 py-1 rounded shadow-[0_0_15px_rgba(16,185,129,0.5)] flex-shrink-0 animate-pulse">
                <i class="fa-solid fa-futbol text-white"></i>
                <span>GOL!</span>
            </div>

            <!-- BADGE DA COMPETIÇÃO -->
            <div class="flex items-center gap-1.5 bg-white/10 border border-white/15 px-3 py-1 rounded text-[11px] font-bold text-white/90 uppercase tracking-wider flex-shrink-0">
                <i class="fa-solid fa-trophy text-amber-400 text-[10px]"></i>
                <span>${escapeHTML(torneioNome)}</span>
            </div>

            <div class="h-5 w-px bg-white/20 hidden sm:block"></div>

            <!-- DESTAQUE DO TIME QUE MARCOU -->
            <div class="flex items-center gap-1.5 font-extrabold text-xs sm:text-sm uppercase tracking-wider text-emerald-400 flex-shrink-0">
                <i class="fa-solid fa-circle-arrow-up text-xs"></i>
                <span>GOL DO ${escapeHTML(nomeGol)}</span>
            </div>

            <div class="h-5 w-px bg-white/20 hidden sm:block"></div>

            <!-- MATCHUP & PLACAR TELEVISIVO -->
            <div class="flex items-center gap-2.5 flex-shrink-0">
                <!-- TIME CASA -->
                <div class="flex items-center gap-2">
                    <span class="font-bold text-xs sm:text-sm tracking-tight text-white uppercase">${escapeHTML(nomeCasa)}</span>
                    <div class="w-6 h-6 rounded-full bg-white/10 p-0.5 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                        <img src="${logoC}" class="w-full h-full object-contain" onerror="this.style.display='none'">
                    </div>
                </div>

                <!-- CÁPSULA DO PLACAR -->
                <div class="flex items-center gap-1.5 bg-black/60 border border-white/20 px-2.5 py-0.5 rounded font-black text-sm sm:text-base text-white tabular-nums shadow-inner">
                    <span class="${isGolCasa ? 'text-emerald-400 font-[1000]' : ''}">${golsC}</span>
                    <span class="text-white/40 text-xs font-normal">x</span>
                    <span class="${isGolFora ? 'text-emerald-400 font-[1000]' : ''}">${golsF}</span>
                </div>

                <!-- TIME FORA -->
                <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full bg-white/10 p-0.5 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                        <img src="${logoF}" class="w-full h-full object-contain" onerror="this.style.display='none'">
                    </div>
                    <span class="font-bold text-xs sm:text-sm tracking-tight text-white uppercase">${escapeHTML(nomeFora)}</span>
                </div>
            </div>
        </div>
    `;

    if (torneioNome.toUpperCase().includes("NORDESTE")) {
        overlay.classList.add("nordeste-theme");
    } else {
        overlay.classList.remove("nordeste-theme");
    }

    if (container) {
        container.classList.remove("opacity-0", "translate-y-full", "pointer-events-none");
        if (window.tickerHideTimeout) clearTimeout(window.tickerHideTimeout);
        window.tickerHideTimeout = setTimeout(() => {
            container.classList.add("opacity-0", "translate-y-full", "pointer-events-none");
        }, 12000);
    }

    overlay.classList.remove("ticker-goal-anim");
    void overlay.offsetWidth;
    overlay.classList.add("ticker-goal-anim");
}

function startTickerObserver() {
    if (tickerObserverLoop) clearInterval(tickerObserverLoop);
    if (!giroAtivo) return; // Se o giro está desligado, não inicia o observador

    currentTournamentLabel = "GIRO DA RODADA";
    estaTrocandoLabel = false;

    tickerObserverLoop = setInterval(() => {
        const labelEl = DOM.tickerLabel || document.getElementById('tickerLabel');
        const uiTransmissao = DOM.uiTransmissao || document.getElementById('uiTransmissao');
        if (!labelEl || estaTrocandoLabel || uiTransmissao.style.display === "none") return;

        const triggerX = labelEl.getBoundingClientRect().right;

        const items = document.querySelectorAll('.ticker-item[data-tournament]');
        for (let item of items) {
            const rect = item.getBoundingClientRect();
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
    const labelBg = DOM.tickerLabel || document.getElementById('tickerLabel');
    const labelText = DOM.tickerLabelText || document.getElementById('tickerLabelText');
    if (!labelBg || !labelText || estaTrocandoLabel) return;

    estaTrocandoLabel = true;

    labelBg.className = `ticker-label overflow-hidden relative flex items-center justify-center z-[5] bg-gradient-to-b from-gray-900 to-black border-r border-gray-700 shadow-[5px_0_15px_rgba(0,0,0,0.5)]`;

    labelText.style.transition = 'all 0.4s cubic-bezier(0.5, 0, 0.5, 1)';
    labelText.style.transform = 'translateY(-100%)';
    labelText.style.opacity = '0';

    setTimeout(() => {
        const imgHtml = logo ? `<img src="${logo}" class="w-6 h-6 object-contain mr-3 brightness-200" onerror="this.style.display='none'">` : `<i class="fa-solid fa-trophy mr-3 text-gray-400"></i>`;
        labelText.innerHTML = `<div class="flex items-center px-4 w-full justify-center truncate text-[12px] whitespace-nowrap">${imgHtml}${escapeHTML(novoTexto.toUpperCase())}</div>`;

        labelText.style.transition = 'none';
        labelText.style.transform = 'translateY(100%)';

        void labelText.offsetWidth;

        labelText.style.transition = 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
        labelText.style.transform = 'translateY(0)';
        labelText.style.opacity = '1';

        setTimeout(() => {
            estaTrocandoLabel = false;
        }, 600);
    }, 450);
}

function aplicarEstadoGiro() {
    const tickerWrap = document.querySelector('.ticker-wrap');
    const labelText = document.getElementById('tickerLabelText');

    if (!giroAtivo) {
        if (tickerWrap) tickerWrap.classList.add('hidden');
        if (tickerObserverLoop) {
            clearInterval(tickerObserverLoop);
            tickerObserverLoop = null;
        }
        // Reseta o label para o padrão quando desativado
        if (labelText) {
            labelText.innerHTML = `<i class="fa-solid fa-bolt mr-3 text-sky-400"></i> GIRO DA RODADA`;
            labelText.style.transform = 'translateY(0)';
            labelText.style.opacity = '1';
        }
    } else {
        if (tickerWrap) tickerWrap.classList.remove('hidden');
        // Reinicia a lógica se estivermos em modo auto e na tela de transmissão
        const uiTransmissao = document.getElementById('uiTransmissao');
        if (uiTransmissao && uiTransmissao.style.display !== "none") {
            startTickerObserver();
        }
    }
}
