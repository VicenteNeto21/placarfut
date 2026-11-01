// ========== js/broadcast/drag.js ==========
// Sistema Universal de Arraste e Escala para Overlays do OBS (Mouse & Touch)
// Suporta: Placar, Tabela, Mata-Mata, Próximos Jogos e Meta de Inscritos
// Compatível com OBS Studio (CEF Browser Source), Chrome, Edge e telas Touch

window.dragOffsetX = null;
window.dragOffsetY = null;
window.escalaPlacar = 0.95;

function definirEscalaPlacar(escala = 0.95) {
    window.escalaPlacar = Number(escala) || 0.95;
    if (window.escalaPlacar < 0.5) window.escalaPlacar = 0.5;
    if (window.escalaPlacar > 1.8) window.escalaPlacar = 1.8;
    
    const wrapper = DOM.placarWrapper || document.getElementById("placarWrapper");
    if (wrapper) {
        wrapper.style.transformOrigin = "bottom left";
        if (window.dragOffsetX === null) {
            wrapper.style.transform = `scale(${window.escalaPlacar})`;
        } else {
            wrapper.style.transform = `translate(${window.dragOffsetX}px, ${window.dragOffsetY}px) scale(${window.escalaPlacar})`;
        }
    }
    
    const txtTam = DOM.textoTamanho || document.getElementById("textoTamanho");
    if (txtTam) txtTam.innerText = Math.round(window.escalaPlacar * 100) + "%";
}

function mudarTamanho(valor) {
    definirEscalaPlacar(window.escalaPlacar + valor);
    try {
        const saved = localStorage.getItem('placar_drag_pos');
        const pos = saved ? JSON.parse(saved) : {};
        pos.scale = window.escalaPlacar;
        pos.x = window.dragOffsetX !== null ? window.dragOffsetX : 0;
        pos.y = window.dragOffsetY !== null ? window.dragOffsetY : 0;
        localStorage.setItem('placar_drag_pos', JSON.stringify(pos));
    } catch(e) {}
}

/**
 * Função utilitária genérica para tornar qualquer elemento arrastável
 * Suporta MouseEvents (OBS Studio CEF) e TouchEvents (Telas Touch)
 */
function tornarArrastavel(wrapperEl, handleEl, storageKey, options = {}) {
    if (!wrapperEl || !handleEl) return;

    // Desativa arrasto de imagens nativas e seleções de texto
    wrapperEl.style.userSelect = 'none';
    wrapperEl.style.webkitUserSelect = 'none';
    wrapperEl.ondragstart = () => false;

    wrapperEl.querySelectorAll('img').forEach(img => {
        img.draggable = false;
        img.ondragstart = () => false;
    });

    // 1. Restaura posição salva no localStorage
    try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            const pos = JSON.parse(saved);
            if (options.useTransform) {
                if (typeof pos.x === 'number' && typeof pos.y === 'number') {
                    window.dragOffsetX = pos.x;
                    window.dragOffsetY = pos.y;
                    if (typeof pos.scale === 'number') window.escalaPlacar = pos.scale;
                    wrapperEl.style.transformOrigin = "bottom left";
                    wrapperEl.style.transform = `translate(${window.dragOffsetX}px, ${window.dragOffsetY}px) scale(${window.escalaPlacar})`;
                }
            } else if (pos.left && pos.top) {
                wrapperEl.style.right = 'auto';
                wrapperEl.style.bottom = 'auto';
                wrapperEl.style.left = pos.left;
                wrapperEl.style.top = pos.top;
            }
        }
    } catch(e) {}

    let isDragging = false;
    let startX = 0, startY = 0;
    let initialLeft = 0, initialTop = 0;

    handleEl.style.cursor = 'grab';

    function getCoords(e) {
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    }

    function onStart(e) {
        // Ignora cliques que não sejam com botão esquerdo
        if (e.type === 'mousedown' && e.button !== 0) return;
        
        // Ignora cliques diretos em botões de ação ou inputs
        if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input') || e.target.closest('select')) {
            return;
        }

        isDragging = true;
        handleEl.style.cursor = 'grabbing';

        const c = getCoords(e);
        startX = c.x;
        startY = c.y;

        if (options.useTransform) {
            if (window.dragOffsetX === null) {
                window.dragOffsetX = 0;
                window.dragOffsetY = 0;
                wrapperEl.style.transformOrigin = "bottom left";
                wrapperEl.style.transform = `translate(${window.dragOffsetX}px, ${window.dragOffsetY}px) scale(${window.escalaPlacar})`;
            }
        } else {
            const rect = wrapperEl.getBoundingClientRect();
            wrapperEl.style.transition = 'none';
            wrapperEl.classList.remove("oculto", "oculto-inscritos");
            wrapperEl.style.right = 'auto';
            wrapperEl.style.bottom = 'auto';
            wrapperEl.style.left = rect.left + 'px';
            wrapperEl.style.top = rect.top + 'px';
            initialLeft = rect.left;
            initialTop = rect.top;
        }

        if (e.cancelable) e.preventDefault();
    }

    function onMove(e) {
        if (!isDragging) return;

        const c = getCoords(e);
        const deltaX = c.x - startX;
        const deltaY = c.y - startY;

        if (options.useTransform) {
            const esc = (typeof window.escalaPlacar === 'number' && window.escalaPlacar > 0) ? window.escalaPlacar : 0.95;
            window.dragOffsetX += deltaX / esc;
            window.dragOffsetY += deltaY / esc;
            wrapperEl.style.transform = `translate(${window.dragOffsetX}px, ${window.dragOffsetY}px) scale(${esc})`;
            startX = c.x;
            startY = c.y;
        } else {
            wrapperEl.style.left = (initialLeft + deltaX) + 'px';
            wrapperEl.style.top = (initialTop + deltaY) + 'px';
        }
    }

    function onEnd() {
        if (!isDragging) return;
        isDragging = false;
        handleEl.style.cursor = 'grab';

        if (!options.useTransform) {
            wrapperEl.style.transition = options.transition || 'opacity 0.4s ease';
        }

        try {
            if (options.useTransform) {
                localStorage.setItem(storageKey, JSON.stringify({
                    x: window.dragOffsetX,
                    y: window.dragOffsetY,
                    scale: window.escalaPlacar
                }));
            } else {
                localStorage.setItem(storageKey, JSON.stringify({
                    left: wrapperEl.style.left,
                    top: wrapperEl.style.top
                }));
            }
        } catch(err) {}
    }

    // Suporta mouse e touch
    handleEl.addEventListener('mousedown', onStart);
    handleEl.addEventListener('touchstart', onStart, { passive: false });

    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });

    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', onEnd);
}

// 1. ARRASTADOR DO PLACAR (Arrasta pelo placar inteiro)
function inicializarArrastador() {
    const wrapper = DOM.placarWrapper || document.getElementById("placarWrapper");
    const card = DOM.placarCard || document.getElementById("placarCard");
    if (wrapper && card) {
        tornarArrastavel(wrapper, card, 'placar_drag_pos', { useTransform: true });
    }
}

// 2. ARRASTADOR DA TABELA DE CLASSIFICAÇÃO
function inicializarArrastadorTabela() {
    const wrapper = DOM.panelTabela || document.getElementById("tvPanelTabela");
    if (wrapper) {
        tornarArrastavel(wrapper, wrapper, 'tabela_drag_pos', {
            transition: 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        });
    }
}

// 3. ARRASTADOR DE CONFRONTOS / MATA-MATA
function inicializarArrastadorConfrontos() {
    const wrapper = DOM.panelConfrontos || document.getElementById("tvPanelConfrontos");
    if (wrapper) {
        tornarArrastavel(wrapper, wrapper, 'confrontos_drag_pos', {
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
        });
    }
}

// 4. ARRASTADOR DE PRÓXIMOS JOGOS
function inicializarArrastadorProximosJogos() {
    const wrapper = DOM.panelProximosJogos || document.getElementById("tvPanelProximosJogos");
    if (wrapper) {
        tornarArrastavel(wrapper, wrapper, 'proximos_drag_pos', {
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
        });
    }
}

// 5. ARRASTADOR DA META DE INSCRITOS
function inicializarArrastadorInscritos() {
    const wrapper = DOM.subscribersPanel || document.getElementById("tvSubscribersPanel");
    if (wrapper) {
        tornarArrastavel(wrapper, wrapper, 'inscritos_drag_pos', {
            transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        });
    }
}

/**
 * Função de emergência para resetar todas as posições caso algum elemento
 * tenha sido arrastado para fora do campo visível da tela
 */
function resetarPosicoesPaineis() {
    const keys = ['placar_drag_pos', 'tabela_drag_pos', 'confrontos_drag_pos', 'proximos_drag_pos', 'inscritos_drag_pos'];
    keys.forEach(k => {
        try { localStorage.removeItem(k); } catch(e) {}
    });
    
    window.dragOffsetX = null;
    window.dragOffsetY = null;
    window.escalaPlacar = 0.95;

    const wrapperPlacar = DOM.placarWrapper || document.getElementById("placarWrapper");
    if (wrapperPlacar) {
        wrapperPlacar.style.transform = `scale(0.95)`;
    }

    const painelTabela = DOM.panelTabela || document.getElementById("tvPanelTabela");
    if (painelTabela) {
        painelTabela.style.left = '';
        painelTabela.style.top = '250px';
        painelTabela.style.right = '52px';
    }

    const painelConfrontos = DOM.panelConfrontos || document.getElementById("tvPanelConfrontos");
    if (painelConfrontos) {
        painelConfrontos.style.left = '';
        painelConfrontos.style.top = '100px';
        painelConfrontos.style.right = '40px';
    }

    const painelProximos = DOM.panelProximosJogos || document.getElementById("tvPanelProximosJogos");
    if (painelProximos) {
        painelProximos.style.left = '24px';
        painelProximos.style.top = '80px';
        painelProximos.style.right = '';
    }

    const painelInscritos = DOM.subscribersPanel || document.getElementById("tvSubscribersPanel");
    if (painelInscritos) {
        painelInscritos.style.left = '';
        painelInscritos.style.top = '100px';
        painelInscritos.style.right = '40px';
    }

    console.log('[PlacarFut] Posições dos painéis resetadas com sucesso para o padrão.');
}

// Tecla de atalho: Alt + R reseta as posições para o padrão
document.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 'r' || e.key === 'R')) {
        resetarPosicoesPaineis();
    }
});
