// ========== js/broadcast/drag.js ==========
// Controles de tamanho e arraste para os painéis OBS

let dragOffsetX = null;
let dragOffsetY = null;

function definirEscalaPlacar(escala = 0.95) {
    escalaPlacar = escala;
    if (escalaPlacar < 0.5) escalaPlacar = 0.5;
    if (escalaPlacar > 1.8) escalaPlacar = 1.8;
    
    const wrapper = DOM.placarWrapper || document.getElementById("placarWrapper");
    if (wrapper) {
        wrapper.style.transformOrigin = "bottom center";
        if (dragOffsetX === null) {
            wrapper.style.transform = `translateX(-50%) scale(${escalaPlacar})`;
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

function inicializarArrastador() {
    const wrapperPlacar = DOM.placarWrapper || document.getElementById("placarWrapper");
    const dragHandlePlacar = DOM.dragHandle || document.getElementById("dragHandle");
    if (wrapperPlacar && dragHandlePlacar) {
        let isDragging = false;
        let lastClientX, lastClientY;

        // PREVENÇÃO AGRESSIVA CONTRA SELEÇÃO DE TEXTO E GHOST DRAGGING (Arrastar SVGs ou Imagens nativamente)
        dragHandlePlacar.style.userSelect = 'none';
        dragHandlePlacar.style.webkitUserSelect = 'none';
        dragHandlePlacar.ondragstart = () => false;
        
        // Protege toda a wrapper de criar drags fantasmas dos logos
        if(wrapperPlacar) wrapperPlacar.ondragstart = () => false;

        dragHandlePlacar.style.cursor = 'grab';

        dragHandlePlacar.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
            isDragging = true;
            dragHandlePlacar.style.cursor = 'grabbing';
            
            lastClientX = e.clientX;
            lastClientY = e.clientY;

            if (dragOffsetX === null) {
                // Removemos o translateX(-50%) do CSS inicial e injetamos o pixel hardcoded para continuar no meio sem dar pulo
                dragOffsetX = -(wrapperPlacar.offsetWidth / 2);
                dragOffsetY = 0;
                wrapperPlacar.style.transform = `translate(${dragOffsetX}px, ${dragOffsetY}px) scale(${escalaPlacar})`;
            }

            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - lastClientX;
            const deltaY = e.clientY - lastClientY;
            
            // Divide by escalaPlacar because the translation happens BEFORE scaling in the transform string
            // Without this, dragging the mouse 10px would only move the element 9.5px visually.
            dragOffsetX += deltaX / escalaPlacar;
            dragOffsetY += deltaY / escalaPlacar;
            
            wrapperPlacar.style.transform = `translate(${dragOffsetX}px, ${dragOffsetY}px) scale(${escalaPlacar})`;
            
            lastClientX = e.clientX;
            lastClientY = e.clientY;
        });

        document.addEventListener('mouseup', () => { 
            if (isDragging) {
                isDragging = false; 
                dragHandlePlacar.style.cursor = 'grab';
            }
        });
    }
}

function inicializarArrastadorTabela() {
    const wrapper = DOM.panelTabela || document.getElementById("tvPanelTabela");
    const handle = DOM.tabelaHandle || document.getElementById("tvTabelaHandle");
    if (wrapper && handle) {
        let isDragging = false;
        let offsetX, offsetY;
        handle.addEventListener('mousedown', (e) => {
            isDragging = true;
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
        });
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            wrapper.style.left = (e.clientX - offsetX) + 'px';
            wrapper.style.top = (e.clientY - offsetY) + 'px';
        });
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                wrapper.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            }
        });
    }
}

function inicializarArrastadorConfrontos() {
    const wrapper = DOM.panelConfrontos || document.getElementById("tvPanelConfrontos");
    const handle = DOM.confrontosHandle || document.getElementById("tvConfrontosHandle");
    if (wrapper && handle) {
        let isDragging = false;
        let offsetX, offsetY;
        handle.addEventListener('mousedown', (e) => {
            isDragging = true;
            const rect = wrapper.getBoundingClientRect();
            wrapper.style.transition = 'none';
            wrapper.classList.remove("oculto");
            
            wrapper.style.right = 'auto';
            wrapper.style.left = rect.left + 'px';
            wrapper.style.top = rect.top + 'px';
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
        });
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            wrapper.style.left = (e.clientX - offsetX) + 'px';
            wrapper.style.top = (e.clientY - offsetY) + 'px';
        });
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                wrapper.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            }
        });
    }
}
