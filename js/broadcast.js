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
    
    atualizarDadosSofaScore();
    iniciarCronometroSofaScore();

    if (loopDados) clearInterval(loopDados);
    loopDados = setInterval(atualizarDadosSofaScore, 10000);
}

let mostrarEstatisticas = false;
let mostrarTabela = false;
let currentTournamentId = null;
let currentSeasonId = null;

function voltarAoPainel() {
    // Limpar todos os intervalos
    if (loopDados) { clearInterval(loopDados); loopDados = null; }
    if (loopCronometro) { clearInterval(loopCronometro); loopCronometro = null; }
    if (manualLoop) { clearInterval(manualLoop); manualLoop = null; }

    // Resetar estado global
    jogoSelecionadoId = null;
    cronometroRodando = false;
    manualTimerRunning = false;
    minAtual = 0;
    segAtual = 0;
    ultimoPlacar = { casa: -1, fora: -1 };
    
    currentTournamentId = null;
    currentSeasonId = null;
    mostrarGols = true;

    // Resetar placar visual
    document.getElementById("tvGolsCasa").innerHTML = "0";
    document.getElementById("tvGolsFora").innerHTML = "0";
    document.getElementById("tvPeriodo").innerHTML = "00:00";
    document.getElementById("tvCampeonato").innerHTML = "SOFASCORE LIVE";
    document.getElementById("tvNomeCasa").innerHTML = "CASA";
    document.getElementById("tvNomeFora").innerHTML = "FORA";
    document.getElementById("tvTextoBadge").innerHTML = "AGUARDANDO";

    // Trocar visibilidade
    document.getElementById("uiTransmissao").style.display = "none";
    document.getElementById("painelAdmin").style.display = "";
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

        const golsC = jogo.homeScore?.current || 0;
        const golsF = jogo.awayScore?.current || 0;

        document.getElementById("tvCampeonato").innerHTML = (jogo.tournament?.name || "SOFASCORE LIVE").toUpperCase();
        // Usar sigla de exatamente 3 letras como o usuário solicitou (ex: PAL x SAN)
        const nomeCasaFull = (jogo.homeTeam.shortName || jogo.homeTeam.name || '?').toUpperCase();
        const nomeForaFull = (jogo.awayTeam.shortName || jogo.awayTeam.name || '?').toUpperCase();
        document.getElementById("tvNomeCasa").innerHTML = nomeCasaFull.substring(0, 3);
        document.getElementById("tvNomeFora").innerHTML = nomeForaFull.substring(0, 3);
        document.getElementById("imgLogoCasa").src = `${BACKEND_URL}?path=team/${jogo.homeTeam.id}/image&_t=${Date.now()}`;
        document.getElementById("imgLogoFora").src = `${BACKEND_URL}?path=team/${jogo.awayTeam.id}/image&_t=${Date.now()}`;

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
            document.getElementById("tvPeriodo").classList.add("text-yellow-400");
            document.getElementById("tvPeriodo").classList.remove("text-gray-400");
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
            document.getElementById("tvPeriodo").classList.remove("text-yellow-400");
            document.getElementById("tvPeriodo").classList.add("text-gray-400");
            cronometroRodando = false;
        }

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
            if ([7, 12].includes(statusCode) || jogo.status?.description?.toLowerCase().includes('2nd')) calcMin += 45;
            if ([100, 101].includes(statusCode)) calcMin += 90; // Prorrogação 1ª parte
            if ([105, 106].includes(statusCode)) calcMin += 105; // Prorrogação 2ª parte
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
        
        atualizarRodapeSofaScore();
        buscarArtilheiros(jogoSelecionadoId, golsC, golsF);
        
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

    if (golsC === 0 && golsF === 0) {
        scorersBar.classList.add('hidden');
        return;
    }

    try {
        const data = await fetchSofaScore(`event/${eventId}/incidents`);
        if (!data.incidents) { scorersBar.classList.add('hidden'); return; }

        const goleiros = { casa: [], fora: [] };
        data.incidents.forEach(inc => {
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

        const textCasa = goleiros.casa.join(' • ');
        const textFora = goleiros.fora.join(' • ');
        scorersCasa.innerHTML = textCasa ? `<i class="fa-solid fa-futbol text-[9px] mr-1"></i> ${textCasa}` : '';
        scorersFora.innerHTML = textFora ? `${textFora} <i class="fa-solid fa-futbol text-[9px] ml-1"></i>` : '';

        if ((textCasa || textFora) && mostrarGols) {
            scorersBar.classList.remove('hidden');
        } else {
            scorersBar.classList.add('hidden');
        }
    } catch (e) {
        scorersBar.classList.add('hidden');
    }
}

async function atualizarRodapeSofaScore() {
    try {
        const { iso: dataHoje } = getDataComOffset(0);
        const data = await fetchSofaScore(`sport/football/scheduled-events/${dataHoje}`);
        
        let tickerHTML = "";
        const eventos = data.events || [];

        // Filtrar apenas os torneios solicitados
        const eventosFiltrados = eventos.filter(j => {
            const tornId = j.tournament?.uniqueTournament?.id || j.tournament?.id;
            return GIRO_TORNEIOS_IDS.includes(tornId);
        });

        if (eventosFiltrados.length > 0) {
            // Ordena por status (ao vivo primeiro) e depois por horário
            eventosFiltrados.sort((a, b) => {
                const aLive = isJogoAoVivo(a);
                const bLive = isJogoAoVivo(b);
                if (aLive && !bLive) return -1;
                if (!aLive && bLive) return 1;
                return (a.startTimestamp || 0) - (b.startTimestamp || 0);
            });

            eventosFiltrados.forEach(j => {
                const isLive = isJogoAoVivo(j);
                const status = j.status?.code;
                const type = j.status?.type;

                let tempoStr = "";
                if (isLive) {
                    tempoStr = j.statusTime?.current ? j.statusTime.current + "'" : "AO VIVO";
                } else {
                    if (status === 100 || type === 'finished') tempoStr = "FIM";
                    else if (status === 31) tempoStr = "INT";
                    else if (status === 0 || type === 'notstarted') {
                        const dt = new Date(j.startTimestamp * 1000);
                        tempoStr = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    }
                    else tempoStr = "---";
                }

                tickerHTML += `
                    <div class="ticker-item">
                        <span class="liga-badge">${j.tournament.name}</span>
                        <span class="ticker-status ${isLive ? 'text-yellow-400' : 'text-gray-400'}">[${tempoStr}]</span>
                        <img src="${BACKEND_URL}?path=team/${j.homeTeam.id}/image" class="h-5 mx-2 object-contain rounded">
                        ${j.homeTeam.shortName || j.homeTeam.name}
                        <span class="text-white font-black mx-1">${j.homeScore?.current ?? 0}</span>
                        <span class="text-gray-400">vs</span>
                        <span class="text-white font-black mx-1">${j.awayScore?.current ?? 0}</span>
                        ${j.awayTeam.shortName || j.awayTeam.name}
                        <img src="${BACKEND_URL}?path=team/${j.awayTeam.id}/image" class="h-5 mx-2 object-contain rounded">
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
        }, 4000);
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
            if (document.getElementById('tvScorersCasa').innerHTML || document.getElementById('tvScorersFora').innerHTML) {
                bar.classList.remove("hidden");
            }
            if (btnIcon) btnIcon.classList.replace("fa-eye-slash", "fa-futbol");
        }
    }
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
