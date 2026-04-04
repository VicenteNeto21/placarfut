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
            elLogoComp.src = `${BACKEND_URL}?path=unique-tournament/1596/image`;
            elLogoComp.classList.remove("hidden");
        } else {
            elLogoComp.classList.add("hidden");
        }
    }

    document.getElementById("tvCampeonato").innerHTML = document.getElementById("manCamp").value.toUpperCase() || "AMISTOSO";
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
// ==========================================

let inscritosAutoInterval = null;

function formatarNumeroInscritos(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(2).replace(/\.00$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return new Intl.NumberFormat('pt-BR').format(num);
}

function atualizarInscritosManual() {
    const val = document.getElementById("manInscritos").value;
    document.getElementById("tvSubscribersCount").innerText = val || "--";
}

function atualizarUltimoInscrito() {
    const val = document.getElementById("manUltimoInscrito").value;
    document.getElementById("tvUltimoInscritoNome").innerText = val || "Aguardando...";
}

function toggleInscritosVisibilidade() {
    const badge = document.getElementById("tvSubscribersBadge");
    const btn = document.getElementById("btnToggleInscritos");
    
    if (badge.classList.contains("hidden")) {
        badge.classList.remove("hidden");
        if (btn) {
            btn.innerHTML = '<i class="fa-brands fa-youtube"></i> OCULTAR INSCRITOS';
            btn.classList.add("opacity-100", "border-red-500", "bg-red-600");
            btn.classList.remove("opacity-20", "bg-gray-900/80");
        }
    } else {
        badge.classList.add("hidden");
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
    
    // Mostra o badge se estiver escondido
    const badge = document.getElementById("tvSubscribersBadge");
    if (badge.classList.contains("hidden")) {
        toggleInscritosVisibilidade();
    }

    const fetchSubscribers = async () => {
        try {
            document.getElementById("tvSubscribersCount").innerText = "...";
            const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`);
            const data = await res.json();
            
            if (data.items && data.items.length > 0) {
                const count = parseInt(data.items[0].statistics.subscriberCount);
                if (!isNaN(count)) {
                    document.getElementById("tvSubscribersCount").innerText = formatarNumeroInscritos(count);
                    document.getElementById("manInscritos").value = formatarNumeroInscritos(count);
                    document.getElementById("tvSubscribersCount").style.fontSize = "1rem";
                }
            } else if (data.error) {
                console.error("Erro na API do YouTube:", data.error.message);
                document.getElementById("tvSubscribersCount").innerText = "ERRO 403";
                document.getElementById("tvSubscribersCount").style.fontSize = "10px";
                alert("Erro da API: " + data.error.message);
                clearInterval(inscritosAutoInterval);
                inscritosAutoInterval = null;
                btn.innerHTML = '<i class="fa-solid fa-rotate"></i> AUTO';
                btn.classList.replace("bg-emerald-600", "bg-red-600");
            } else {
                document.getElementById("tvSubscribersCount").innerText = "S/DADOS";
            }
        } catch (err) {
            console.error("Erro ao buscar inscritos:", err);
            document.getElementById("tvSubscribersCount").innerText = "ERRO NET";
        }
    };

    fetchSubscribers(); // primeira chamada
    inscritosAutoInterval = setInterval(fetchSubscribers, 30000); // Atualiza a cada 30 segundos para não estourar o limite da API
}
