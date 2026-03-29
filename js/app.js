// ========== js/app.js ==========
// Inicialização do Aplicativo PlacarFut

document.addEventListener("DOMContentLoaded", () => {
    // Liga o arrastador do placar e da tabela do OBS
    inicializarArrastador();
    inicializarArrastadorTabela();
    if (typeof renderizarStatusOperacional === 'function') renderizarStatusOperacional();
    
    // Sempre iniciar a busca de jogos em segundo plano para que o painel admin 
    // nunca fique vazio caso o usuário "Saia" da transmissão restaurada.
    setTimeout(() => {
        if (typeof buscarJogosSofaScore === 'function') buscarJogosSofaScore(false);
    }, 100);

    // Tentar restaurar sessão anterior
    const sessao = carregarSessaoAtiva();
    
    if (sessao) {
        if (sessao.modo === 'auto' && sessao.jogoId) {
            atualizarLabelData();
            iniciarTransmissaoSofaScore(sessao.jogoId);
            return; // Interrompe fluxo normal
        } else if (sessao.modo === 'manual' && sessao.manualData) {
            const d = sessao.manualData;
            if(document.getElementById("manCamp")) document.getElementById("manCamp").value = d.camp || "";
            if(document.getElementById("manCasaNome")) document.getElementById("manCasaNome").value = d.casaNome || "";
            if(document.getElementById("manForaNome")) document.getElementById("manForaNome").value = d.foraNome || "";
            if(document.getElementById("manCasaLogo")) document.getElementById("manCasaLogo").value = d.casaLogo || "";
            if(document.getElementById("manForaLogo")) document.getElementById("manForaLogo").value = d.foraLogo || "";
            manValGolsCasa = d.golsCasa || 0;
            manValGolsFora = d.golsFora || 0;
            if(document.getElementById("manCasaGolsDisplay")) document.getElementById("manCasaGolsDisplay").innerText = manValGolsCasa;
            if(document.getElementById("manForaGolsDisplay")) document.getElementById("manForaGolsDisplay").innerText = manValGolsFora;
            if(document.getElementById("manMin")) document.getElementById("manMin").value = d.min || "0";
            if(document.getElementById("manSeg")) document.getElementById("manSeg").value = d.seg || "0";
            if(document.getElementById("manAcrescimo")) document.getElementById("manAcrescimo").value = d.acrescimo || "0";
            if(document.getElementById("manPeriodo")) document.getElementById("manPeriodo").value = d.periodo || "PRÉ-JOGO";
            if(document.getElementById("manTema")) document.getElementById("manTema").value = d.tema || "";
            if(document.getElementById("manPenCasa")) document.getElementById("manPenCasa").value = d.penCasa || "";
            if(document.getElementById("manPenFora")) document.getElementById("manPenFora").value = d.penFora || "";
            if(document.getElementById("manAgrCasa")) document.getElementById("manAgrCasa").value = d.agrCasa || "";
            if(document.getElementById("manAgrFora")) document.getElementById("manAgrFora").value = d.agrFora || "";
            
            iniciarTransmissaoManual();
            return; // Interrompe fluxo normal
        }
    }

    // Fluxo normal se não houver sessão
    try {
        atualizarLabelData();
        mudarAba('auto');
        // Pequeno atraso para garantir que o DOM e os estados iniciais estejam prontos
        setTimeout(() => {
            buscarJogosSofaScore(true);
        }, 300);
    } catch (e) {
        console.error("Erro na inicialização automática:", e);
    }

    // Inicia o motor de cronômetro dinâmico da lista de jogos
    setInterval(tickCronometrosDaLista, 1000);
});
