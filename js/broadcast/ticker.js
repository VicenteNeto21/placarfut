// ========== js/broadcast/ticker.js ==========
// Giro da Rodada — Ticker de resultados na barra inferior

async function atualizarRodapeSofaScore() {
    try {
        const { iso: dataHoje } = getDataComOffset(0);
        
        const [dataSched, dataLive] = await Promise.all([
            fetchSofaScore(`sport/football/scheduled-events/${dataHoje}`),
            fetchSofaScore('sport/football/events/live').catch(() => ({ events: [] }))
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
            return GIRO_TORNEIOS_IDS.includes(tornId) || CAMPEONATOS_FIXOS_CODIGO.includes(tornId);
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
                    for(let i=0; i<j.homeRedCards; i++) rcC += `<span class="bg-red-600 w-1.5 h-2.5 inline-block rounded-[1px] ml-1 shadow-[0_0_2px_rgba(220,38,38,0.8)]"></span>`;
                }
                let rcF = "";
                if (j.awayRedCards) {
                    for(let i=0; i<j.awayRedCards; i++) rcF += `<span class="bg-red-600 w-1.5 h-2.5 inline-block rounded-[1px] mr-1 shadow-[0_0_2px_rgba(220,38,38,0.8)]"></span>`;
                }

                const logoTorneio = `${BACKEND_URL}?path=unique-tournament/${tornId}/image`;
                const homeTeamName = escapeHTML(traduzirNomeEquipe(j.homeTeam.shortName || j.homeTeam.name));
                const awayTeamName = escapeHTML(traduzirNomeEquipe(j.awayTeam.shortName || j.awayTeam.name));

                if (nomeCompeticaoTicker !== currentTournamentName) {
                    tickerHTML += `
                        <div class="ticker-item !border-none !px-4 ml-8" data-tournament="${escapeHTML(nomeCompeticaoTicker)}" data-logo="${logoTorneio}">
                            <div class="bg-gray-800 text-white font-black uppercase tracking-widest px-5 py-1.5 rounded-full shadow-lg flex items-center gap-2 border border-gray-600">
                                <img src="${logoTorneio}" class="w-4 h-4 object-contain brightness-200" onerror="this.style.display='none'"> ${escapeHTML(nomeCompeticaoTicker)}
                            </div>
                        </div>
                    `;
                    currentTournamentName = nomeCompeticaoTicker;
                }

                tickerHTML += `
                    <div class="ticker-item" data-tournament="${escapeHTML(nomeCompeticaoTicker)}" data-logo="${logoTorneio}">
                        <span class="ticker-status ${isLive ? 'text-sky-400' : 'text-gray-400'} mr-2">[${tempoStr}]</span>
                        <img src="${BACKEND_URL}?path=team/${j.homeTeam.id}/image" class="h-5 mr-2 object-contain rounded">
                        ${homeTeamName}${rcC}
                        ${extraPenC}
                        <span class="text-white font-black mx-1">${currentHome}</span>
                        <span class="text-gray-400">vs</span>
                        <span class="text-white font-black mx-1">${currentAway}</span>
                        ${extraPenF}
                        ${rcF}${awayTeamName}
                        <img src="${BACKEND_URL}?path=team/${j.awayTeam.id}/image" class="h-5 ml-2 object-contain rounded">
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
    if (!overlay || !textEl) return;

    const siglaCasa = (timeCasa.shortName || timeCasa.name).substring(0, 3).toUpperCase();
    const siglaFora = (timeFora.shortName || timeFora.name).substring(0, 3).toUpperCase();

    const logoC = `${BACKEND_URL}?path=team/${timeCasa.id}/image`;
    const logoF = `${BACKEND_URL}?path=team/${timeFora.id}/image`;

    textEl.innerHTML = `
        <span class="bg-gray-800 border border-gray-600 text-white px-3 py-0.5 rounded-full text-[10px] uppercase tracking-widest shadow-md mr-4 flex items-center gap-1.5"><i class="fa-solid fa-trophy text-gray-400"></i> ${escapeHTML(torneioNome)}</span>
        <span class="text-sky-400 italic mr-5 flex items-center gap-2"><i class="fa-solid fa-futbol animate-bounce"></i> GOL DO ${escapeHTML(timeGolNome.toUpperCase())}!</span>
        <img src="${logoC}" class="h-6 mx-2 object-contain drop-shadow-md" onerror="this.style.display='none'">
        <span class="font-normal mx-1">${escapeHTML(siglaCasa)}</span> 
        <span class="text-white font-black mx-1">${golsC}</span> 
        <span class="text-gray-500 font-normal text-sm mx-1">x</span> 
        <span class="text-white font-black mx-1">${golsF}</span> 
        <span class="font-normal mx-1">${escapeHTML(siglaFora)}</span>
        <img src="${logoF}" class="h-6 mx-2 object-contain drop-shadow-md" onerror="this.style.display='none'">
    `;
    
    if (torneioNome.toUpperCase().includes("NORDESTE")) {
        overlay.classList.add("nordeste-theme");
    } else {
        overlay.classList.remove("nordeste-theme");
    }

    overlay.classList.remove("ticker-goal-anim");
    void overlay.offsetWidth;
    overlay.classList.add("ticker-goal-anim");
}

function startTickerObserver() {
    if (tickerObserverLoop) clearInterval(tickerObserverLoop);
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
