// ========== js/broadcast/confrontos.js ==========
// Mata-mata / Chaves do torneio (Cup Tree)

function toggleConfrontos() {
    mostrarConfrontos = !mostrarConfrontos;
    const painel = DOM.panelConfrontos || document.getElementById("tvPanelConfrontos");
    const btn = DOM.btnToggleConfrontos || document.getElementById("btnToggleConfrontos");
    
    if (mostrarConfrontos && mostrarTabela) toggleTabela();

    if (mostrarConfrontos) {
        painel.classList.remove("oculto");
        if (btn) btn.classList.replace("bg-gray-900/80", "bg-amber-600");
        carregarConfrontos();
    } else {
        painel.classList.add("oculto");
        if (btn) btn.classList.replace("bg-amber-600", "bg-gray-900/80");
    }
}

let mostrarProximosJogos = false;

function toggleProximosJogos() {
    mostrarProximosJogos = !mostrarProximosJogos;
    const painel = DOM.panelProximosJogos || document.getElementById("tvPanelProximosJogos");
    const btn = document.getElementById("btnToggleProximosJogos");
    
    if (mostrarProximosJogos && mostrarTabela) toggleTabela();

    if (mostrarProximosJogos) {
        painel.classList.remove("oculto");
        if (btn) { btn.classList.replace("bg-gray-900/80", "bg-cyan-600"); btn.classList.replace("opacity-20", "opacity-100"); }
        carregarProximosJogosDosTimes();
    } else {
        painel.classList.add("oculto");
        if (btn) { btn.classList.replace("bg-cyan-600", "bg-gray-900/80"); btn.classList.replace("opacity-100", "opacity-20"); }
    }
}

async function carregarProximosJogosDosTimes() {
    const body = DOM.proximosJogosBody || document.getElementById("tvProximosJogosBody");
    const nomeCamp = DOM.proxNomeCamp || document.getElementById("proxNomeCamp");
    if (!body) return;
    body.innerHTML = `<div class="flex items-center justify-center p-12 text-gray-500 italic text-sm"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Buscando próximos jogos...</div>`;
    if (nomeCamp) nomeCamp.innerText = "PRÓXIMOS JOGOS";

    if (!currentHomeTeamId || !currentAwayTeamId) {
        body.innerHTML = `<div class="p-8 text-center text-gray-500">Times não identificados.</div>`;
        return;
    }

    try {
        const nomeCasa = document.getElementById("tvNomeCasa")?.innerText || 'TIME CASA';
        const nomeFora = document.getElementById("tvNomeFora")?.innerText || 'TIME FORA';

        const datas = [];
        const hoje = new Date();
        for (let i = 0; i < 14; i++) {
            const d = new Date(hoje);
            d.setDate(d.getDate() + i);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const dStr = String(d.getDate()).padStart(2, '0');
            datas.push(`${y}-${m}-${dStr}`);
        }

        const todosEventos = [];
        for (const data of datas) {
            try {
                const dataEvents = await fetchWithFallback(`sport/football/scheduled-events/${data}`);
                if (dataEvents?.events) {
                    todosEventos.push(...dataEvents.events);
                }
            } catch (e) {}
        }

        const now = Math.floor(Date.now() / 1000);
        
        const jogosUnicos = (eventos) => {
            const seen = new Set();
            return eventos.filter(ev => {
                if (seen.has(ev.id)) return false;
                seen.add(ev.id);
                return true;
            });
        };

        const filtradosCasa = jogosUnicos(todosEventos
            .filter(ev => ev.homeTeam?.id === currentHomeTeamId || ev.awayTeam?.id === currentHomeTeamId)
            .filter(ev => (ev.startTimestamp || 0) > now || (ev.status?.code >= 1 && ev.status?.code <= 31))
            .slice(0, 5));

        const filtradosFora = jogosUnicos(todosEventos
            .filter(ev => ev.homeTeam?.id === currentAwayTeamId || ev.awayTeam?.id === currentAwayTeamId)
            .filter(ev => (ev.startTimestamp || 0) > now || (ev.status?.code >= 1 && ev.status?.code <= 31))
            .slice(0, 5));

        let html = '';

        const renderTeam = (eventos, teamId, teamName) => {
            let total = 0;
            let html = '';
            eventos.forEach(ev => {
                const isHome = ev.homeTeam?.id === teamId;
                const rival = isHome ? ev.awayTeam : ev.homeTeam;
                const rivalId = isHome ? ev.awayTeam?.id : ev.homeTeam?.id;
                const dt = ev.startTimestamp ? new Date(ev.startTimestamp * 1000) : null;
                const dataExib = dt ? dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '--/--';
                const horaExib = dt ? dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
                const comp = ev.tournament?.name || ev.roundInfo?.name || '';
                const statusCode = ev.status?.code;
                const isLive = statusCode >= 1 && statusCode <= 31;
                const statusTxt = isLive ? 'AO VIVO' : (statusCode === 0 ? horaExib : dataExib);
                const corBadge = isLive ? 'text-red-500 border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 rounded text-[9px] font-black uppercase' : 'text-gray-500 text-[9px]';
                const dataHora = dt ? `${dataExib} ${horaExib}` : '';

                total++;
                html += `
                    <div class="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-xs gap-2">
                        <div class="flex items-center gap-2 min-w-0">
                            <span class="${corBadge} shrink-0">${statusTxt}</span>
                            <img src="${sofaImg(`team/${rivalId}/image`)}" class="w-4 h-4 object-contain shrink-0" onerror="this.style.display='none'">
                            <span class="text-white font-bold truncate">${rival?.shortName || rival?.name || '?'}</span>
                        </div>
                        <div class="shrink-0 text-right min-w-[80px]">
                            <div class="text-[9px] text-gray-500 uppercase tracking-widest truncate">${comp}</div>
                            ${dataHora ? `<div class="text-[9px] text-gray-400">${dataHora}</div>` : ''}
                        </div>
                    </div>
                `;
            });
            return { total, html };
        };

        const casa = renderTeam(filtradosCasa, currentHomeTeamId, nomeCasa);
        const fora = renderTeam(filtradosFora, currentAwayTeamId, nomeFora);

        if (casa.total === 0 && fora.total === 0) {
            html = `<div class="p-8 text-center text-gray-500 italic text-sm">Nenhum próximo jogo encontrado.</div>`;
        } else {
            html = `
                <div class="mb-6">
                    <div class="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                        <img src="${sofaImg(`team/${currentHomeTeamId}/image`)}" class="w-5 h-5 object-contain" onerror="this.style.display='none'">
                        <span class="text-sm font-black uppercase text-white">${nomeCasa}</span>
                        <span class="text-xs text-gray-500 ml-auto">${casa.total} jogos</span>
                    </div>
                    ${casa.total > 0 ? casa.html : '<div class="text-xs text-gray-600 italic p-2">Sem jogos futuros</div>'}
                </div>
                <div class="mb-4">
                    <div class="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                        <img src="${sofaImg(`team/${currentAwayTeamId}/image`)}" class="w-5 h-5 object-contain" onerror="this.style.display='none'">
                        <span class="text-sm font-black uppercase text-white">${nomeFora}</span>
                        <span class="text-xs text-gray-500 ml-auto">${fora.total} jogos</span>
                    </div>
                    ${fora.total > 0 ? fora.html : '<div class="text-xs text-gray-600 italic p-2">Sem jogos futuros</div>'}
                </div>
            `;
        }

        body.innerHTML = html;
    } catch (error) {
        console.error("Erro carregarProximosJogosDosTimes:", error);
        body.innerHTML = `<div class="p-8 text-center text-red-500 text-xs">Erro ao carregar próximos jogos.</div>`;
    }
}

async function carregarConfrontos() {
    const body = DOM.confrontosBody || document.getElementById("tvConfrontosBody");
    body.innerHTML = `<div class="flex items-center justify-center p-12 text-gray-500 italic text-sm"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Buscando chaves...</div>`;

    if (!currentTournamentId) {
        body.innerHTML = `<div class="p-8 text-center text-gray-500">Torneio não identificado para chaves.</div>`;
        return;
    }

    // Se não tiver seasonId, buscar automaticamente
    let seasonId = currentSeasonId;
    if (!seasonId) {
        // Primeiro tenta buscar do jogo atual
        if (currentEventData && currentEventData.season && currentEventData.season.id) {
            seasonId = currentEventData.season.id;
            console.log('[MATA-MATA] Season do evento atual:', seasonId);
        }
        
        // Se ainda não tiver, buscar seasons do torneiolo
        if (!seasonId) {
            try {
                const seasonsData = await fetchWithFallback(`unique-tournament/${currentTournamentId}/seasons`);
                if (seasonsData && seasonsData.seasons && seasonsData.seasons.length > 0) {
                    seasonId = seasonsData.seasons[0].id;
                    console.log('[MATA-MATA] Season detectada:', seasonId);
                }
            } catch (e) {
                console.error('Erro ao buscar season:', e);
            }
        }
    }

    if (!seasonId) {
        // Último recurso: tentar extrair do roundInfo do evento atual
        if (currentEventData && currentEventData.roundInfo) {
            seasonId = currentEventData.roundInfo.seasonId;
        }
    }

    if (!seasonId) {
        // Mostrar mensagem de erro mais informativa
        body.innerHTML = `<div class="p-8 text-center text-gray-500">
            <p>Season não identificada para este torneos.</p>
            <p class="text-xs mt-2">Torneio ID: ${currentTournamentId}</p>
        </div>`;
        return;
    }

    try {
        // Tentar primeiro: CUP TREES (Champions, Libertadores - formato bracket)
        const cupData = await fetchWithFallback(`unique-tournament/${currentTournamentId}/season/${seasonId}/cuptrees`);
        
        if (cupData && cupData.cuptrees && cupData.cuptrees.length > 0) {
            renderizarCupTrees(cupData, body);
            return;
        }

        // Se não tem cuptrees, tentar ROUNDS (Copa do Brasil - formato ida/volta)
        const roundsData = await fetchWithFallback(`unique-tournament/${currentTournamentId}/season/${seasonId}/rounds`);
        
        if (roundsData && roundsData.rounds && roundsData.rounds.length > 0) {
            renderizarRounds(roundsData, body);
            return;
        }

        // Como último recurso, buscar eventos de HOJE do torneiolo
        // Usar a data de hoje para buscar eventos programados
        const hoje = new Date();
        const y = hoje.getFullYear();
        const m = String(hoje.getMonth() + 1).padStart(2, '0');
        const d = String(hoje.getDate()).padStart(2, '0');
        const dataHoje = `${y}-${m}-${d}`;
        
        const eventosData = await fetchWithFallback(`sport/football/scheduled-events/${dataHoje}`);
        
        if (eventosData && eventosData.events) {
            // Filtrar eventos deste torneiolo
            const jogosDoTorneio = eventosData.events.filter(ev => {
                const tornId = ev.tournament?.uniqueTournament?.id || ev.tournament?.id;
                return tornId === currentTournamentId;
            });
            
            if (jogosDoTorneio.length > 0) {
                // Renderizar como lista simple
                renderizarProximosJogos({ events: jogosDoTorneio.slice(0, 20) }, body);
                return;
            }
        }

        // Nenhum dado encontrado
        body.innerHTML = `<div class="p-8 text-center text-gray-500">
            <p>Mata-mata não disponível para este torneio.</p>
            <p class="text-xs mt-2 text-gray-600">Torneio: ${currentTournamentId} | Season: ${seasonId}</p>
        </div>`;
        
    } catch (error) {
        console.error("Erro ao carregar mata-mata:", error);
        body.innerHTML = `<div class="p-8 text-center text-red-500">Erro ao carregar datos do mata-mata.</div>`;
    }
}

function renderizarCupTrees(cupData, body) {
    const confNomeCamp = DOM.confNomeCamp || document.getElementById("confNomeCamp");
    if (confNomeCamp) confNomeCamp.innerText = "PLAYOFFS / MATA-MATA";

    const tree = cupData.cuptrees[0];
    let html = '<div class="cup-container">';
    
    tree.rounds.forEach(round => {
        html += `<div class="cup-round">`;
        html += `<div class="cup-round-title">${escapeHTML(round.description || 'Fase')}</div>`;
        
        round.blocks.forEach(block => {
            const home = block.homeTeam;
            const away = block.awayTeam;
            const scoreHome = block.homeScore?.display ?? '-';
            const scoreAway = block.awayScore?.display ?? '-';
            const winnerId = block.winnerId;

            html += `
                <div class="cup-match">
                    <div class="cup-team ${home?.id === winnerId ? 'winner' : ''}">
                        <div class="flex items-center gap-2 overflow-hidden">
                            <img src="${sofaImg(`team/${home?.id}/image`)}" class="w-4 h-4 object-contain" onerror="this.style.display='none'">
                            <span class="cup-team-name">${escapeHTML(home?.shortName || home?.name || 'A definir')}</span>
                        </div>
                        <span class="cup-score">${scoreHome}</span>
                    </div>
                    <div class="cup-team ${away?.id === winnerId ? 'winner' : ''}">
                        <div class="flex items-center gap-2 overflow-hidden">
                            <img src="${sofaImg(`team/${away?.id}/image`)}" class="w-4 h-4 object-contain" onerror="this.style.display='none'">
                            <span class="cup-team-name">${escapeHTML(away?.shortName || away?.name || 'A definir')}</span>
                        </div>
                        <span class="cup-score">${scoreAway}</span>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    });

    html += '</div>';
    body.innerHTML = html;
}

function renderizarRounds(roundsData, body) {
    const confNomeCamp = DOM.confNomeCamp || document.getElementById("confNomeCamp");
    if (confNomeCamp) confNomeCamp.innerText = "COPA DO BRASIL / RODADAS";

    let html = '<div class="w-full overflow-x-auto pb-4">';
    
    roundsData.rounds.forEach((round, idx) => {
        const faseNome = mapTraducoesCampeonato(round.name || round.description || `Rodada ${idx + 1}`);
        
        html += `<div class="mb-6">`;
        html += `<div class="cup-round-title">${escapeHTML(faseNome)}</div>`;
        
        if (round.events && round.events.length > 0) {
            round.events.forEach(ev => {
                const home = ev.homeTeam;
                const away = ev.awayTeam;
                const golC = ev.homeScore?.current ?? '-';
                const golF = ev.awayScore?.current ?? '-';
                const status = ev.status?.code;
                const isEncerrado = status === 100 || ev.status?.type === 'finished';
                const isAoVivo = status >= 1 && status <= 31;

                html += `
                    <div class="cup-match ${isAoVivo ? 'border-amber-500/50' : ''}">
                        <div class="cup-team ${isEncerrado && golC > golF ? 'winner' : ''}">
                            <div class="flex items-center gap-2 overflow-hidden">
                                <img src="${sofaImg(`team/${home?.id}/image`)}" class="w-4 h-4 object-contain" onerror="this.style.display='none'">
                                <span class="cup-team-name">${escapeHTML(home?.shortName || home?.name || 'A definir')}</span>
                            </div>
                            <span class="cup-score ${isEncerrado ? 'text-emerald-400' : ''}">${golC}</span>
                        </div>
                        <div class="cup-team ${isEncerrado && golF > golC ? 'winner' : ''}">
                            <div class="flex items-center gap-2 overflow-hidden">
                                <img src="${sofaImg(`team/${away?.id}/image`)}" class="w-4 h-4 object-contain" onerror="this.style.display='none'">
                                <span class="cup-team-name">${escapeHTML(away?.shortName || away?.name || 'A definir')}</span>
                            </div>
                            <span class="cup-score ${isEncerrado ? 'text-emerald-400' : ''}">${golF}</span>
                        </div>
                    </div>
                `;
            });
        } else {
            html += `<div class="text-gray-500 text-xs p-2">Sem jogos nesta fase</div>`;
        }
        
        html += `</div>`;
    });

    html += '</div>';
    body.innerHTML = html;
}

function renderizarProximosJogos(eventsData, body) {
    const confNomeCamp = DOM.confNomeCamp || document.getElementById("confNomeCamp");
    if (confNomeCamp) confNomeCamp.innerText = "PRÓXIMOS JOGOS";

    let html = '<div class="w-full">';
    
    // Agrupar por round/fase se disponível
    const fases = {};
    eventsData.events.forEach(ev => {
        const fase = ev.roundInfo?.name || ev.roundInfo?.round || 'Próximos';
        if (!fases[fase]) fases[fase] = [];
        fases[fase].push(ev);
    });

    Object.keys(fases).forEach(fase => {
        html += `<div class="mb-4">`;
        html += `<div class="cup-round-title">${escapeHTML(fase)}</div>`;
        
        fases[fase].forEach(ev => {
            const home = ev.homeTeam;
            const away = ev.awayTeam;
            const dt = ev.startTimestamp ? new Date(ev.startTimestamp * 1000) : null;
            const horario = dt ? dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';

            html += `
                <div class="cup-match">
                    <div class="cup-team">
                        <div class="flex items-center gap-2 overflow-hidden">
                            <img src="${sofaImg(`team/${home?.id}/image`)}" class="w-4 h-4 object-contain" onerror="this.style.display='none'">
                            <span class="cup-team-name">${escapeHTML(home?.shortName || home?.name || 'A definir')}</span>
                        </div>
                        <span class="cup-score text-gray-500">vs</span>
                    </div>
                    <div class="text-xs text-gray-400">${horario}</div>
                    <div class="cup-team">
                        <div class="flex items-center gap-2 overflow-hidden">
                            <span class="cup-team-name">${escapeHTML(away?.shortName || away?.name || 'A definir')}</span>
                            <img src="${sofaImg(`team/${away?.id}/image`)}" class="w-4 h-4 object-contain" onerror="this.style.display='none'">
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
    });

    html += '</div>';
    body.innerHTML = html;
}
