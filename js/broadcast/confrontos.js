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

async function carregarConfrontos() {
    const body = DOM.confrontosBody || document.getElementById("tvConfrontosBody");
    body.innerHTML = `<div class="flex items-center justify-center p-12 text-gray-500 italic text-sm"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Buscando chaves...</div>`;

    if (!currentTournamentId || !currentSeasonId) {
        body.innerHTML = `<div class="p-8 text-center text-gray-500">Torneio não identificado para chaves.</div>`;
        return;
    }

    try {
        const data = await fetchSofaScore(`unique-tournament/${currentTournamentId}/season/${currentSeasonId}/cuptrees`);
        if (!data || !data.cuptrees || data.cuptrees.length === 0) {
            body.innerHTML = `<div class="p-8 text-center text-gray-500">Mata-mata não disponível para este torneio.</div>`;
            return;
        }

        const confNomeCamp = DOM.confNomeCamp || document.getElementById("confNomeCamp");
        if (confNomeCamp) confNomeCamp.innerText = "PLAYOFFS / MATA-MATA";

        const tree = data.cuptrees[0];
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
                                <img src="${BACKEND_URL}?path=team/${home?.id}/image" class="w-4 h-4 object-contain" onerror="this.style.display='none'">
                                <span class="cup-team-name">${escapeHTML(home?.shortName || home?.name || 'A definir')}</span>
                            </div>
                            <span class="cup-score">${scoreHome}</span>
                        </div>
                        <div class="cup-team ${away?.id === winnerId ? 'winner' : ''}">
                            <div class="flex items-center gap-2 overflow-hidden">
                                <img src="${BACKEND_URL}?path=team/${away?.id}/image" class="w-4 h-4 object-contain" onerror="this.style.display='none'">
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
        
    } catch (error) {
        console.error("Erro ao carregar mata-mata:", error);
        body.innerHTML = `<div class="p-8 text-center text-red-500">Erro ao carregar dados do mata-mata.</div>`;
    }
}
