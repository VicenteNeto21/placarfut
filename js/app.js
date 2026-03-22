// ========== js/app.js ==========
// Inicialização do Aplicativo PlacarFut

document.addEventListener("DOMContentLoaded", () => {
    // Liga o arrastador do placar do OBS
    inicializarArrastador();
    
    // Atualiza a Label e inicia o painel no modo automático
    atualizarLabelData();
    mudarAba('auto');
    
    // Opcional: já puxa os jogos logo de cara se tiver na aba auto
    buscarJogosSofaScore();

    // Inicia o motor de cronômetro dinâmico da lista de jogos
    setInterval(tickCronometrosDaLista, 1000);
});
