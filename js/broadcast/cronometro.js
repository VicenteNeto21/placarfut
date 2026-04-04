// ========== js/broadcast/cronometro.js ==========
// Cronômetro do placar ao vivo

function iniciarCronometroSofaScore() {
    if (loopCronometro) clearInterval(loopCronometro);
    loopCronometro = setInterval(() => {
        if (cronometroRodando) {
            segAtual++;
            if (segAtual >= 60) { segAtual = 0; minAtual++; }
            const m = String(minAtual).padStart(2, '0');
            const s = String(segAtual).padStart(2, '0');
            const el = DOM.periodo || document.getElementById("tvPeriodo");
            if (el) el.innerHTML = `${m}:${s}`;
        }
    }, 1000);
}
