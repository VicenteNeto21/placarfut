// ========== js/manual.js ==========
// Lógica de Controle do Modo Manual e Atualização Visual do Modo Manual

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
    if (loopDados) { clearInterval(loopDados); loopDados = null; }
    if (loopCronometro) { clearInterval(loopCronometro); loopCronometro = null; }
    modoAtual = 'manual';
    jogoSelecionadoId = null;
    document.getElementById("painelAdmin").style.display = "none";
    document.getElementById("uiTransmissao").style.display = "block";
    document.getElementById("tvScorersBar").classList.add("hidden");
    document.getElementById("tvStatsBar").classList.add("hidden");
    document.getElementById("tvRedCardCasa").classList.add("hidden");
    document.getElementById("tvRedCardFora").classList.add("hidden");
    atualizarPlacarManualNoOBS();
}

function atualizarPlacarManualNoOBS() {
    document.getElementById("tvCampeonato").innerHTML = document.getElementById("manCamp").value.toUpperCase() || "AMISTOSO";
    document.getElementById("tvNomeCasa").innerHTML = document.getElementById("manCasaNome").value.toUpperCase().substring(0, 4) || "CASA";
    document.getElementById("tvNomeFora").innerHTML = document.getElementById("manForaNome").value.toUpperCase().substring(0, 4) || "FORA";
    let logoCasa = document.getElementById("manCasaLogo").value;
    let logoFora = document.getElementById("manForaLogo").value;
    const placeholderSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect fill='%23222' width='150' height='150' rx='75'/%3E%3Cpath fill='none' stroke='%23444' stroke-width='2' d='M75 15 a60 60 0 1 0 0 120 a60 60 0 1 0 0 -120 M75 35 l10 20 l20 0 l-15 15 l10 25 l-25 -15 l-25 15 l10 -25 l-15 -15 l20 0 z'/%3E%3C/svg%3E";
    document.getElementById("imgLogoCasa").src = logoCasa || placeholderSvg;
    document.getElementById("imgLogoFora").src = logoFora || placeholderSvg;

    const novoGolsC = manValGolsCasa;
    const novoGolsF = manValGolsFora;
    if (novoGolsC > parseInt(document.getElementById("tvGolsCasa").innerHTML || -1)) piscarGol("tvGolsCasa");
    if (novoGolsF > parseInt(document.getElementById("tvGolsFora").innerHTML || -1)) piscarGol("tvGolsFora");
    document.getElementById("tvGolsCasa").innerHTML = novoGolsC;
    document.getElementById("tvGolsFora").innerHTML = novoGolsF;

    const periodo = document.getElementById("manPeriodo").value;
    if (periodo === "INTERVALO" || periodo === "PRÉ-JOGO" || periodo === "FIM DE JOGO") {
        document.getElementById("tvPeriodo").innerHTML = periodo;
        document.getElementById("tvPeriodo").classList.replace("text-yellow-400", "text-gray-400");
        document.getElementById("tvBadgeAoVivo").classList.replace("text-red-500", "text-gray-500");
        document.getElementById("tvBolinhaAoVivo").classList.replace("bg-red-500", "bg-gray-500");
        document.getElementById("tvBadgeAoVivo").classList.remove("animate-pulse");
        document.getElementById("tvTextoBadge").innerHTML = periodo.toUpperCase();
    } else {
        let m = String(document.getElementById("manMin").value || 0).padStart(2, '0');
        let s = String(document.getElementById("manSeg").value || 0).padStart(2, '0');
        document.getElementById("tvPeriodo").innerHTML = `${m}:${s}`;
        document.getElementById("tvPeriodo").classList.replace("text-gray-400", "text-yellow-400");
        document.getElementById("tvBadgeAoVivo").classList.replace("text-gray-500", "text-red-500");
        document.getElementById("tvBolinhaAoVivo").classList.replace("bg-gray-500", "bg-red-500");
        document.getElementById("tvBadgeAoVivo").classList.add("animate-pulse");
        document.getElementById("tvTextoBadge").innerHTML = "AO VIVO";
    }
}
