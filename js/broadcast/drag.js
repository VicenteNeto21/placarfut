// ========== js/broadcast/drag.js ==========
// Controles de tamanho e arraste para os painéis OBS com persistência de posição

let dragOffsetX = null;
let dragOffsetY = null;

function definirEscalaPlacar(escala = 0.95) {
    escalaPlacar = escala;
    if (escalaPlacar < 0.5) escalaPlacar = 0.5;
    if (escalaPlacar > 1.8) escalaPlacar = 1.8;
    
    const wrapper = DOM.placarWrapper || document.getElementById("placarWrapper");
    if (wrapper) {
        wrapper.style.transformOrigin = "bottom left";
        if (dragOffsetX === null) {
            wrapper.style.transform = `scale(${escalaPlacar})`;
        } else {
            wrapper.style.transform = `translate(${dragOffsetX}px, ${dragOffsetY}px) scale(${escalaPlacar})`;
        }
    }
    
    const txtTam = DOM.textoTamanho || document.getElementById("textoTamanho");
    if (txtTam) txtTam.innerText = Math.round(escalaPlacar * 100) + "%";
}

function mudarTamanho(valor) {
    definirEscalaPlacar(escalaPlacar + valor);
}

// 1. ARRASTADOR DO PLACAR (Permite arrastar tanto pelo cabeçalho quanto pelo corpo do placar)
function inicializarArrastador() {
    const wrapperPlacar = DOM.placarWrapper || document.getElementById("placarWrapper");
    const dragHandlePlacar = DOM.dragHandle || document.getElementById("dragHandle");
    const placarCard = DOM.placarCard || document.getElementById("placarCard");
    
    if (!wrapperPlacar) return;

    // Restaura posição salva no localStorage
    try {
        const saved = localStorage.getItem('placar_drag_pos');
        if (saved) {
            const pos = JSON.parse(saved);
            if (typeof pos.x === 'number' && typeof pos.y === 'number') {
                dragOffsetX = pos.x;
                dragOffsetY = pos.y;
                wrapperPlacar.style.transformOrigin = "bottom left";
                wrapperPlacar.style.transform = `translate(${dragOffsetX}px, ${dragOffsetY}px) scale(${escalaPlacar})`;
            }
        }
    } catch(e) {}

    let isDragging = false;
    let lastClientX, lastClientY;

    // Protege o wrapper de seleções e ghost dragging
    wrapperPlacar.style.userSelect = 'none';
    wrapperPlacar.style.webkitUserSelect = 'none';
    wrapperPlacar.ondragstart = () => false;

    // Elementos que podem ser clicados para arrastar
    const targets = [dragHandlePlacar, placarCard].filter(Boolean);

    targets.forEach(target => {
        target.style.cursor = 'grab';

        target.addEventListener('mousedown', (e) => {
            // Ignora cliques em botões, links ou inputs
            if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.tagName === 'A' || e.target.tagName === 'INPUT') {
                return;
            }
            isDragging = true;
            targets.forEach(t => t.style.cursor = 'grabbing');
            
            lastClientX = e.clientX;
            lastClientY = e.clientY;

            if (dragOffsetX === null) {
                dragOffsetX = 0;
                dragOffsetY = 0;
                wrapperPlacar.style.transformOrigin = "bottom left";
                wrapperPlacar.style.transform = `translate(${dragOffsetX}px, ${dragOffsetY}px) scale(${escalaPlacar})`;
            }

            e.preventDefault();
        });
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - lastClientX;
        const deltaY = e.clientY - lastClientY;
        
        dragOffsetX += deltaX / escalaPlacar;
        dragOffsetY += deltaY / escalaPlacar;
        
        wrapperPlacar.style.transform = `translate(${dragOffsetX}px, ${dragOffsetY}px) scale(${escalaPlacar})`;
        
        lastClientX = e.clientX;
        lastClientY = e.clientY;
    });

    document.addEventListener('mouseup', () => { 
        if (isDragging) {
            isDragging = false; 
            targets.forEach(t => t.style.cursor = 'grab');
            // Salva posição persistente
            try {
                localStorage.setItem('placar_drag_pos', JSON.stringify({ x: dragOffsetX, y: dragOffsetY, scale: escalaPlacar }));
            } catch(e) {}
        }
    });
}

// 2. ARRASTADOR DA TABELA DE CLASSIFICAÇÃO
function inicializarArrastadorTabela() {
    const wrapper = DOM.panelTabela || document.getElementById("tvPanelTabela");
    const handle = DOM.tabelaHandle || document.getElementById("tvTabelaHandle");
    if (!wrapper || !handle) return;

    // Restaura posição salva
    try {
        const saved = localStorage.getItem('tabela_drag_pos');
        if (saved) {
            const pos = JSON.parse(saved);
            if (pos.left && pos.top) {
                wrapper.style.right = 'auto';
                wrapper.style.left = pos.left;
                wrapper.style.top = pos.top;
            }
        }
    } catch(e) {}

    let isDragging = false;
    let offsetX, offsetY;

    handle.style.cursor = 'grab';

    handle.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
        isDragging = true;
        handle.style.cursor = 'grabbing';
        const rect = wrapper.getBoundingClientRect();
        wrapper.style.transition = 'none';
        wrapper.classList.remove("oculto");
        wrapper.style.opacity = '1';
        wrapper.style.transform = 'none'; 
        
        wrapper.style.right = 'auto';
        wrapper.style.left = rect.left + 'px';
        wrapper.style.top = rect.top + 'px';
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        wrapper.style.left = (e.clientX - offsetX) + 'px';
        wrapper.style.top = (e.clientY - offsetY) + 'px';
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            handle.style.cursor = 'grab';
            wrapper.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            try {
                localStorage.setItem('tabela_drag_pos', JSON.stringify({ left: wrapper.style.left, top: wrapper.style.top }));
            } catch(e) {}
        }
    });
}

// 3. ARRASTADOR DE CONFRONTOS / MATA-MATA
function inicializarArrastadorConfrontos() {
    const wrapper = DOM.panelConfrontos || document.getElementById("tvPanelConfrontos");
    const handle = DOM.confrontosHandle || document.getElementById("tvConfrontosHandle");
    if (!wrapper || !handle) return;

    try {
        const saved = localStorage.getItem('confrontos_drag_pos');
        if (saved) {
            const pos = JSON.parse(saved);
            if (pos.left && pos.top) {
                wrapper.style.right = 'auto';
                wrapper.style.left = pos.left;
                wrapper.style.top = pos.top;
            }
        }
    } catch(e) {}

    let isDragging = false;
    let offsetX, offsetY;

    handle.style.cursor = 'grab';

    handle.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
        isDragging = true;
        handle.style.cursor = 'grabbing';
        const rect = wrapper.getBoundingClientRect();
        wrapper.style.transition = 'none';
        wrapper.classList.remove("oculto");
        
        wrapper.style.right = 'auto';
        wrapper.style.left = rect.left + 'px';
        wrapper.style.top = rect.top + 'px';
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        wrapper.style.left = (e.clientX - offsetX) + 'px';
        wrapper.style.top = (e.clientY - offsetY) + 'px';
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            handle.style.cursor = 'grab';
            wrapper.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            try {
                localStorage.setItem('confrontos_drag_pos', JSON.stringify({ left: wrapper.style.left, top: wrapper.style.top }));
            } catch(e) {}
        }
    });
}

// 4. ARRASTADOR DE PRÓXIMOS JOGOS
function inicializarArrastadorProximosJogos() {
    const wrapper = DOM.panelProximosJogos || document.getElementById("tvPanelProximosJogos");
    const handle = DOM.proximosJogosHandle || document.getElementById("tvProximosJogosHandle");
    if (!wrapper || !handle) return;

    try {
        const saved = localStorage.getItem('proximos_drag_pos');
        if (saved) {
            const pos = JSON.parse(saved);
            if (pos.left && pos.top) {
                wrapper.style.right = 'auto';
                wrapper.style.left = pos.left;
                wrapper.style.top = pos.top;
            }
        }
    } catch(e) {}

    let isDragging = false;
    let offsetX, offsetY;

    handle.style.cursor = 'grab';

    handle.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
        isDragging = true;
        handle.style.cursor = 'grabbing';
        const rect = wrapper.getBoundingClientRect();
        wrapper.style.transition = 'none';
        wrapper.classList.remove("oculto");
        wrapper.style.right = 'auto';
        wrapper.style.left = rect.left + 'px';
        wrapper.style.top = rect.top + 'px';
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        wrapper.style.left = (e.clientX - offsetX) + 'px';
        wrapper.style.top = (e.clientY - offsetY) + 'px';
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            handle.style.cursor = 'grab';
            wrapper.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            try {
                localStorage.setItem('proximos_drag_pos', JSON.stringify({ left: wrapper.style.left, top: wrapper.style.top }));
            } catch(e) {}
        }
    });
}

// 5. ARRASTADOR DA META DE INSCRITOS / LIKES
function inicializarArrastadorInscritos() {
    const wrapper = DOM.subscribersPanel || document.getElementById("tvSubscribersPanel");
    const handle = DOM.subscribersHandle || document.getElementById("tvSubscribersHandle");
    if (!wrapper || !handle) return;

    try {
        const saved = localStorage.getItem('inscritos_drag_pos');
        if (saved) {
            const pos = JSON.parse(saved);
            if (pos.left && pos.top) {
                wrapper.style.right = 'auto';
                wrapper.style.left = pos.left;
                wrapper.style.top = pos.top;
            }
        }
    } catch(e) {}

    let isDragging = false;
    let offsetX, offsetY;
    
    handle.ondragstart = () => false;
    handle.style.cursor = 'grab';
    
    handle.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
        isDragging = true;
        handle.style.cursor = 'grabbing';
        const rect = wrapper.getBoundingClientRect();
        wrapper.style.transition = 'none';
        wrapper.classList.remove("oculto-inscritos");
        
        wrapper.style.right = 'auto';
        wrapper.style.left = rect.left + 'px';
        wrapper.style.top = rect.top + 'px';
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        wrapper.style.left = (e.clientX - offsetX) + 'px';
        wrapper.style.top = (e.clientY - offsetY) + 'px';
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            handle.style.cursor = 'grab';
            wrapper.style.transition = 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            try {
                localStorage.setItem('inscritos_drag_pos', JSON.stringify({ left: wrapper.style.left, top: wrapper.style.top }));
            } catch(e) {}
        }
    });
}
