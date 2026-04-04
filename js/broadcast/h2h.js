// ========== js/broadcast/h2h.js ==========
// Painel Pré-Jogo: Frente a Frente (H2H) — Slides, forma, confrontos, artilheiros, shotmap, estatísticas

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
    h2hSlideInterval = setInterval(() => mudarSlideH2H(1), 8000);
}

function toggleH2H() {
    mostrarH2H = !mostrarH2H;
    const overlay = DOM.h2hOverlay || document.getElementById("tvH2HOverlay");
    const btn = DOM.btnToggleH2H || document.getElementById("btnToggleH2H");
    const placar = DOM.placarWrapper || document.getElementById("placarWrapper");
    
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

async function carregarH2H() {
    document.getElementById("h2hNomeCasa").innerText = (DOM.nomeCasa || document.getElementById("tvNomeCasa")).innerText;
    document.getElementById("h2hNomeFora").innerText = (DOM.nomeFora || document.getElementById("tvNomeFora")).innerText;
    document.getElementById("h2hLogoCasa").src = (DOM.imgLogoCasa || document.getElementById("imgLogoCasa")).src;
    document.getElementById("h2hLogoFora").src = (DOM.imgLogoFora || document.getElementById("imgLogoFora")).src;
    
    const isManual = modoAtual === 'manual';
    
    const tidH2h = currentEventData?.tournament?.uniqueTournament?.id || currentTournamentId || 0;
    const tornNameApi = currentEventData?.tournament?.name || '';
    const tornName = nomeCampeonatoExibicao(tidH2h, tornNameApi, (DOM.campeonato || document.getElementById("tvCampeonato")).innerText || '-');
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
    
    let referee = currentEventData?.referee?.name || 'Árbitro não informado';
    document.getElementById("h2hReferee").innerText = referee;

    let managerCasa = currentEventData?.homeTeam?.manager?.name || currentEventData?.homeManager?.name || '-';
    let managerFora = currentEventData?.awayTeam?.manager?.name || currentEventData?.awayManager?.name || '-';
    document.getElementById("h2hManagerCasa").innerText = managerCasa.toUpperCase();
    document.getElementById("h2hManagerFora").innerText = managerFora.toUpperCase();
    
    try {
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

    // --------- Helpers internos do H2H ---------

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
        if (!formArray || formArray.length === 0) { el.innerText = 'Sem histórico recente'; return; }
        const wins = formArray.filter(r => r === 'W').length;
        const draws = formArray.filter(r => r === 'D').length;
        const losses = formArray.filter(r => r === 'L').length;
        el.innerText = `${wins}V ${draws}E ${losses}D nas últimas ${formArray.length}`;
    };

    const renderRecentes = (eventos, teamId, containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        const recentes = (eventos || []).filter(ev => ev.status?.code === 100 || ev.status?.type === 'finished').slice(0, 6);
        if (!recentes.length) {
            container.innerHTML = '<div class="text-center text-gray-500 text-xs italic">Sem jogos recentes</div>';
            return;
        }
        container.innerHTML = recentes.map(ev => {
            const isHome = ev.homeTeam?.id === teamId;
            const rival = escapeHTML(isHome ? (ev.awayTeam?.shortName || ev.awayTeam?.name || '-') : (ev.homeTeam?.shortName || ev.homeTeam?.name || '-'));
            const rivalId = isHome ? ev.awayTeam?.id : ev.homeTeam?.id;
            const golsPro = isHome ? (ev.homeScore?.current ?? 0) : (ev.awayScore?.current ?? 0);
            const golsContra = isHome ? (ev.awayScore?.current ?? 0) : (ev.homeScore?.current ?? 0);
            const data = ev.startTimestamp ? new Date(ev.startTimestamp * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: APP_TIMEZONE }) : '--/--';
            const comp = escapeHTML(ev.tournament?.name || ev.season?.tournament?.name || '');
            const localizacao = isHome ? 'CASA' : 'FORA';
            const locCorClass = isHome ? 'text-sky-400' : 'text-orange-400';
            const resultado = golsPro > golsContra ? 'V' : golsPro < golsContra ? 'D' : 'E';
            const cor = resultado === 'V' ? 'text-emerald-400' : resultado === 'D' ? 'text-red-400' : 'text-gray-400';
            return `
                <div class="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2 gap-2">
                    <div class="flex items-center gap-2 min-w-0">
                        <span class="text-[9px] font-black ${locCorClass} shrink-0">${localizacao}</span>
                        <img src="${BACKEND_URL}?path=team/${rivalId}/image" class="w-4 h-4 object-contain shrink-0" onerror="this.style.display='none'">
                        <div class="flex flex-col min-w-0">
                            <span class="text-white font-bold text-xs truncate">${rival}</span>
                            <span class="text-[9px] uppercase tracking-widest text-gray-500 truncate">${comp || data}</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-3 shrink-0">
                        <span class="text-xs font-black ${cor}">${resultado}</span>
                        <span class="text-white font-black text-sm">${golsPro}-${golsContra}</span>
                    </div>
                </div>
            `;
        }).join('');
    };

    const extrairFormaRecente = (eventos, teamId) => {
        if (!Array.isArray(eventos)) return [];
        return eventos
            .filter(ev => ev.status?.code === 100 || ev.status?.type === 'finished')
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
                                <span class="font-bold text-white truncate text-sm" style="max-width: 90px">${escapeHTML(r.team.shortName || r.team.name)}</span>
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

    // Atualiza nomes no slide 3
    const nomeCasaEl = document.getElementById("h2hNomeCasaSlide3");
    const nomeForaEl = document.getElementById("h2hNomeForaSlide3");
    if (nomeCasaEl) nomeCasaEl.innerText = ' — ' + ((DOM.nomeCasa || document.getElementById("tvNomeCasa"))?.innerText || 'CASA');
    if (nomeForaEl) nomeForaEl.innerText = ' — ' + ((DOM.nomeFora || document.getElementById("tvNomeFora"))?.innerText || 'FORA');

    // Carrega Shotmap e xG (Slide 7)
    const carregarShotmap = async () => {
        const pitchEl = document.getElementById("h2hPitchContainer");
        const xGCasaEl = document.getElementById("h2hXGCasa");
        const xGForaEl = document.getElementById("h2hXGFora");
        if (!pitchEl || !currentEventData?.id) return;
        document.getElementById("h2hShotmapLogoCasa").src = `${BACKEND_URL}?path=team/${currentHomeTeamId}/image`;
        document.getElementById("h2hShotmapLogoFora").src = `${BACKEND_URL}?path=team/${currentAwayTeamId}/image`;
        try {
            const data = await fetchSofaScore(`event/${currentEventData.id}/shotmap`);
            const shots = data?.shotmap || [];
            const dots = pitchEl.querySelectorAll('.shot-dot');
            dots.forEach(d => d.remove());
            if (shots.length === 0) {
                xGCasaEl.innerText = "N/D";
                xGForaEl.innerText = "N/D";
                pitchEl.innerHTML += `<div class="shot-dot absolute inset-0 flex items-center justify-center text-white/50 font-bold uppercase tracking-widest text-xs z-20">Mapa de Finalizações não disponível para este jogo</div>`;
                return;
            }
            let acumuladoCasa = 0;
            let acumuladoFora = 0;
            shots.forEach(shot => {
                const isHome = shot.isHome;
                const xg = shot.xg || 0;
                if (isHome) acumuladoCasa += xg;
                else acumuladoFora += xg;
                const tipo = shot.incidentType;
                let bgColor = 'bg-gray-400';
                let shadow = '';
                if (tipo === 'goal') { bgColor = 'bg-emerald-500 border border-white pulse-goal'; shadow = 'shadow-[0_0_10px_rgba(16,185,129,0.9)]'; }
                else if (tipo === 'shotOnTarget' || tipo === 'saved') { bgColor = 'bg-blue-500 border border-white/50'; shadow = 'shadow-[0_0_8px_rgba(59,130,246,0.7)]'; }
                else { bgColor = 'bg-red-500 border border-white/50 opacity-80'; shadow = 'shadow-[0_0_8px_rgba(239,68,68,0.7)]'; }
                const sizePx = Math.max(6, Math.min(20, Math.round(xg * 30 + 6)));
                const px = shot.playerCoordinates.x;
                const py = shot.playerCoordinates.y;
                let leftPct;
                if (isHome) { leftPct = 100 - px; }
                else { leftPct = px; }
                const dotHtml = `<div class="shot-dot absolute rounded-full ${bgColor} ${shadow}" style="width: ${sizePx}px; height: ${sizePx}px; left: ${leftPct}%; top: ${py}%; transform: translate(-50%, -50%); transition: all 0.5s ease; z-index: ${tipo === 'goal'? 10 : 5}"></div>`;
                pitchEl.insertAdjacentHTML('beforeend', dotHtml);
            });
            xGCasaEl.innerText = acumuladoCasa.toFixed(2);
            xGForaEl.innerText = acumuladoFora.toFixed(2);
            if (!document.getElementById("pulseGoalStyle")) {
                document.head.insertAdjacentHTML('beforeend', `<style id="pulseGoalStyle">@keyframes pulseGoalAnim { 0% { transform: translate(-50%, -50%) scale(1); } 50% { transform: translate(-50%, -50%) scale(1.4); } 100% { transform: translate(-50%, -50%) scale(1); } } .pulse-goal { animation: pulseGoalAnim 1.5s infinite; }</style>`);
            }
        } catch(e) {
            console.error("Erro no shotmap:", e);
            pitchEl.innerHTML += `<div class="shot-dot absolute inset-0 flex items-center justify-center text-white/50 font-bold uppercase tracking-widest text-xs z-20">Sem dados xG neste torneio</div>`;
        }
    };

    // Carrega confrontos diretos (Slide 4)
    const carregarConfrontosDiretos = async () => {
        const listEl = document.getElementById("h2hDirectList");
        const scoreEl = document.getElementById("h2hDirectScore");
        if (!listEl || !currentHomeTeamId || !currentAwayTeamId) {
            if (listEl) listEl.innerHTML = '<div class="text-center text-gray-500 text-xs italic">Times não identificados</div>';
            return;
        }
        try {
            const data = await fetchSofaScore(`event/${jogoSelecionadoId}/h2h`);
            const eventos = data?.previousEvents || data?.events || [];
            if (!eventos.length) {
                listEl.innerHTML = '<div class="text-center text-gray-500 text-xs italic">Sem confrontos diretos registrados</div>';
                return;
            }
            let wHome = 0, draws = 0, wAway = 0;
            eventos.slice(0, 10).forEach(ev => {
                const hId = ev.homeTeam?.id;
                const hGoals = ev.homeScore?.current ?? 0;
                const aGoals = ev.awayScore?.current ?? 0;
                const homeIsCurrentHome = hId === currentHomeTeamId;
                const homePro = homeIsCurrentHome ? hGoals : aGoals;
                const homeContra = homeIsCurrentHome ? aGoals : hGoals;
                if (homePro > homeContra) wHome++;
                else if (homePro < homeContra) wAway++;
                else draws++;
            });
            const nomeCasa = (DOM.nomeCasa || document.getElementById("tvNomeCasa"))?.innerText || 'Casa';
            const nomeFora = (DOM.nomeFora || document.getElementById("tvNomeFora"))?.innerText || 'Fora';
            if (scoreEl) {
                scoreEl.innerHTML = `
                    <div class="flex flex-col items-center">
                        <img src="${BACKEND_URL}?path=team/${currentHomeTeamId}/image" class="w-10 h-10 object-contain mb-1" onerror="this.style.display='none'">
                        <span class="text-3xl font-black text-emerald-400">${wHome}</span>
                        <span class="text-[10px] text-gray-400 uppercase font-bold">${escapeHTML(nomeCasa)}</span>
                    </div>
                    <div class="flex flex-col items-center">
                        <span class="text-xl font-black text-gray-500">E</span>
                        <span class="text-3xl font-black text-gray-300">${draws}</span>
                        <span class="text-[10px] text-gray-400 uppercase font-bold">Empates</span>
                    </div>
                    <div class="flex flex-col items-center">
                        <img src="${BACKEND_URL}?path=team/${currentAwayTeamId}/image" class="w-10 h-10 object-contain mb-1" onerror="this.style.display='none'">
                        <span class="text-3xl font-black text-blue-400">${wAway}</span>
                        <span class="text-[10px] text-gray-400 uppercase font-bold">${escapeHTML(nomeFora)}</span>
                    </div>
                `;
            }
            listEl.innerHTML = eventos.slice(0, 6).map(ev => {
                const hId = ev.homeTeam?.id;
                const homeIsCurrentHome = hId === currentHomeTeamId;
                const cHome = homeIsCurrentHome ? ev.homeTeam : ev.awayTeam;
                const cAway = homeIsCurrentHome ? ev.awayTeam : ev.homeTeam;
                const gHome = homeIsCurrentHome ? (ev.homeScore?.current ?? '-') : (ev.awayScore?.current ?? '-');
                const gAway = homeIsCurrentHome ? (ev.awayScore?.current ?? '-') : (ev.homeScore?.current ?? '-');
                const data = ev.startTimestamp ? new Date(ev.startTimestamp * 1000).toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'2-digit', timeZone: APP_TIMEZONE}) : '--';
                const comp = escapeHTML(ev.tournament?.name || ev.season?.tournament?.name || '');
                const vencedor = gHome > gAway ? 'home' : gHome < gAway ? 'away' : 'draw';
                const corHome = vencedor === 'home' ? 'text-emerald-400 font-black' : vencedor === 'draw' ? 'text-gray-300' : 'text-gray-500';
                const corAway = vencedor === 'away' ? 'text-emerald-400 font-black' : vencedor === 'draw' ? 'text-gray-300' : 'text-gray-500';
                return `
                    <div class="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2 text-xs gap-2">
                        <div class="flex items-center gap-2 w-[35%] min-w-0">
                            <img src="${BACKEND_URL}?path=team/${cHome?.id}/image" class="w-4 h-4 object-contain shrink-0" onerror="this.style.display='none'">
                            <span class="${corHome} truncate">${escapeHTML(cHome?.shortName || cHome?.name || '?')}</span>
                        </div>
                        <div class="text-center font-black text-base shrink-0">
                            <span class="${corHome}">${gHome}</span>
                            <span class="text-gray-600 mx-1">-</span>
                            <span class="${corAway}">${gAway}</span>
                        </div>
                        <div class="flex items-center gap-2 w-[35%] justify-end min-w-0">
                            <span class="${corAway} truncate text-right">${escapeHTML(cAway?.shortName || cAway?.name || '?')}</span>
                            <img src="${BACKEND_URL}?path=team/${cAway?.id}/image" class="w-4 h-4 object-contain shrink-0" onerror="this.style.display='none'">
                        </div>
                        <div class="shrink-0 text-right min-w-[60px]">
                            <div class="text-gray-500 text-[9px]">${data}</div>
                            <div class="text-gray-600 text-[9px] truncate max-w-[80px]">${comp}</div>
                        </div>
                    </div>
                `;
            }).join('');
        } catch(e) {
            if (listEl) listEl.innerHTML = '<div class="text-center text-gray-500 text-xs italic">Confrontos não disponíveis</div>';
        }
    };

    // Carrega Artilheiros do Torneio (Slide 5)
    const carregarArtilheiros = async () => {
        const el = document.getElementById("h2hTopScorers");
        if (!el) return;
        if (!currentTournamentId || !currentSeasonId) { el.innerHTML = '<div class="text-center text-gray-500 text-xs italic">Torneio não identificado</div>'; return; }
        try {
            const data = await fetchSofaScore(`unique-tournament/${currentTournamentId}/season/${currentSeasonId}/top-players/scoring`);
            const players = data?.topPlayers || data?.players || [];
            if (!players.length) { el.innerHTML = '<div class="text-center text-gray-500 text-xs italic">Sem dados de artilheiros</div>'; return; }
            const topMax = players[0]?.statistics?.goals || 1;
            el.innerHTML = players.slice(0, 7).map((p, idx) => {
                const player = p.player || p;
                const stats = p.statistics || {};
                const gols = stats.goals ?? stats.goalsScored ?? 0;
                const team = p.team || {};
                const isInGame = team.id === currentHomeTeamId || team.id === currentAwayTeamId;
                const pct = Math.round((gols / topMax) * 100);
                const medalha = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}º`;
                return `
                    <div class="flex items-center gap-3 rounded-xl border ${isInGame ? 'border-theme-border bg-white/10' : 'border-white/5 bg-black/20'} px-3 py-2">
                        <span class="text-sm shrink-0 w-6 text-center">${medalha}</span>
                        <img src="${BACKEND_URL}?path=team/${team?.id}/image" class="w-6 h-6 object-contain shrink-0" onerror="this.style.display='none'">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between">
                                <span class="text-white font-bold text-sm truncate">${escapeHTML(player.shortName || player.name || '?')}</span>
                                <span class="text-emerald-400 font-black text-lg shrink-0 ml-2">${gols}</span>
                            </div>
                            <div class="w-full bg-gray-700 rounded-full h-1 mt-1">
                                <div class="bg-emerald-500 h-1 rounded-full transition-all" style="width:${pct}%"></div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } catch(e) {
            if (el) el.innerHTML = '<div class="text-center text-gray-500 text-xs italic">Artilheiros não disponíveis</div>';
        }
    };

    // Carrega Estatísticas ao Vivo (Slide 6)
    const carregarEstatisticasH2H = async () => {
        const el = document.getElementById("h2hLiveStats");
        if (!el || !jogoSelecionadoId) return;
        try {
            const data = await fetchSofaScore(`event/${jogoSelecionadoId}/statistics`);
            const groups = data?.statistics?.[0]?.groups || data?.statistics || [];
            if (!groups.length) { el.innerHTML = '<div class="text-center text-gray-500 text-xs italic">Estatísticas não disponíveis (jogo ainda não começou ou sem dados)</div>'; return; }
            const statsMap = {};
            groups.forEach(g => { (g.statisticsItems || []).forEach(item => { statsMap[item.name] = item; }); });
            const statsExibir = [
                { key: 'Ball possession', label: 'Posse de Bola', sufixo: '%', tipo: 'percent' },
                { key: 'Total shots', label: 'Finalizações Totais', tipo: 'bar' },
                { key: 'Shots on target', label: 'No Alvo', tipo: 'bar' },
                { key: 'Corner kicks', label: 'Escanteios', tipo: 'bar' },
                { key: 'Fouls', label: 'Faltas', tipo: 'bar' },
                { key: 'Yellow cards', label: 'Cartões Amarelos', tipo: 'bar' },
                { key: 'Passes', label: 'Passes', tipo: 'bar' },
                { key: 'Tackles', label: 'Desarmes', tipo: 'bar' },
            ];
            const colorCasa = teamColorCasa || '#22c55e';
            const colorFora = teamColorFora || '#3b82f6';
            const linhas = statsExibir.map(cfg => {
                const item = statsMap[cfg.key];
                if (!item) return '';
                const hRaw = parseFloat(String(item.home || '0').replace('%',''));
                const aRaw = parseFloat(String(item.away || '0').replace('%',''));
                const total = cfg.tipo === 'percent' ? 100 : (hRaw + aRaw) || 1;
                const hPct = Math.round((hRaw / total) * 100);
                const aPct = Math.round((aRaw / total) * 100);
                return `
                    <div class="flex flex-col gap-1">
                        <div class="flex justify-between items-center text-xs">
                            <span class="font-black text-white">${hRaw}${cfg.sufixo || ''}</span>
                            <span class="text-gray-400 font-bold uppercase tracking-widest text-[9px]">${cfg.label}</span>
                            <span class="font-black text-white">${aRaw}${cfg.sufixo || ''}</span>
                        </div>
                        <div class="flex h-2 rounded-full overflow-hidden bg-gray-800">
                            <div class="h-full rounded-l-full transition-all" style="width:${hPct}%;background:${colorCasa}"></div>
                            <div class="h-full rounded-r-full transition-all ml-auto" style="width:${aPct}%;background:${colorFora}"></div>
                        </div>
                    </div>
                `;
            }).filter(Boolean).join('');
            el.innerHTML = linhas || '<div class="text-center text-gray-500 text-xs italic">Nenhuma estatística disponível</div>';
        } catch(e) {
            if (el) el.innerHTML = '<div class="text-center text-gray-500 text-xs italic">Estatísticas não disponíveis</div>';
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
        renderStandings(),
        carregarConfrontosDiretos(),
        carregarArtilheiros(),
        carregarEstatisticasH2H(),
        carregarShotmap(),
    ]);
    irParaSlideH2H(0);
    iniciarSlidesH2H();
}
