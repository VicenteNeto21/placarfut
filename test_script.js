
        // ========== CONFIGURAÇÃO DO BACKEND (Vercel) ==========
        // ALTERE ESTA URL PARA O ENDPOINT DO SEU BACKEND NA VERCEL
        const BACKEND_URL = 'https://seu-projeto.vercel.app/api/sofascore'; // <--- SUBSTITUA PELA SUA URL

        // ========== FUNÇÕES GLOBAIS ==========
        let modoAtual = 'auto';
        let jogoSelecionadoId = null;
        let ultimoPlacar = { casa: -1, fora: -1 };
        let loopDados = null;
        let loopCronometro = null;
        let todosOsJogos = [];
        let minAtual = 0;
        let segAtual = 0;
        let cronometroRodando = false;
        let cacheJogos = null;
        let ultimoFetchCache = 0;
        const CACHE_TTL = 30000;

        // Controles do modo manual
        let manValGolsCasa = 0;
        let manValGolsFora = 0;
        let manualTimerRunning = false;
        let manualLoop = null;

        // ========== FUNÇÕES DE INTERFACE (Abas) ==========
        function mudarAba(aba) {
            document.getElementById("tabAuto").classList.remove("active");
            document.getElementById("tabManual").classList.remove("active");
            document.getElementById("tabEspn").classList.remove("active");
            document.getElementById("contentAuto").classList.remove("active");
            document.getElementById("contentManual").classList.remove("active");
            document.getElementById("contentEspn").classList.remove("active");

            if (aba === 'auto') {
                document.getElementById("tabAuto").classList.add("active");
                document.getElementById("contentAuto").classList.add("active");
                modoAtual = 'auto';
            } else if (aba === 'manual') {
                document.getElementById("tabManual").classList.add("active");
                document.getElementById("contentManual").classList.add("active");
                modoAtual = 'manual';
            } else if (aba === 'espn') {
                document.getElementById("tabEspn").classList.add("active");
                document.getElementById("contentEspn").classList.add("active");
                carregarNoticiasESPN();
            }
        }

        // ========== COMUNICAÇÃO COM O BACKEND (Proxy SofaScore) ==========
        async function fetchSofaScore(endpoint) {
            const url = `${BACKEND_URL}?path=${encodeURIComponent(endpoint)}`;
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return await response.json();
            } catch (error) {
                console.error('Erro no proxy:', error);
                throw error;
            }
        }

        // ========== BUSCAR JOGOS SOFASCORE ==========
        async function buscarJogosSofaScore() {
            const painelStatus = document.getElementById("statusPainel");
            const listaDiv = document.getElementById("listaDeJogos");

            if (cacheJogos && (Date.now() - ultimoFetchCache) < CACHE_TTL) {
                exibirJogosNaLista(cacheJogos);
                painelStatus.innerText = `Cache: ${cacheJogos.length} jogos encontrados (atualizado há ${Math.floor((Date.now() - ultimoFetchCache) / 1000)}s)`;
                return;
            }

            painelStatus.innerHTML = '<span class="loading-spinner"></span> Conectando ao backend...';
            listaDiv.innerHTML = '<div class="col-span-2 text-center text-gray-400 py-8">Aguardando resposta...</div>';

            try {
                const data = await fetchSofaScore('sport/football/events/live');
                cacheJogos = data.events || [];
                ultimoFetchCache = Date.now();

                if (cacheJogos.length > 0) {
                    exibirJogosNaLista(cacheJogos);
                    painelStatus.innerText = `${cacheJogos.length} jogos ao vivo encontrados!`;
                } else {
                    painelStatus.innerText = "Nenhum jogo ao vivo no momento.";
                    listaDiv.innerHTML = '<div class="col-span-2 text-center text-gray-400 py-8">Nenhuma partida em andamento agora</div>';
                }
            } catch (error) {
                console.error(error);
                painelStatus.innerText = `❌ Erro: ${error.message}`;
                listaDiv.innerHTML = `
                    <div class="col-span-2 bg-red-900/30 border border-red-800 p-6 rounded-xl text-center">
                        <p class="text-red-400 font-bold mb-2">🚫 Falha na conexão</p>
                        <p class="text-sm text-gray-300">Verifique se o backend está rodando corretamente e a URL está configurada.</p>
                        <button onclick="buscarJogosSofaScore()" class="mt-4 bg-red-600 hover:bg-red-500 px-4 py-2 rounded text-sm font-bold">🔁 Tentar Novamente</button>
                    </div>
                `;
            }
        }

        function exibirJogosNaLista(jogos) {
            const listaDiv = document.getElementById("listaDeJogos");
            listaDiv.innerHTML = "";

            jogos.forEach(jogo => {
                const btn = document.createElement("button");
                btn.className = "bg-gray-700 hover:bg-gray-600 p-4 rounded-xl text-left flex justify-between items-center border border-gray-600 transition-all hover:scale-[1.02]";

                let tempo = jogo.statusTime ? `${jogo.statusTime.current}'` : (jogo.status.description || "Pré-Jogo");
                let golsC = jogo.homeScore?.current || 0;
                let golsF = jogo.awayScore?.current || 0;
                let logoC = `https://api.sofascore.app/api/v1/team/${jogo.homeTeam.id}/image`;
                let logoF = `https://api.sofascore.app/api/v1/team/${jogo.awayTeam.id}/image`;

                btn.innerHTML = `
                    <div class="flex items-center gap-4 flex-1">
                        <img src="${logoC}" class="w-10 h-10 object-contain bg-white/10 rounded-full p-1">
                        <div class="flex-1">
                            <div class="text-xs text-blue-400 font-bold mb-1">
                                <span class="bg-black/50 text-white px-1.5 py-0.5 rounded mr-1">${jogo.tournament.name}</span>
                                [${tempo}]
                            </div>
                            <div class="text-md font-bold text-white">
                                ${jogo.homeTeam.shortName || jogo.homeTeam.name} vs ${jogo.awayTeam.shortName || jogo.awayTeam.name}
                            </div>
                        </div>
                        <img src="${logoF}" class="w-10 h-10 object-contain bg-white/10 rounded-full p-1">
                    </div>
                    <div class="text-2xl font-black bg-gray-900 text-white px-4 py-2 rounded-lg ml-4">
                        ${golsC} - ${golsF}
                    </div>
                `;
                btn.onclick = () => iniciarTransmissaoSofaScore(jogo.id);
                listaDiv.appendChild(btn);
            });
        }

        function iniciarTransmissaoSofaScore(id) {
            jogoSelecionadoId = id;
            document.getElementById("painelAdmin").style.display = "none";
            document.getElementById("uiTransmissao").style.display = "block";
            ultimoPlacar = { casa: -1, fora: -1 };
            atualizarDadosSofaScore();
            iniciarCronometroSofaScore();

            if (loopDados) clearInterval(loopDados);
            loopDados = setInterval(atualizarDadosSofaScore, 10000);
        }

        async function atualizarDadosSofaScore() {
            if (!jogoSelecionadoId) return;

            try {
                const eventData = await fetchSofaScore(`event/${jogoSelecionadoId}`);
                const jogo = eventData.event;

                // Estatísticas (escanteios)
                try {
                    const statsData = await fetchSofaScore(`event/${jogoSelecionadoId}/statistics`);
                    const statsBar = document.getElementById("tvStatsBar");
                    if (statsData.statistics && statsData.statistics.length > 0) {
                        const periodStats = statsData.statistics[0].groups;
                        let escC = 0, escF = 0;
                        periodStats.forEach(grupo => {
                            grupo.statisticsItems.forEach(item => {
                                if (item.name === "Corner kicks" || item.name === "Escanteios") {
                                    escC = item.home || 0;
                                    escF = item.away || 0;
                                }
                            });
                        });
                        document.getElementById("statEscanteios").innerHTML = `🏁 ESCANTEIOS: ${escC} - ${escF}`;
                        statsBar.classList.remove("hidden");
                    } else {
                        statsBar.classList.add("hidden");
                    }
                } catch (e) {
                    document.getElementById("tvStatsBar").classList.add("hidden");
                }

                const golsC = jogo.homeScore?.current || 0;
                const golsF = jogo.awayScore?.current || 0;

                document.getElementById("tvCampeonato").innerHTML = jogo.tournament.name.toUpperCase();
                document.getElementById("tvNomeCasa").innerHTML = (jogo.homeTeam.shortName || jogo.homeTeam.name).substring(0, 4).toUpperCase();
                document.getElementById("tvNomeFora").innerHTML = (jogo.awayTeam.shortName || jogo.awayTeam.name).substring(0, 4).toUpperCase();
                document.getElementById("imgLogoCasa").src = `https://api.sofascore.app/api/v1/team/${jogo.homeTeam.id}/image`;
                document.getElementById("imgLogoFora").src = `https://api.sofascore.app/api/v1/team/${jogo.awayTeam.id}/image`;

                const rcC = jogo.homeRedCards || 0;
                const rcF = jogo.awayRedCards || 0;
                const elRcCasa = document.getElementById("tvRedCardCasa");
                const elRcFora = document.getElementById("tvRedCardFora");
                if (rcC > 0) { elRcCasa.classList.remove("hidden"); elRcCasa.innerHTML = rcC > 1 ? rcC : ""; } else { elRcCasa.classList.add("hidden"); }
                if (rcF > 0) { elRcFora.classList.remove("hidden"); elRcFora.innerHTML = rcF > 1 ? rcF : ""; } else { elRcFora.classList.add("hidden"); }

                const statusCode = jogo.status.code;
                const isLive = statusCode === 1 || statusCode === 2 || statusCode === 3;
                if (isLive) {
                    document.getElementById("tvBadgeAoVivo").classList.add("text-red-500");
                    document.getElementById("tvBadgeAoVivo").classList.remove("text-gray-500");
                    document.getElementById("tvBolinhaAoVivo").classList.add("bg-red-500");
                    document.getElementById("tvBolinhaAoVivo").classList.remove("bg-gray-500");
                    document.getElementById("tvBadgeAoVivo").classList.add("animate-pulse");
                    document.getElementById("tvTextoBadge").innerHTML = "AO VIVO";
                    document.getElementById("tvPeriodo").classList.add("text-yellow-400");
                    document.getElementById("tvPeriodo").classList.remove("text-gray-400");
                    cronometroRodando = true;
                } else {
                    document.getElementById("tvBadgeAoVivo").classList.remove("text-red-500");
                    document.getElementById("tvBadgeAoVivo").classList.add("text-gray-500");
                    document.getElementById("tvBolinhaAoVivo").classList.remove("bg-red-500");
                    document.getElementById("tvBolinhaAoVivo").classList.add("bg-gray-500");
                    document.getElementById("tvBadgeAoVivo").classList.remove("animate-pulse");
                    let txt = "ENCERRADO";
                    if (statusCode === 4) txt = "INTERVALO";
                    if (statusCode === 0) txt = "PRÉ-JOGO";
                    document.getElementById("tvTextoBadge").innerHTML = txt;
                    document.getElementById("tvPeriodo").innerHTML = txt;
                    document.getElementById("tvPeriodo").classList.remove("text-yellow-400");
                    document.getElementById("tvPeriodo").classList.add("text-gray-400");
                    cronometroRodando = false;
                }

                if (jogo.statusTime && isLive) {
                    let tempoMin = jogo.statusTime.current;
                    if (Math.abs(minAtual - tempoMin) > 2) { minAtual = tempoMin; segAtual = 0; }
                }

                if (ultimoPlacar.casa !== -1) {
                    if (golsC > ultimoPlacar.casa) piscarGol("tvGolsCasa");
                    if (golsF > ultimoPlacar.fora) piscarGol("tvGolsFora");
                }
                document.getElementById("tvGolsCasa").innerHTML = golsC;
                document.getElementById("tvGolsFora").innerHTML = golsF;
                ultimoPlacar = { casa: golsC, fora: golsF };

                atualizarRodapeSofaScore();
            } catch (error) {
                console.error("Erro ao atualizar dados:", error);
            }
        }

        async function atualizarRodapeSofaScore() {
            try {
                const data = await fetchSofaScore('sport/football/events/live');
                let tickerHTML = "";
                if (data.events && data.events.length > 0) {
                    data.events.forEach(j => {
                        if (j.id === jogoSelecionadoId) return;
                        let tempoStr = j.statusTime ? j.statusTime.current + "'" : (j.status.description || "Em breve");
                        tickerHTML += `
                            <div class="ticker-item">
                                <span class="liga-badge">${j.tournament.name}</span>
                                <span class="ticker-status text-yellow-400">[${tempoStr}]</span>
                                <img src="https://api.sofascore.app/api/v1/team/${j.homeTeam.id}/image" class="h-5 mx-2 object-contain rounded">
                                ${j.homeTeam.shortName || j.homeTeam.name}
                                <span class="text-white font-black mx-1">${j.homeScore?.current || 0}</span>
                                <span class="text-gray-400">vs</span>
                                <span class="text-white font-black mx-1">${j.awayScore?.current || 0}</span>
                                ${j.awayTeam.shortName || j.awayTeam.name}
                                <img src="https://api.sofascore.app/api/v1/team/${j.awayTeam.id}/image" class="h-5 mx-2 object-contain rounded">
                            </div>
                        `;
                    });
                }
                if (tickerHTML === "") tickerHTML = "<div class='ticker-item'>Nenhuma outra partida ao vivo no momento.</div>";
                document.getElementById("tvTicker").innerHTML = tickerHTML + tickerHTML;
            } catch (e) { console.error("Erro no ticker:", e); }
        }

        function piscarGol(elementoId) {
            const el = document.getElementById(elementoId);
            el.classList.remove("goal-alert");
            void el.offsetWidth;
            el.classList.add("goal-alert");
        }

        function iniciarCronometroSofaScore() {
            if (loopCronometro) clearInterval(loopCronometro);
            loopCronometro = setInterval(() => {
                if (cronometroRodando) {
                    segAtual++;
                    if (segAtual >= 60) { segAtual = 0; minAtual++; }
                    const m = String(minAtual).padStart(2, '0');
                    const s = String(segAtual).padStart(2, '0');
                    document.getElementById("tvPeriodo").innerHTML = `${m}:${s}`;
                }
            }, 1000);
        }

        // ========== MODO MANUAL ==========
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
                btn.innerHTML = "⏸ PAUSAR";
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
                btn.innerHTML = "▶ PLAY";
                btn.classList.replace("bg-yellow-600", "bg-blue-600");
                btn.classList.replace("hover:bg-yellow-500", "hover:bg-blue-500");
                clearInterval(manualLoop);
            }
        }

        function iniciarTransmissaoManual() {
            if (loopDados) clearInterval(loopDados);
            if (loopCronometro) clearInterval(loopCronometro);
            document.getElementById("painelAdmin").style.display = "none";
            document.getElementById("uiTransmissao").style.display = "block";
            document.getElementById("tvScorersBar").classList.add("hidden");
            document.getElementById("tvStatsBar").classList.add("hidden");
            document.getElementById("tvRedCardCasa").classList.add("hidden");
            document.getElementById("tvRedCardFora").classList.add("hidden");
            atualizarPlacarManualNoOBS();
        }

        function atualizarPlacarManualNoOBS() {
            document.getElementById("tvCampeonato").innerHTML = document.getElementById("manCamp").value.toUpperCase();
            document.getElementById("tvNomeCasa").innerHTML = document.getElementById("manCasaNome").value.toUpperCase().substring(0, 4);
            document.getElementById("tvNomeFora").innerHTML = document.getElementById("manForaNome").value.toUpperCase().substring(0, 4);
            let logoCasa = document.getElementById("manCasaLogo").value;
            let logoFora = document.getElementById("manForaLogo").value;
            document.getElementById("imgLogoCasa").src = logoCasa || "https://via.placeholder.com/150/000000/FFFFFF/?text=CASA";
            document.getElementById("imgLogoFora").src = logoFora || "https://via.placeholder.com/150/000000/FFFFFF/?text=FORA";

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

        // ========== ESPN NOTÍCIAS (via RSS2JSON) ==========
        async function carregarNoticiasESPN() {
            const espnDiv = document.getElementById("espnNewsList");
            espnDiv.innerHTML = '<div class="text-center text-gray-400 py-8"><span class="loading-spinner"></span> Carregando notícias da ESPN...</div>';

            try {
                // RSS da ESPN Brasil (futebol)
                const rssUrl = 'https://www.espn.com.br/espn/rss/futebol/noticias';
                // Usamos o serviço público rss2json.com para converter RSS em JSON (sem CORS)
                const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

                const response = await fetch(apiUrl);
                const data = await response.json();

                if (data.status === 'ok' && data.items && data.items.length) {
                    let html = '';
                    data.items.forEach(item => {
                        // Extrai título e link
                        const title = item.title;
                        const link = item.link;
                        const pubDate = new Date(item.pubDate).toLocaleDateString('pt-BR');
                        html += `
                            <a href="${link}" target="_blank" class="news-item block bg-gray-700/50 hover:bg-gray-700 rounded-lg p-4 border-l-4 border-gray-600 transition-all">
                                <div class="text-sm text-red-400 font-bold mb-1">ESPN • ${pubDate}</div>
                                <div class="text-white font-bold text-md">${title}</div>
                            </a>
                        `;
                    });
                    espnDiv.innerHTML = html;
                } else {
                    espnDiv.innerHTML = '<div class="text-center text-gray-400 py-8">Nenhuma notícia encontrada no momento.</div>';
                }
            } catch (error) {
                console.error('Erro ao carregar ESPN:', error);
                espnDiv.innerHTML = `
                    <div class="bg-red-900/30 border border-red-800 p-6 rounded-xl text-center">
                        <p class="text-red-400 font-bold">Erro ao carregar notícias</p>
                        <p class="text-sm text-gray-300">${error.message}</p>
                        <button onclick="carregarNoticiasESPN()" class="mt-4 bg-red-600 hover:bg-red-500 px-4 py-2 rounded text-sm font-bold">🔁 Tentar Novamente</button>
                    </div>
                `;
            }
        }

        // ========== CONTROLE DE TAMANHO E ARRASTE ==========
        let escalaPlacar = 1.0;
        function mudarTamanho(valor) {
            escalaPlacar += valor;
            if (escalaPlacar < 0.5) escalaPlacar = 0.5;
            if (escalaPlacar > 1.8) escalaPlacar = 1.8;
            document.getElementById("placarCard").style.transform = `scale(${escalaPlacar})`;
            document.getElementById("textoTamanho").innerText = Math.round(escalaPlacar * 100) + "%";
        }

        const wrapperPlacar = document.getElementById("placarWrapper");
        const dragHandlePlacar = document.getElementById("dragHandle");
        if (wrapperPlacar && dragHandlePlacar) {
            let isDragging = false;
            let offsetX, offsetY;
            dragHandlePlacar.addEventListener('mousedown', (e) => {
                isDragging = true;
                const rect = wrapperPlacar.getBoundingClientRect();
                wrapperPlacar.style.bottom = 'auto';
                wrapperPlacar.style.transform = 'none';
                wrapperPlacar.style.left = rect.left + 'px';
                wrapperPlacar.style.top = rect.top + 'px';
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;
            });
            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                wrapperPlacar.style.left = (e.clientX - offsetX) + 'px';
                wrapperPlacar.style.top = (e.clientY - offsetY) + 'px';
            });
            document.addEventListener('mouseup', () => { isDragging = false; });
        }

        // Inicialização
        mudarAba('auto');
    
