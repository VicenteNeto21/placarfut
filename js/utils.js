// ========== js/utils.js ==========
// Funções auxiliares de lógica, datas, sanitização e tratamentos isolados

function getDataComOffset(offset = 0) {
    const agora = new Date();
    const base = new Date(agora.toLocaleString('en-US', { timeZone: APP_TIMEZONE }));
    base.setDate(base.getDate() + offset);

    const y = base.getFullYear();
    const m = String(base.getMonth() + 1).padStart(2, '0');
    const d = String(base.getDate()).padStart(2, '0');
    return { iso: `${y}-${m}-${d}`, dateObj: base };
}

function isJogoAoVivo(jogo) {
    const code = jogo.status?.code;
    const type = jogo.status?.type;
    if (code === 100 || type === 'finished') return false;
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
        return { texto: jogo.statusTime?.current ? `${jogo.statusTime.current}'` : 'AO VIVO', classe: 'status-live', icone: '<i class="fa-solid fa-circle fa-beat-fade text-red-500" style="font-size:8px"></i>' };
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

// ========== SANITIZAÇÃO ==========

/**
 * Escapa HTML para prevenir XSS ao inserir dados da API no DOM.
 */
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ========== CÁLCULO DE TEMPO CENTRALIZADO ==========

/**
 * Calcula minutos e segundos decorridos a partir de um timestamp de início do período.
 * @param {number} periodStartTimestamp - Unix timestamp do início do período
 * @param {number} statusCode - Código de status do jogo
 * @returns {{ min: number, sec: number, injuryTimeKey: string }}
 */
function calcularTempoDecorrido(periodStartTimestamp, statusCode) {
    let decorrido = Math.floor(Date.now() / 1000) - periodStartTimestamp;
    if (decorrido < 0) decorrido = 0;
    let min = Math.floor(decorrido / 60);
    let sec = decorrido % 60;
    let injuryTimeKey = '';

    if (statusCode === 6) {
        injuryTimeKey = 'injuryTime1';
    }
    if ([7, 12].includes(statusCode)) {
        min += 45;
        injuryTimeKey = 'injuryTime2';
    }
    if ([100, 101].includes(statusCode)) {
        min += 90;
        injuryTimeKey = 'injuryTime3';
    }
    if ([105, 106].includes(statusCode)) {
        min += 105;
        injuryTimeKey = 'injuryTime4';
    }
    if (statusCode === 31) { min = 45; sec = 0; }
    if (statusCode === 131) { min = 105; sec = 0; }

    return { min, sec, injuryTimeKey };
}

/**
 * Retorna o label do período atual (1T, 2T, INT, etc.)
 */
function getPeriodLabel(statusCode, description) {
    if (statusCode === 6) return '1T';
    if (statusCode === 7 || (description && description.toLowerCase().includes('2nd'))) return '2T';
    if (statusCode === 31) return 'INT';
    if ([100, 101].includes(statusCode)) return '1T PRO';
    if ([105, 106].includes(statusCode)) return '2T PRO';
    if (statusCode === 131) return 'INT PRO';
    if ([110, 120].includes(statusCode)) return 'PEN';
    return '';
}

// ========== ERROR BOUNDARY GLOBAL ==========

function instalarErrorBoundary() {
    window.addEventListener('unhandledrejection', (event) => {
        console.error('[ERROR BOUNDARY] Promise rejeitada:', event.reason);
        if (typeof atualizarStatusOperacional === 'function') {
            atualizarStatusOperacional('error', 'Erro inesperado: ' + (event.reason?.message || 'Promise rejeitada'), 'runtime');
        }
    });

    window.addEventListener('error', (event) => {
        console.error('[ERROR BOUNDARY] Erro global:', event.message, event.filename, event.lineno);
    });
}
