// ========== js/ui.js ==========
// Lógica de Renderização e Atualização do Painel de Administração

const NOMES_TORNEIOS_FIXOS = {
    325: "BRASILEIRÃO SÉRIE A", 390: "BRASILEIRÃO SÉRIE B", 1281: "BRASILEIRÃO SÉRIE C", 10326: "BRASILEIRÃO SÉRIE D",
    13076: "BRASILEIRÃO FEMININO", 10257: "BRASILEIRÃO FEMININO A1", 73: "COPA DO BRASIL", 11620: "COPA DO NORDESTE", 2503: "CAMPEONATO CEARENSE", 384: "COPA LIBERTADORES", 480: "COPA SUL-AMERICANA",
    11539: "RECOPA SUL-AMERICANA", 17015: "COPA VERDE", 7: "CHAMPIONS LEAGUE", 679: "EUROPA LEAGUE",
    17: "PREMIER LEAGUE", 8: "LA LIGA", 23: "SERIE A (ITÁLIA)", 35: "BUNDESLIGA", 34: "LIGUE 1"
};

// Alterna as abas (Auto / Manual)
function mudarAba(aba) {
    document.getElementById("tabAuto").classList.remove("active");
    document.getElementById("tabManual").classList.remove("active");
    document.getElementById("contentAuto").classList.remove("active");
    document.getElementById("contentManual").classList.remove("active");

    if (aba === 'auto') {
        document.getElementById("tabAuto").classList.add("active");
        document.getElementById("contentAuto").classList.add("active");
        modoAtual = 'auto';
    } else if (aba === 'manual') {
        document.getElementById("tabManual").classList.add("active");
        document.getElementById("contentManual").classList.add("active");
        modoAtual = 'manual';
    }
}

// Navegação de Datas
function atualizarLabelData() {
    const { dateObj } = getDataComOffset(offsetDias);
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    const label = `${diasSemana[dateObj.getDay()]}, ${dateObj.getDate()} de ${meses[dateObj.getMonth()]}`;
    document.getElementById('dataLabel').textContent = label;
    const badge = document.getElementById('dataBadge');
    if (offsetDias === 0) {
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function mudarData(direcao) {
    offsetDias += direcao;
    cacheJogos = null; // Limpa cache ao mudar dia
    ultimoFetchCache = 0;
    atualizarLabelData();
    buscarJogosSofaScore();
}

function irParaHoje() {
    offsetDias = 0;
    cacheJogos = null;
    ultimoFetchCache = 0;
    atualizarLabelData();
    buscarJogosSofaScore();
}

// ========== GERENCIAMENTO DA MODAL DE CAMPEONATOS ==========

function getInfoTorneio(jogo) {
    const tornId = jogo.tournament?.uniqueTournament?.id || jogo.tournament?.id || 0;
    const nome = jogo.tournament?.name || jogo.tournament?.uniqueTournament?.name || 'Outros';
    return { tornId, nome };
}

function abrirModalTorneios() {
    document.getElementById('modalTorneios').classList.remove('hidden');
    renderizarListaTorneiosSalvos();
    popularSelectNovosTorneios();
}

function fecharModalTorneios() {
    document.getElementById('modalTorneios').classList.add('hidden');
}

function renderizarListaTorneiosSalvos() {
    const container = document.getElementById('listaTorneiosSalvos');
    
    // Lista de campeonatos fixos (que não podem ser removidos)
    // Lista de campeonatos fixos (que não podem ser removidos, apenas ocultos)
    const fixosAtivos = CAMPEONATOS_FIXOS_CODIGO.filter(id => !torneiosOcultos.includes(id));
    const fixosHtml = fixosAtivos.map(id => {
        const favorito = meusTorneios.find(t => t.id === id);
        let nome = favorito ? favorito.nome : NOMES_TORNEIOS_FIXOS[id] || `Torneio ID ${id}`;

        return `
        <div class="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl hover:bg-emerald-500/15 transition-all">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center p-1">
                    <img src="https://api.sofascore.app/api/v1/unique-tournament/${id}/image/dark" onerror="this.src='https://www.sofascore.com/static/images/placeholders/tournament.svg'" class="max-w-full max-h-full object-contain drop-shadow" />
                </div>
                <div>
                    <span class="font-bold text-xs text-gray-200 block">${nome}</span>
                    <span class="text-[9px] text-emerald-400 font-bold uppercase tracking-tight">Monitorado Automático</span>
                </div>
            </div>
            <button onclick="ocultarTorneioFixo(${id})" class="text-gray-500 hover:text-red-500 bg-white/5 hover:bg-red-500/10 w-8 h-8 rounded-lg flex items-center justify-center transition-all" title="Ocultar">
                <i class="fa-solid fa-eye-slash text-xs"></i>
            </button>
        </div>
        `;
    }).join('');

    // Lista de campeonatos manuais (que podem ser removidos)
    const manuaisFiltro = meusTorneios.filter(t => !CAMPEONATOS_FIXOS_CODIGO.includes(t.id));
    const manuaisHtml = manuaisFiltro.map(t => `
        <div class="flex items-center justify-between bg-white/5 border border-white/5 p-3 rounded-xl hover:bg-white/10 transition-colors">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center p-1">
                    <img src="https://api.sofascore.app/api/v1/unique-tournament/${t.id}/image/dark" onerror="this.src='https://www.sofascore.com/static/images/placeholders/tournament.svg'" class="max-w-full max-h-full object-contain drop-shadow" />
                </div>
                <span class="font-bold text-sm text-gray-200">${t.nome}</span>
            </div>
            <button onclick="removerTorneio(${t.id})" class="text-gray-500 hover:text-red-500 bg-white/5 hover:bg-red-500/10 w-8 h-8 rounded-lg flex items-center justify-center transition-all" title="Remover">
                <i class="fa-solid fa-trash text-xs"></i>
            </button>
        </div>
    `).join('');

    // Lista de Ocultos para permitir restaurar
    let ocultosHtml = "";
    if (torneiosOcultos.length > 0) {
        ocultosHtml = torneiosOcultos.map(id => {
            const nome = NOMES_TORNEIOS_FIXOS[id] || `Torneio ID ${id}`;
            return `
            <div class="flex items-center justify-between bg-gray-800/50 border border-white/5 p-2 rounded-xl opacity-60">
                <div class="text-[10px] font-bold text-gray-400 pl-2">${nome}</div>
                <button onclick="restaurarTorneioFixo(${id})" class="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 px-2 py-1 rounded text-[10px] font-black uppercase transition-all">
                    Restaurar
                </button>
            </div>
            `;
        }).join('');
    }

    container.innerHTML = `
        <div class="space-y-3">
            <div class="text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest pl-1">Principais Monitorados</div>
            ${fixosHtml || '<div class="text-center py-2 text-xs text-gray-600">Nenhum monitorado ativo</div>'}
            
            ${manuaisFiltro.length > 0 ? `<div class="text-[10px] font-black uppercase text-gray-500 mt-6 mb-2 tracking-widest pl-1">Seus Favoritos</div>` : ''}
            ${manuaisHtml}

            ${torneiosOcultos.length > 0 ? `
                <div class="text-[10px] font-black uppercase text-gray-500 mt-8 mb-2 tracking-widest pl-1">Ocultados</div>
                <div class="space-y-2">
                    ${ocultosHtml}
                </div>
            ` : ''}
        </div>
    `;
}

function ocultarTorneioFixo(id) {
    if (!torneiosOcultos.includes(id)) {
        torneiosOcultos.push(id);
        salvarTorneiosOcultos();
        renderizarListaTorneiosSalvos();
        
        cacheJogos = null;
        ultimoFetchCache = 0;
        buscarJogosSofaScore();
    }
}

function restaurarTorneioFixo(id) {
    torneiosOcultos = torneiosOcultos.filter(x => x !== id);
    salvarTorneiosOcultos();
    renderizarListaTorneiosSalvos();
    
    cacheJogos = null;
    ultimoFetchCache = 0;
    buscarJogosSofaScore();
}

function popularSelectNovosTorneios() {
    const select = document.getElementById('selectNovosTorneios');

    // Extrair torneios únicos de todos os eventos do dia (ignorando "brazil" que já vem nativo)
    const mapUnicos = new Map();
    todosEventosGlobaisParaFiltro.forEach(jogo => {
        const { tornId, nome } = getInfoTorneio(jogo);
        const catSlug = jogo.tournament?.category?.slug || '';

        if (tornId && nome) {
            // Se não for um fixo e não estiver nos favoritos, permite adicionar
            if (!CAMPEONATOS_FIXOS_CODIGO.includes(tornId) && !meusTorneios.some(t => t.id === tornId)) {
                mapUnicos.set(tornId, nome);
            }
        }
    });

    const torneiosOrdenados = Array.from(mapUnicos.entries())
        .map(([id, nome]) => ({ id, nome }))
        .sort((a, b) => a.nome.localeCompare(b.nome));

    if (torneiosOrdenados.length === 0) {
        select.innerHTML = '<option value="">(Nenhum outro campeonato disponível hoje)</option>';
        return;
    }

    select.innerHTML = '<option value="">-- Escolha um campeonato --</option>' +
        torneiosOrdenados.map(t => `<option value="${t.id}">${t.nome}</option>`).join('');
}

function adicionarTorneioSelecionado() {
    const select = document.getElementById('selectNovosTorneios');
    const selectedOpt = select.options[select.selectedIndex];

    if (!selectedOpt || !selectedOpt.value) return;

    const id = parseInt(selectedOpt.value);
    const nome = selectedOpt.text;

    if (!meusTorneios.some(t => t.id === id)) {
        meusTorneios.push({ id, nome });
        salvarMeusTorneios();
        renderizarListaTorneiosSalvos();
        popularSelectNovosTorneios(); 

        cacheJogos = null;
        ultimoFetchCache = 0;
        buscarJogosSofaScore();
    }
}

async function adicionarTorneioPorIdManual() {
    const input = document.getElementById('inputTorneioIdManual');
    const id = parseInt(input.value);
    if (!id || isNaN(id)) {
        alert("Digite um ID válido (ex: 17015 para Champions)");
        return;
    }

    if (meusTorneios.some(t => t.id === id)) {
        alert("Este campeonato já foi adicionado.");
        input.value = "";
        return;
    }

    // Tenta buscar o nome do campeonato via API para ficar bonitinho
    const btn = event.target;
    const originalText = btn.innerText;
    btn.innerText = "Buscando...";
    btn.disabled = true;

    try {
        const data = await fetchSofaScore(`unique-tournament/${id}`);
        const nome = data.uniqueTournament?.name || `Torneio ID ${id}`;
        
        meusTorneios.push({ id, nome: nome.toUpperCase() });
        salvarMeusTorneios();
        renderizarListaTorneiosSalvos();
        input.value = "";
        
        cacheJogos = null;
        ultimoFetchCache = 0;
        buscarJogosSofaScore();
    } catch (e) {
        alert("Não foi possível encontrar este Torneio. Verifique o ID.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

function removerTorneio(id) {
    meusTorneios = meusTorneios.filter(t => t.id !== id);
    salvarMeusTorneios();
    renderizarListaTorneiosSalvos();
    popularSelectNovosTorneios(); 

    // Força recarregar jogos
    cacheJogos = null;
    ultimoFetchCache = 0;
    buscarJogosSofaScore();
}

async function buscarPartidaPorIdManual() {
    const input = document.getElementById('inputPartidaIdManual');
    const id = parseInt(input.value);
    if (!id || isNaN(id)) {
        alert("Digite um ID de Partida válido (ex: 1234567)");
        return;
    }

    const btn = event.target;
    const originalText = btn.innerText;
    btn.innerText = "Buscando...";
    btn.disabled = true;

    try {
        const data = await fetchSofaScore(`event/${id}`);
        if (!data || !data.event) throw new Error("Partida não encontrada ou ID inválido.");
        
        const jogo = data.event;
        
        // Garante que o jogo está no cache para exibição
        if (!cacheJogos) cacheJogos = [];
        const idxExistente = cacheJogos.findIndex(j => j.id === jogo.id);
        if (idxExistente === -1) {
            cacheJogos.unshift(jogo);
        } else {
            cacheJogos[idxExistente] = jogo;
        }

        // Inicia a transmissão automaticamente
        if (typeof iniciarTransmissaoSofaScore === 'function') {
            iniciarTransmissaoSofaScore(jogo.id);
            fecharModalTorneios();
            input.value = "";
            exibirJogosNaLista(cacheJogos);
        } else {
            throw new Error("Sistema de transmissão não inicializado.");
        }

    } catch (error) {
        console.error(error);
        alert("Erro: " + error.message);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// Fechar modal ao clicar fora
window.addEventListener('click', (e) => {
    const modal = document.getElementById('modalTorneios');
    if (e.target === modal) fecharModalTorneios();
});

// ========== BUSCA DE JOGOS E PROCESSO DE UI ==========
async function buscarJogosSofaScore(forcar = true) {
    const painelStatus = document.getElementById("statusPainel");
    const listaDiv = document.getElementById("listaDeJogos");

    if (cacheJogos && (Date.now() - ultimoFetchCache) < CACHE_TTL) {
        exibirJogosNaLista(cacheJogos);
        painelStatus.innerHTML = `<i class="fa-solid fa-box text-blue-400"></i> Cache: ${cacheJogos.length} jogos (atualizado há ${Math.floor((Date.now() - ultimoFetchCache) / 1000)}s)`;
        return;
    }

    painelStatus.innerHTML = '<span class="loading-spinner"></span> Buscando jogos do dia...';
    listaDiv.innerHTML = '<div class="text-center text-gray-400 py-12"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p class="mt-3 text-sm">Carregando partidas...</p></div>';

    try {
        const { iso: dataSelecionada } = getDataComOffset(offsetDias);
        const data = await fetchSofaScore(`sport/football/scheduled-events/${dataSelecionada}`);
        const todosEventos = data.events || [];

        // Mesclar Live Global se for Hoje (Resolve bug de fuso horário da madrugada)
        if (offsetDias === 0) {
            try {
                const liveData = await fetchSofaScore('sport/football/events/live');
                if (liveData.events) {
                    liveData.events.forEach(liveEv => {
                        const idx = todosEventos.findIndex(e => e.id === liveEv.id);
                        if (idx !== -1) {
                            todosEventos[idx] = liveEv; // Sobrescreve dados em cache com dados frescos
                        } else {
                            todosEventos.push(liveEv);
                        }
                    });
                }
            } catch (e) { console.error('Erro ao mesclar jogos ao vivo extras:', e); }
        }

        todosEventosGlobaisParaFiltro = todosEventos;

        // Filtrar
        cacheJogos = todosEventos.filter(j => {
            // Filtro de Data Local para evitar jogos de "ontem" ou "amanhã" que o SofaScore traz no fuso UTC
            const dataEventoLocal = new Date(j.startTimestamp * 1000).toLocaleDateString('en-CA', { timeZone: APP_TIMEZONE });
            if (dataEventoLocal !== dataSelecionada) return false;

            const { tornId } = getInfoTorneio(j);
            const ehFavoritoMenu = meusTorneios.some(t => t.id === tornId);
            const ehFixoNoCodigo = CAMPEONATOS_FIXOS_CODIGO.includes(tornId) && !torneiosOcultos.includes(tornId);
            
            return ehFavoritoMenu || ehFixoNoCodigo;
        });

        // Ordenar
        cacheJogos.sort((a, b) => {
            const aLive = isJogoAoVivo(a);
            const bLive = isJogoAoVivo(b);
            if (aLive && !bLive) return -1;
            if (!aLive && bLive) return 1;
            return (a.startTimestamp || 0) - (b.startTimestamp || 0);
        });
        ultimoFetchCache = Date.now();

        if (cacheJogos.length > 0) {
            exibirJogosNaLista(cacheJogos);
            const aoVivo = cacheJogos.filter(j => isJogoAoVivo(j)).length;
            const encerrados = cacheJogos.filter(j => j.status?.code === 100 || j.status?.type === 'finished').length;
            painelStatus.innerHTML = `<i class="fa-solid fa-futbol text-green-400"></i> ${cacheJogos.length} jogos hoje — <span class="text-red-400">${aoVivo} ao vivo</span>, <span class="text-gray-400">${encerrados} encerrados</span>`;
        } else {
            painelStatus.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-yellow-400"></i> Nenhum jogo programado para hoje.`;
            listaDiv.innerHTML = '<div class="text-center text-gray-400 py-12"><i class="fa-solid fa-futbol fa-2x mb-3"></i><p>Nenhuma partida programada para hoje</p></div>';
        }
    } catch (error) {
        console.error(error);
        painelStatus.innerHTML = `<i class="fa-solid fa-circle-xmark text-red-400"></i> Erro: ${error.message}`;
        listaDiv.innerHTML = `
            <div class="bg-red-900/30 border border-red-800 p-6 rounded-xl text-center">
                <p class="text-red-400 font-bold mb-2"><i class="fa-solid fa-ban"></i> Falha na conexão</p>
                <p class="text-sm text-gray-300">Verifique se o backend está rodando corretamente.</p>
                <button onclick="buscarJogosSofaScore()" class="mt-4 bg-red-600 hover:bg-red-500 px-4 py-2 rounded text-sm font-bold"><i class="fa-solid fa-rotate-right"></i> Tentar Novamente</button>
            </div>
        `;
    }
}

function exibirJogosNaLista(jogos) {
    const listaDiv = document.getElementById("listaDeJogos");
    listaDiv.innerHTML = "";

    const grupos = {};
    jogos.forEach(jogo => {
        const { tornId, nome: tornNome } = getInfoTorneio(jogo);
        const key = `${tornId}_${tornNome}`;
        if (!grupos[key]) {
            grupos[key] = {
                nome: tornNome,
                id: tornId,
                jogos: []
            };
        }
        grupos[key].jogos.push(jogo);
    });

    Object.values(grupos).forEach(grupo => {
        const secao = document.createElement("div");
        secao.className = "mb-5";

        const logoTorneio = grupo.id ? `${BACKEND_URL}?path=unique-tournament/${grupo.id}/image` : '';
        const aoVivoNoGrupo = grupo.jogos.filter(j => isJogoAoVivo(j)).length;

        const isFixo = CAMPEONATOS_FIXOS_CODIGO.includes(grupo.id);
        const corTextoTitulo = isFixo ? 'text-emerald-400' : 'text-gray-300';
        const badgeFixo = isFixo ? `<span class="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ml-2">Destaque</span>` : '';

        secao.innerHTML = `
            <div class="flex items-center gap-3 mb-3 pb-2 border-b border-gray-700/50">
                ${logoTorneio ? `<img src="${logoTorneio}" class="w-7 h-7 object-contain rounded" onerror="this.style.display='none'">` : ''}
                <h3 class="font-black text-sm uppercase tracking-wider ${corTextoTitulo} flex items-center">${grupo.nome} ${badgeFixo}</h3>
                ${aoVivoNoGrupo > 0 ? `<span class="status-live px-2 py-0.5 rounded text-[10px] font-black inline-flex items-center gap-1"><i class="fa-solid fa-circle fa-beat-fade" style="font-size:6px"></i> ${aoVivoNoGrupo} AO VIVO</span>` : ''}
                <span class="text-gray-600 text-xs ml-auto">${grupo.jogos.length} jogo${grupo.jogos.length > 1 ? 's' : ''}</span>
            </div>
        `;

        const grid = document.createElement("div");
        grid.className = "grid grid-cols-1 lg:grid-cols-2 gap-3";

        grupo.jogos.forEach(jogo => {
            const btn = document.createElement("button");
            if (isFixo) {
                btn.className = "bg-gradient-to-r from-emerald-900/20 to-gray-800/60 hover:from-emerald-900/40 hover:to-gray-700/80 p-3.5 rounded-xl text-left flex justify-between items-center border border-emerald-500/30 transition-all hover:scale-[1.01] hover:border-emerald-400/60 shadow-sm shadow-emerald-900/10";
            } else {
                btn.className = "bg-gray-700/60 hover:bg-gray-600 p-3.5 rounded-xl text-left flex justify-between items-center border border-gray-600/50 transition-all hover:scale-[1.01] hover:border-blue-500/50";
            }

            const status = getStatusJogo(jogo);
            let golsC = jogo.homeScore?.current ?? '-';
            let golsF = jogo.awayScore?.current ?? '-';
            let logoC = `${BACKEND_URL}?path=team/${jogo.homeTeam.id}/image`;
            let logoF = `${BACKEND_URL}?path=team/${jogo.awayTeam.id}/image`;

            let horario = '';
            if (jogo.startTimestamp) {
                const dt = new Date(jogo.startTimestamp * 1000);
                horario = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            }

            let tempoExtraAttr = '';
            let tempoExibicao = status.texto;
            const isLive = isJogoAoVivo(jogo);
            if (isLive && jogo.time?.currentPeriodStartTimestamp) {
                tempoExtraAttr = `data-tempo-jogo="true" data-ts="${jogo.time.currentPeriodStartTimestamp}" data-code="${jogo.status.code}"`;
                let decorrido = Math.floor(Date.now() / 1000) - jogo.time.currentPeriodStartTimestamp;
                let min = Math.floor(decorrido / 60);
                let sec = decorrido % 60;
                if (jogo.status.code === 7 || jogo.status.code === 12 || jogo.status.description === '2nd half') min += 45;
                if (jogo.status.code === 31) { min = 45; sec = 0; }
                tempoExibicao = `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
            }

            btn.innerHTML = `
                <div class="flex items-center gap-3 flex-1 min-w-0">
                    <img src="${logoC}" onerror="this.src='https://www.sofascore.com/static/images/placeholders/team.svg'" referrerpolicy="no-referrer" class="w-9 h-9 object-contain bg-white/10 rounded-full p-1 shrink-0">
                    <div class="flex-1 min-w-0">
                        <div class="text-xs font-bold mb-0.5 flex items-center gap-2 flex-wrap">
                            <span class="${status.classe} px-2 py-0.5 rounded text-[10px] font-black uppercase inline-flex items-center gap-1">${status.icone} <span ${tempoExtraAttr} class="min-w-[32px] inline-block text-center">${tempoExibicao}</span></span>
                            ${horario ? `<span class="text-gray-500 text-[10px]"><i class="fa-regular fa-clock"></i> ${horario}</span>` : ''}
                        </div>
                        <div class="text-sm font-bold text-white truncate">
                            ${jogo.homeTeam.shortName || jogo.homeTeam.name} vs ${jogo.awayTeam.shortName || jogo.awayTeam.name}
                        </div>
                    </div>
                    <img src="${logoF}" onerror="this.src='https://www.sofascore.com/static/images/placeholders/team.svg'" referrerpolicy="no-referrer" class="w-9 h-9 object-contain bg-white/10 rounded-full p-1 shrink-0">
                </div>
                <div class="text-xl font-black bg-gray-900/80 text-white px-3 py-1.5 rounded-lg ml-3 shrink-0 min-w-[70px] text-center">
                    ${golsC} - ${golsF}
                </div>
            `;
            btn.onclick = () => iniciarTransmissaoSofaScore(jogo.id);
            grid.appendChild(btn);
        });

        secao.appendChild(grid);
        listaDiv.appendChild(secao);
    });
}

// Tick cronômetro tempo real na lista
function tickCronometrosDaLista() {
    const els = document.querySelectorAll('[data-tempo-jogo="true"]');
    els.forEach(el => {
        const ts = parseInt(el.getAttribute('data-ts'));
        const code = parseInt(el.getAttribute('data-code'));
        if (!ts) return;

        let decorrido = Math.floor(Date.now() / 1000) - ts;
        if (decorrido < 0) decorrido = 0;
        let min = Math.floor(decorrido / 60);
        let sec = decorrido % 60;

        if (code === 7 || code === 12 || code === 34 || code === 35) min += 45; // Aproximação gasta
        if (code === 31) { min = 45; sec = 0; }

        el.innerText = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    });
}
