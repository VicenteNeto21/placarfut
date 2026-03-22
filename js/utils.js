// ========== js/utils.js ==========
// Funções auxiliares de lógica, datas e tratamentos isolados

function getDataComOffset(offset = 0) {
    const agora = new Date();
    // Ajuste simples para o fuso de Fortaleza (UTC-3)
    const utc = agora.getTime() + (agora.getTimezoneOffset() * 60000);
    const fortaleza = new Date(utc + (3600000 * -3));
    
    fortaleza.setDate(fortaleza.getDate() + offset);
    const y = fortaleza.getFullYear();
    const m = String(fortaleza.getMonth() + 1).padStart(2, '0');
    const d = String(fortaleza.getDate()).padStart(2, '0');
    return { iso: `${y}-${m}-${d}`, dateObj: fortaleza };
}

function isJogoAoVivo(jogo) {
    const code = jogo.status?.code;
    const type = jogo.status?.type;
    if (code === 100 || type === 'finished') return false;
    // códigos de Not Started (0), Cancelado/Adiado (60, 70, 80, 90) também não são Ao Vivo
    if (code === 0 || code === 60 || code === 70 || code === 80 || code === 90 || type === 'notstarted' || type === 'postponed' || type === 'canceled') return false;
    
    return (code >= 1 && code <= 31) || type === 'inprogress';
}

function getStatusJogo(jogo) {
    const code = jogo.status?.code;
    const type = jogo.status?.type;
    
    if (code === 100 || type === 'finished') {
        return { texto: 'ENCERRADO', classe: 'status-finished', icone: '<i class="fa-solid fa-flag-checkered"></i>' };
    }
    if (code === 31) {
        return { texto: 'INTERVALO', classe: 'status-halftime', icone: '<i class="fa-solid fa-pause"></i>' };
    }
    if ((code >= 1 && code <= 31) || type === 'inprogress') {
        return { texto: jogo.statusTime?.current ? `${jogo.statusTime.current}'` : 'AO VIVO', classe: 'status-live', icone: '<i class="fa-solid fa-circle fa-beat-fade" style="font-size:8px text-red-500"></i>' };
    }
    if (code === 0 || type === 'notstarted') {
        return { texto: 'A INICIAR', classe: 'status-upcoming', icone: '<i class="fa-regular fa-clock"></i>' };
    }
    if (code === 60 || type === 'postponed') {
        return { texto: 'ADIADO', classe: 'status-finished', icone: '<i class="fa-solid fa-ban"></i>' };
    }
    if (code === 70 || type === 'canceled') {
        return { texto: 'CANCELADO', classe: 'status-finished', icone: '<i class="fa-solid fa-ban"></i>' };
    }
    return { texto: jogo.status?.description || 'N/D', classe: 'status-finished', icone: '<i class="fa-solid fa-futbol"></i>' };
}
