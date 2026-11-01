// ========== js/manual.js ==========
// Lógica de Controle do Modo Manual e Atualização Visual do Modo Manual

function resetarPlacarManual() {
    manValGolsCasa = 0;
    manValGolsFora = 0;
    document.getElementById("manCasaGolsDisplay").innerText = "0";
    document.getElementById("manForaGolsDisplay").innerText = "0";
    document.getElementById("manMin").value = "0";
    document.getElementById("manSeg").value = "0";
    document.getElementById("manAcrescimo").value = "0";
    document.getElementById("manPenCasa").value = "";
    document.getElementById("manPenFora").value = "";
    document.getElementById("manAgrCasa").value = "";
    document.getElementById("manAgrFora").value = "";
    document.getElementById("manSubIn").value = "";
    document.getElementById("manSubOut").value = "";
    document.getElementById("manPeriodo").value = "PRÉ-JOGO";
    document.getElementById("manTema").value = "";
    if (document.getElementById("manRodada")) document.getElementById("manRodada").value = "";
    if (document.getElementById("uiTransmissao").style.display === "block") atualizarPlacarManualNoOBS();
    if (isVARActive) toggleVAR();
}

function manGols(time, delta) {
    if (time === 'casa') {
        manValGolsCasa += delta;
        if (manValGolsCasa < 0) manValGolsCasa = 0;
        document.getElementById("manCasaGolsDisplay").innerText = manValGolsCasa;
    } else {
        manValGolsFora += delta;
        if (manValGolsFora < 0) manValGolsFora = 0;
        document.getElementById("manForaGolsDisplay").innerText = manValGolsFora;
    }
    if (document.getElementById("uiTransmissao").style.display === "block") atualizarPlacarManualNoOBS();
}

function toggleManualTimer() {
    manualTimerRunning = !manualTimerRunning;
    const btn = document.getElementById("btnManTimer");
    if (manualTimerRunning) {
        btn.innerHTML = '<i class="fa-solid fa-pause mr-1"></i> PAUSAR';
        btn.classList.replace("bg-blue-600", "bg-yellow-600");
        btn.classList.replace("hover:bg-blue-500", "hover:bg-yellow-500");
        manualLoop = setInterval(() => {
            let s = parseInt(document.getElementById("manSeg").value) || 0;
            let m = parseInt(document.getElementById("manMin").value) || 0;
            s++;
            if (s >= 60) { s = 0; m++; }
            document.getElementById("manSeg").value = s;
            document.getElementById("manMin").value = m;
            if (document.getElementById("uiTransmissao").style.display === "block") atualizarPlacarManualNoOBS();
        }, 1000);
    } else {
        btn.innerHTML = '<i class="fa-solid fa-play mr-1"></i> PLAY';
        btn.classList.replace("bg-yellow-600", "bg-blue-600");
        btn.classList.replace("hover:bg-yellow-500", "hover:bg-blue-500");
        clearInterval(manualLoop);
    }
}

function iniciarTransmissaoManual() {
    if (loopCronometro) { clearInterval(loopCronometro); loopCronometro = null; }
    modoAtual = 'manual';
    jogoSelecionadoId = null;
    salvarSessaoAtiva(); // SALVAR SESSÃO MANUAL
    document.getElementById("painelAdmin").style.display = "none";
    document.getElementById("uiTransmissao").style.display = "block";

    // Escala padrão do placar: 95%
    if (typeof definirEscalaPlacar === 'function') definirEscalaPlacar(0.95);

    document.getElementById("tvScorersBar").classList.add("hidden");
    document.getElementById("tvStatsBar").classList.add("hidden");
    document.getElementById("tvRedCardCasa").classList.add("hidden");
    document.getElementById("tvRedCardFora").classList.add("hidden");
    const elYcCasa = document.getElementById("tvYellowCardCasa");
    if(elYcCasa) elYcCasa.classList.add("hidden");
    const elYcFora = document.getElementById("tvYellowCardFora");
    if(elYcFora) elYcFora.classList.add("hidden");
    document.getElementById("tvAgregado")?.classList.add("hidden");
    document.getElementById("tvPenaltisCasa")?.classList.add("hidden");
    document.getElementById("tvPenaltisFora")?.classList.add("hidden");
    document.getElementById("tvAcrescimo")?.classList.add("hidden");
    atualizarPlacarManualNoOBS();

    // Auto-iniciar contador de inscritos se API Key e Channel ID estão preenchidos
    const apiKey = document.getElementById("manApiKey")?.value?.trim();
    const channelId = document.getElementById("manChannelId")?.value?.trim();
    if (apiKey && channelId && !inscritosAutoInterval && apiKey.startsWith('AIza')) {
        iniciarContadorInscritosAuto();
    }
}

function atualizarPlacarManualNoOBS() {
    const tema = document.getElementById("manTema").value;
    const placar = document.getElementById("placarCard");
    const h2hCard = document.getElementById("h2hCard");
    const wrapper = document.getElementById("placarWrapper");

    if (placar) {
        placar.className = "placar-compacto rounded-xl flex flex-col overflow-hidden relative z-10 transition-transform duration-500";
        if (h2hCard) h2hCard.className = "h2h-panel theme-bg-dark border theme-border p-8 rounded-[2rem] shadow-2xl flex flex-col items-center w-[1100px] relative overflow-hidden transition-all duration-300";
        if (wrapper) wrapper.classList.remove("layout-nordeste2025");
        
        if (tema) {
            placar.classList.add(tema);
            
            if (tema === 'theme-nordeste2025') {
                placar.classList.add("layout-nordeste2025");
                if (wrapper) wrapper.classList.add("layout-nordeste2025");
                if (h2hCard) h2hCard.classList.add("layout-nordeste2025");
                if (typeof definirEscalaPlacar === 'function') definirEscalaPlacar(0.95);
            } else {
                placar.classList.remove("rounded-xl");
                placar.classList.add("layout-copa");
                if (h2hCard) {
                    h2hCard.classList.remove("rounded-[2rem]");
                    h2hCard.classList.add("layout-copa");
                    h2hCard.classList.add(tema);
                }
            }
        }
    }

    const elLogoComp = document.getElementById("tvLogoComp");
    if (elLogoComp) {
        if (tema === 'theme-fifa2026') {
            elLogoComp.src = "https://digitalhub.fifa.com/transform/157d23bf-7e13-4d7b-949e-5d27d340987e/WC26_Logo?&io=transform:fill,height:210&quality=75";
            elLogoComp.classList.remove("hidden");
        } else if (tema === 'theme-nordeste2025') {
            elLogoComp.src = sofaImg(`unique-tournament/1596/image`);
            elLogoComp.classList.remove("hidden");
        } else {
            elLogoComp.classList.add("hidden");
        }
    }

    let camp = document.getElementById("manCamp").value.toUpperCase() || "AMISTOSO";
    let rodada = document.getElementById("manRodada")?.value;
    if (rodada && rodada.trim() !== '') {
        if (!isNaN(rodada)) camp += ` - RODADA ${String(rodada).padStart(2, '0')}`;
        else camp += ` - ${rodada.toUpperCase()}`;
    }
    document.getElementById("tvCampeonato").innerHTML = camp;
    document.getElementById("tvNomeCasa").innerHTML = document.getElementById("manCasaNome").value.toUpperCase() || "CASA";
    document.getElementById("tvNomeFora").innerHTML = document.getElementById("manForaNome").value.toUpperCase() || "FORA";
    let logoCasa = document.getElementById("manCasaLogo").value;
    let logoFora = document.getElementById("manForaLogo").value;
    const placeholderSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect fill='%23222' width='150' height='150' rx='75'/%3E%3Cpath fill='none' stroke='%23444' stroke-width='2' d='M75 15 a60 60 0 1 0 0 120 a60 60 0 1 0 0 -120 M75 35 l10 20 l20 0 l-15 15 l10 25 l-25 -15 l-25 15 l10 -25 l-15 -15 l20 0 z'/%3E%3C/svg%3E";
    document.getElementById("imgLogoCasa").src = logoCasa || placeholderSvg;
    document.getElementById("imgLogoFora").src = logoFora || placeholderSvg;

    const novoGolsC = manValGolsCasa;
    const novoGolsF = manValGolsFora;
    if (novoGolsC > parseInt(document.getElementById("tvGolsCasa").innerHTML || -1)) atualizarPlacarComEfeito("tvGolsCasa", null, null, false);
    if (novoGolsF > parseInt(document.getElementById("tvGolsFora").innerHTML || -1)) atualizarPlacarComEfeito("tvGolsFora", null, null, false);
    document.getElementById("tvGolsCasa").innerHTML = novoGolsC;
    document.getElementById("tvGolsFora").innerHTML = novoGolsF;

    const periodo = document.getElementById("manPeriodo").value;
    if (periodo === "INTERVALO" || periodo === "PRÉ-JOGO" || periodo === "FIM DE JOGO") {
        document.getElementById("tvPeriodo").innerHTML = periodo;
        document.getElementById("tvPeriodo").classList.remove("theme-text", "text-sky-400");
        document.getElementById("tvPeriodo").classList.add("text-gray-400");
        document.getElementById("tvBadgeAoVivo").classList.replace("text-red-500", "text-gray-500");
        document.getElementById("tvBolinhaAoVivo").classList.replace("bg-red-500", "bg-gray-500");
        document.getElementById("tvBadgeAoVivo").classList.remove("animate-pulse");
        document.getElementById("tvTextoBadge").innerHTML = periodo.toUpperCase();
    } else {
        let m = String(document.getElementById("manMin").value || 0).padStart(2, '0');
        let s = String(document.getElementById("manSeg").value || 0).padStart(2, '0');
        document.getElementById("tvPeriodo").innerHTML = `${m}:${s}`;
        document.getElementById("tvPeriodo").classList.add("theme-text");
        document.getElementById("tvPeriodo").classList.remove("text-gray-400", "text-sky-400");
        document.getElementById("tvBadgeAoVivo").classList.replace("text-gray-500", "text-red-500");
        document.getElementById("tvBolinhaAoVivo").classList.replace("bg-gray-500", "bg-red-500");
        document.getElementById("tvBadgeAoVivo").classList.add("animate-pulse");
        document.getElementById("tvTextoBadge").innerHTML = "AO VIVO";
    }

    const acrescimo = parseInt(document.getElementById("manAcrescimo")?.value) || 0;
    const elAcrescimo = document.getElementById("tvAcrescimo");
    if (elAcrescimo) {
        if (acrescimo > 0) {
            elAcrescimo.innerHTML = `+${acrescimo}`;
            elAcrescimo.classList.remove("hidden");
        } else {
            elAcrescimo.classList.add("hidden");
        }
    }

    const penC = document.getElementById("manPenCasa")?.value;
    const penF = document.getElementById("manPenFora")?.value;
    const elPenC = document.getElementById("tvPenaltisCasa");
    const elPenF = document.getElementById("tvPenaltisFora");
    if (elPenC && elPenF) {
        if (penC && penF) {
            elPenC.innerHTML = `(${penC})`; elPenF.innerHTML = `(${penF})`;
            elPenC.classList.remove("hidden"); elPenF.classList.remove("hidden");
        } else {
            elPenC.classList.add("hidden"); elPenF.classList.add("hidden");
        }
    }

    const agrC = document.getElementById("manAgrCasa")?.value;
    const agrF = document.getElementById("manAgrFora")?.value;
    const elAgr = document.getElementById("tvAgregado");
    if (elAgr) {
        if (agrC && agrF) { elAgr.innerHTML = `AGR. ${agrC} - ${agrF}`; elAgr.classList.remove("hidden"); } 
        else { elAgr.classList.add("hidden"); }
    }
    
    // Salvar estado atual dos inputs se estiver no modo manual
    if (modoAtual === 'manual') salvarSessaoAtiva();
}

function dispararSubstituicaoManual() {
    const inName = document.getElementById("manSubIn").value || "Jogador Entra";
    const outName = document.getElementById("manSubOut").value || "Jogador Sai";
    if (typeof mostrarNotificacaoSubstituicao === 'function') {
        mostrarNotificacaoSubstituicao(inName, outName);
    }
}

// ==========================================
// LÓGICA DE CONTADOR DE INSCRITOS (TEMPO REAL)
// Painel independente e móvel com lista de nomes
// ==========================================

let inscritosAutoInterval = null;

function formatarNumeroInscritos(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(2).replace(/\.00$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return new Intl.NumberFormat('pt-BR').format(num);
}

/**
 * Busca silenciosa dos inscritos no carregamento da página.
 * Preenche o contador sem ativar o interval, para que o dado esteja pronto
 * quando o usuário mostrar o painel.
 */
async function preCarregarInscritos(apiKey, channelId) {
    try {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`);
        const data = await res.json();
        if (data.items && data.items.length > 0) {
            const count = parseInt(data.items[0].statistics.subscriberCount);
            if (!isNaN(count)) {
                const elCount = DOM.subscribersCount || document.getElementById("tvSubscribersCount");
                if (elCount) elCount.innerText = formatarNumeroInscritos(count);
                const elInput = document.getElementById("manInscritos");
                if (elInput) elInput.value = formatarNumeroInscritos(count);
            }
        }
    } catch (e) {
        console.warn("Pre-load inscritos falhou:", e);
    }
}

function atualizarInscritosManual() {
    const val = document.getElementById("manInscritos").value;
    const elCount = DOM.subscribersCount || document.getElementById("tvSubscribersCount");
    if (elCount) elCount.innerText = val || "--";
}

function toggleInscritosVisibilidade() {
    const panel = DOM.subscribersPanel || document.getElementById("tvSubscribersPanel");
    const btn = DOM.btnToggleInscritos || document.getElementById("btnToggleInscritos");
    
    if (!panel) return;
    
    if (panel.classList.contains("oculto-inscritos")) {
        panel.classList.remove("oculto-inscritos");
        if (btn) {
            btn.innerHTML = '<i class="fa-brands fa-youtube"></i> OCULTAR INSCRITOS';
            btn.classList.add("opacity-100", "border-red-500", "bg-red-600");
            btn.classList.remove("opacity-20", "bg-gray-900/80");
        }
        // Auto-iniciar busca de inscritos se ainda não está rodando
        if (!inscritosAutoInterval) {
            const apiKey = document.getElementById("manApiKey")?.value?.trim();
            const channelId = document.getElementById("manChannelId")?.value?.trim();
            if (apiKey && channelId && apiKey.startsWith('AIza')) {
                iniciarContadorInscritosAuto();
            }
        }
    } else {
        panel.classList.add("oculto-inscritos");
        if (btn) {
            btn.innerHTML = '<i class="fa-brands fa-youtube"></i> INSCRITOS';
            btn.classList.remove("opacity-100", "border-red-500", "bg-red-600");
            btn.classList.add("opacity-20", "bg-gray-900/80");
        }
    }
}

function iniciarContadorInscritosAuto() {
    const apiKey = document.getElementById("manApiKey").value.trim();
    const channelId = document.getElementById("manChannelId").value.trim();
    const btn = document.getElementById("btnAutoInscritos");

    if (inscritosAutoInterval) {
        // Desligar
        clearInterval(inscritosAutoInterval);
        inscritosAutoInterval = null;
        btn.innerHTML = '<i class="fa-solid fa-rotate"></i> AUTO';
        btn.classList.replace("bg-emerald-600", "bg-red-600");
        return;
    }

    if (!channelId) {
        alert("Por favor, preencha o ID do Canal do YouTube (Ex: UC...).");
        return;
    }

    if (!apiKey || apiKey.includes(".apps.googleusercontent.com")) {
        alert("Parece que você colocou um ID de Cliente OAuth em vez de uma Chave de API (API Key). A Chave de API do YouTube tem cerca de 39 caracteres e começa com 'AIza'.");
        return;
    }

    // Ligar
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> AUTO ON';
    btn.classList.replace("bg-red-600", "bg-emerald-600");
    
    // Mostra o painel se estiver escondido
    const panel = DOM.subscribersPanel || document.getElementById("tvSubscribersPanel");
    if (panel && panel.classList.contains("oculto-inscritos")) {
        toggleInscritosVisibilidade();
    }

    const elCount = DOM.subscribersCount || document.getElementById("tvSubscribersCount");

    const fetchSubscribers = async () => {
        try {
            if (elCount) elCount.innerText = "...";
            const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`);
            const data = await res.json();
            
            if (data.items && data.items.length > 0) {
                const count = parseInt(data.items[0].statistics.subscriberCount);
                if (!isNaN(count)) {
                    if (elCount) {
                        elCount.innerText = formatarNumeroInscritos(count);
                        elCount.style.fontSize = "";
                    }
                    document.getElementById("manInscritos").value = formatarNumeroInscritos(count);
                }
            } else if (data.error) {
                console.error("Erro na API do YouTube:", data.error.message);
                if (elCount) {
                    elCount.innerText = "ERRO 403";
                    elCount.style.fontSize = "10px";
                }
                alert("Erro da API: " + data.error.message);
                clearInterval(inscritosAutoInterval);
                inscritosAutoInterval = null;
                btn.innerHTML = '<i class="fa-solid fa-rotate"></i> AUTO';
                btn.classList.replace("bg-emerald-600", "bg-red-600");
            } else {
                if (elCount) elCount.innerText = "S/DADOS";
            }
        } catch (err) {
            console.error("Erro ao buscar inscritos:", err);
            if (elCount) elCount.innerText = "ERRO NET";
        }
    };

    fetchSubscribers(); // primeira chamada
    inscritosAutoInterval = setInterval(fetchSubscribers, 30000); // Atualiza a cada 30 segundos
}

// ==========================================
// LÓGICA DE META DE LIKES
// Meta sempre fixa em 10 likes
// ==========================================

let likesAtual = 0;
const LIKES_META = 10;

function atualizarLikesUI() {
    const pct = Math.min((likesAtual / LIKES_META) * 100, 100);
    const metaAtingida = likesAtual >= LIKES_META;

    // --- Painel de transmissão ---
    const elCount = DOM.likesCount || document.getElementById('tvLikesCount');
    const elBar   = DOM.likesBar   || document.getElementById('tvLikesBar');
    const elCeleb = DOM.likesCelebration || document.getElementById('tvLikesCelebration');

    if (elCount) elCount.innerText = likesAtual;
    if (elBar) {
        elBar.style.width = pct + '%';
        // Verde quando atingiu a meta, rosa enquanto progride
        elBar.style.background = metaAtingida
            ? 'linear-gradient(90deg, #22c55e, #4ade80)'
            : 'linear-gradient(90deg, #f43f5e, #fb7185)';
    }
    if (elCeleb) {
        if (metaAtingida) elCeleb.classList.remove('hidden');
        else              elCeleb.classList.add('hidden');
    }

    // --- Painel admin (modo manual) ---
    const elAdminDisplay = document.getElementById('manLikesDisplay');
    const elAdminBar     = document.getElementById('manLikesBarAdmin');
    const elAdminPct     = document.getElementById('manLikesPct');

    if (elAdminDisplay) elAdminDisplay.innerText = likesAtual;
    if (elAdminBar) {
        elAdminBar.style.width = pct + '%';
        elAdminBar.style.background = metaAtingida
            ? 'linear-gradient(90deg, #22c55e, #4ade80)'
            : 'linear-gradient(90deg, #f43f5e, #fb7185)';
    }
    if (elAdminPct) elAdminPct.innerText = Math.round(pct) + '%';
}

function alterarLikes(delta) {
    likesAtual += delta;
    if (likesAtual < 0) likesAtual = 0;
    atualizarLikesUI();
}

function resetarLikes() {
    likesAtual = 0;
    atualizarLikesUI();
}

// ==========================================
// AUTO LIKES — busca likes de todas as lives
// ativas do canal via YouTube Data API v3
// Suporta seleção de live individual quando
// há múltiplas transmissões simultâneas
// ==========================================

let likesAutoInterval   = null;
let liveSelecionadaId   = null;   // null = somar tudo; string = ID da live travada
let liveSelecionadaTitulo = null;

// ----- Busca e lista todas as lives ativas -----
async function buscarListaDeLives() {
    const apiKey    = document.getElementById('manApiKey')?.value?.trim();
    const channelId = document.getElementById('manChannelId')?.value?.trim();
    const statusEl  = document.getElementById('likesLivesStatus');
    const listEl    = document.getElementById('likesLivesList');

    if (!apiKey || !channelId) return;
    if (statusEl) statusEl.innerText = '— buscando lives…';
    if (listEl)   listEl.innerHTML   = '<p class="text-[10px] text-slate-500 italic py-1">Carregando…</p>';

    try {
        const searchUrl  = `https://www.googleapis.com/youtube/v3/search?part=id,snippet&channelId=${channelId}&eventType=live&type=video&maxResults=10&key=${apiKey}`;
        const searchData = await fetch(searchUrl).then(r => r.json());

        if (searchData.error) {
            if (statusEl) statusEl.innerText = `— erro: ${searchData.error.message}`;
            if (listEl)   listEl.innerHTML = `<p class="text-[10px] text-red-400 italic py-1">${searchData.error.message}</p>`;
            return;
        }

        const items = searchData.items || [];
        if (items.length === 0) {
            if (statusEl) statusEl.innerText = '— nenhuma live ao vivo';
            if (listEl)   listEl.innerHTML   = '<p class="text-[10px] text-slate-600 italic py-1">Nenhuma live ativa no canal agora.</p>';
            return;
        }

        // Pegar likes de todas de uma vez
        const videoIds  = items.map(i => i.id.videoId).join(',');
        const statsData = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${apiKey}`).then(r => r.json());
        const videos    = statsData.items || [];

        if (statusEl) statusEl.innerText = `— ${videos.length} live(s) ao vivo`;

        // Renderizar cards com botão "USAR ESTA"
        let html = '';
        videos.forEach(v => {
            const likes    = parseInt(v.statistics?.likeCount || 0);
            const title    = (v.snippet?.title || v.id);
            const thumb    = v.snippet?.thumbnails?.default?.url || '';
            const isActive = liveSelecionadaId === v.id;
            const titleEsc = title.replace(/'/g, "\\'").replace(/"/g, '&quot;');

            html += `
            <div id="liveCard_${v.id}" class="flex items-center gap-2 rounded-lg px-3 py-2 border transition-all duration-300 ${isActive ? 'bg-rose-950/60 border-rose-500/60' : 'bg-slate-900/60 border-slate-700/50'}">
                ${thumb ? `<img src="${thumb}" class="w-10 h-7 object-cover rounded flex-shrink-0 opacity-80">` : ''}
                <div class="flex-1 min-w-0">
                    <p class="text-[10px] font-bold truncate leading-tight ${isActive ? 'text-rose-300' : 'text-white'}" title="${title}">${title}</p>
                    <p class="text-[9px] text-slate-500">♥ ${likes.toLocaleString('pt-BR')} likes</p>
                </div>
                <button onclick="selecionarLive('${v.id}', '${titleEsc}')"
                    class="flex-shrink-0 text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg border transition-all ${isActive
                        ? 'bg-rose-600 border-rose-500 text-white cursor-default'
                        : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-rose-600 hover:border-rose-500 hover:text-white'}">
                    ${isActive ? '<i class="fa-solid fa-check mr-1"></i>Ativa' : 'Usar esta'}
                </button>
            </div>`;
        });

        if (listEl) listEl.innerHTML = html;

        // Se nenhuma live selecionada, somar tudo automaticamente
        if (!liveSelecionadaId) {
            const total = videos.reduce((acc, v) => acc + parseInt(v.statistics?.likeCount || 0), 0);
            likesAtual = total;
            atualizarLikesUI();
            if (statusEl) statusEl.innerText = `— ${videos.length} live(s) • somando tudo: ${total.toLocaleString('pt-BR')} ♥`;
        }

    } catch (err) {
        console.error('Erro ao buscar lives:', err);
        if (statusEl) statusEl.innerText = '— erro de rede';
    }
}

// ----- Busca likes só da live selecionada -----
async function buscarLikesDaLiveSelecionada() {
    if (!liveSelecionadaId) return buscarListaDeLives();

    const apiKey   = document.getElementById('manApiKey')?.value?.trim();
    const statusEl = document.getElementById('likesLivesStatus');

    try {
        const data   = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${liveSelecionadaId}&key=${apiKey}`).then(r => r.json());
        const video  = data.items?.[0];
        if (!video) return;

        const likes = parseInt(video.statistics?.likeCount || 0);
        likesAtual  = likes;
        atualizarLikesUI();

        if (statusEl) {
            const titulo = liveSelecionadaTitulo || liveSelecionadaId;
            statusEl.innerText = `— "${titulo.substring(0, 35)}${titulo.length > 35 ? '…' : ''}" • ${likes.toLocaleString('pt-BR')} ♥`;
        }
    } catch (err) {
        console.error('Erro ao buscar likes da live selecionada:', err);
    }
}

// ----- Selecionar uma live específica -----
function selecionarLive(videoId, titulo) {
    liveSelecionadaId     = videoId;
    liveSelecionadaTitulo = titulo;

    // Atualizar visual dos cards
    const listEl = document.getElementById('likesLivesList');
    if (listEl) {
        listEl.querySelectorAll('[id^="liveCard_"]').forEach(card => {
            const isThis = card.id === `liveCard_${videoId}`;
            card.className = `flex items-center gap-2 rounded-lg px-3 py-2 border transition-all duration-300 ${isThis ? 'bg-rose-950/60 border-rose-500/60' : 'bg-slate-900/60 border-slate-700/50'}`;
            const btn = card.querySelector('button');
            if (btn) {
                if (isThis) {
                    btn.innerHTML = '<i class="fa-solid fa-check mr-1"></i>Ativa';
                    btn.className = 'flex-shrink-0 text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg border transition-all bg-rose-600 border-rose-500 text-white cursor-default';
                } else {
                    btn.innerHTML = 'Usar esta';
                    btn.className = 'flex-shrink-0 text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg border transition-all bg-slate-800 border-slate-600 text-slate-400 hover:bg-rose-600 hover:border-rose-500 hover:text-white';
                }
                const p = card.querySelector('p:first-child');
                if (p) p.className = `text-[10px] font-bold truncate leading-tight ${isThis ? 'text-rose-300' : 'text-white'}`;
            }
        });
    }

    // Adiciona botão "Trocar live" no status se ainda não existir
    const statusEl = document.getElementById('likesLivesStatus');
    if (statusEl) statusEl.innerText = `— travado nesta live ♥`;

    const headerEl = document.getElementById('likesLivesHeader');
    if (headerEl && !document.getElementById('btnTrocarLive')) {
        const btnTrocar = document.createElement('button');
        btnTrocar.id = 'btnTrocarLive';
        btnTrocar.innerHTML = '<i class="fa-solid fa-arrow-left mr-1"></i>Trocar live';
        btnTrocar.className = 'text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg bg-slate-700 border border-slate-600 text-slate-400 hover:text-white hover:bg-slate-600 transition-all';
        btnTrocar.onclick = () => { liveSelecionadaId = null; liveSelecionadaTitulo = null; btnTrocar.remove(); buscarListaDeLives(); };
        headerEl.appendChild(btnTrocar);
    }

    // Busca imediata para atualizar o contador
    buscarLikesDaLiveSelecionada();

    // Reiniciar o interval para buscar só esta live
    if (likesAutoInterval) {
        clearInterval(likesAutoInterval);
        likesAutoInterval = setInterval(buscarLikesDaLiveSelecionada, 60000);
    }
}

// ----- Toggle principal (liga/desliga) -----
function toggleLikesAuto() {
    const btn   = document.getElementById('btnAutoLikes');
    const panel = document.getElementById('likesLivesPanel');

    if (likesAutoInterval) {
        clearInterval(likesAutoInterval);
        likesAutoInterval     = null;
        liveSelecionadaId     = null;
        liveSelecionadaTitulo = null;
        document.getElementById('btnTrocarLive')?.remove();
        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-heart"></i> AUTO ♥ LIKES';
            btn.classList.remove('bg-rose-600', 'border-rose-500', 'text-white', 'opacity-100');
            btn.classList.add('bg-slate-700', 'border-slate-600', 'text-slate-300');
        }
        if (panel) panel.classList.add('hidden');
        return;
    }

    const apiKey    = document.getElementById('manApiKey')?.value?.trim();
    const channelId = document.getElementById('manChannelId')?.value?.trim();

    if (!apiKey || !channelId) {
        alert('Preencha o ID do Canal e a Chave API do YouTube primeiro.');
        return;
    }

    if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> AUTO ON';
        btn.classList.remove('bg-slate-700', 'border-slate-600', 'text-slate-300');
        btn.classList.add('bg-rose-600', 'border-rose-500', 'text-white', 'opacity-100');
    }
    if (panel) panel.classList.remove('hidden');

    buscarListaDeLives();   // primeira chamada: lista todas as lives
    likesAutoInterval = setInterval(() => {
        if (liveSelecionadaId) buscarLikesDaLiveSelecionada();
        else                   buscarListaDeLives();
    }, 60000);
}

// Alias para compatibilidade com código anterior
function buscarLikesDasLives() { return buscarListaDeLives(); }
