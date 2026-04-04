// ========== js/broadcast/tabela.js ==========
// Classificação / Standings

function toggleTabela() {
    mostrarTabela = !mostrarTabela;
    const painel = DOM.panelTabela || document.getElementById("tvPanelTabela");
    const btn = DOM.btnToggleTabela || document.getElementById("btnToggleTabela");
    
    if (mostrarTabela && mostrarConfrontos) toggleConfrontos();
    
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
    const tbody = DOM.tabelaBody || document.getElementById("tabTabelaBody");
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

        const tabelaNomeCamp = DOM.tabelaNomeCamp || document.getElementById("tabNomeCamp");
        if (tabelaNomeCamp) tabelaNomeCamp.innerText = (data.standings[0].tournament?.name || 'Classificação').toUpperCase();

        let html = '';
        let currentTablePositions = {};
        data.standings.forEach(std => {
            if (data.standings.length > 1 && std.name) {
                html += `<tr><td colspan="5" class="bg-gray-800 border-y border-gray-700 text-center text-[10px] font-bold py-1 text-gray-400 uppercase tracking-widest">${escapeHTML(std.name)}</td></tr>`;
            }
            std.rows.forEach(r => {
                const pos = r.position;
                const teamId = r.team.id;
                currentTablePositions[teamId] = pos;
                const teamName = escapeHTML(r.team.shortName || r.team.name);
                const pts = r.points ?? 0;
                const jogos = r.matches ?? r.played ?? 0;
                const sg = r.goalsDiff ?? r.scoreDiff ?? ((r.scoresFor ?? 0) - (r.scoresAgainst ?? 0));

                let promoColor = 'bg-transparent';
                if (r.promotion) {
                    const txt = (r.promotion.text || '').toLowerCase();
                    if (txt.includes('libertadores')) promoColor = 'bg-sky-500';
                    else if (txt.includes('sul-americana') || txt.includes('sudamericana')) promoColor = 'bg-orange-500';
                    else if (txt.includes('relegation') || txt.includes('rebaixamento') || txt.includes('rebaixado')) promoColor = 'bg-red-500';
                    else if (txt.includes('promotion') || txt.includes('promovido') || txt.includes('série a') || txt.includes('série b') || txt.includes('acesso')) promoColor = 'bg-emerald-500';
                    else if (txt.includes('qualifiers') || txt.includes('qualificação') || txt.includes('play-off') || txt.includes('playoffs') || txt.includes('qualificado')) promoColor = 'bg-cyan-500';
                    else if (txt.includes('semifinal') || txt.includes('semifinais')) promoColor = 'bg-amber-500';
                    else if (txt.includes('quarter-final') || txt.includes('quartas')) promoColor = 'bg-blue-400';
                    else if (txt.includes('next round') || txt.includes('fase final')) promoColor = 'bg-emerald-400';
                }

                if (silencioso && prevTablePositions[teamId] !== undefined) {
                    if (pos < prevTablePositions[teamId]) tableTrends[teamId] = 'up';
                    else if (pos > prevTablePositions[teamId]) tableTrends[teamId] = 'down';
                }

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

        if (scrollTabelaInterval) { clearInterval(scrollTabelaInterval); scrollTabelaInterval = null; }
        if (scrollTabelaTimeout) { clearTimeout(scrollTabelaTimeout); scrollTabelaTimeout = null; }
        const container = document.querySelector('#tvPanelTabela .overflow-y-auto');
        if (container) container.scrollTop = 0;

    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Erro ao carregar tabela</td></tr>`;
    }
}

function iniciarAutoScrollTabela() {
    return; // Mantido por compatibilidade, mas a tabela não faz mais auto-scroll.
}
