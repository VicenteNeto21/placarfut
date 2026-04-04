# 🚀 Ideias de Novas Funcionalidades (SofaScore API)

O servidor proxy atual (`api/sofascore.js`) atua como uma ponte universal para praticamente **qualquer dado** público do SofaScore. Como já temos a fundação configurada com fallback e cache, podemos expandir o **PlacarFut** com uma grande gama de dados interessantes para a transmissão ao vivo no OBS.

Aqui estão novas features que podem ser implementadas apenas consumindo endpoints adicionais (ou dados que já chegam na API, mas ignoramos hoje):

---

## 1. 🖼️ Fotos de Jogadores (Cards Visuais)
No proxy, já temos permissão para o path `player/`. Hoje apenas exibimos o texto com o **nome** dos jogadores (para gols e cartões vermelhos). 
- **Endpoint:** `player/{id}/image`
- **Uso no OBS:**
  - Quando houver **Gol** de um jogador, podemos exibir a foto do rosto dele com animação junto à logo do clube.
  - Para o evento de **Substituição**, aparecer o rosto de quem *entra* e de quem *sai*.
  - No card de **Melhor em Campo**, mostrar diretamente a foto oficial do atleta ao invés de apenas texto.

## 2. 🗺️ Desenho Tático / Escalação Animada
O endpoint atual de *Lineups* (`event/{id}/lineups`) não traz apenas a formação descritiva (ex: "4-3-3"), mas entrega a coordenada `(x, y)` de **cada jogador** no campo.
- **Uso no OBS:** Criar uma "Prancheta de Jogo" (Mini-pitch). No *Pré-Jogo*, um atalho de teclado pode jogar uma tela transparente no OBS exibindo as fotos dos 11 iniciais posicionados taticamente sobre as linhas do campo em 3D.

## 3. 🎯 Expected Goals (xG) e Shotmap
O futebol moderno usa muito a estatística de "Gols Esperados" (xG).
- **Endpoint:** `event/{id}/shotmap`
- **Uso no OBS:** Um gráfico que aparece no intervalo do jogo ou ao final, mostrando quem teve a **melhor chance real** de marcar e o campo de ataque desenhado com pontinhos de onde ocorreram as finalizações (verdes = gol, vermelhos = fora, azuis = defesa).

## 4. 📈 Estatísticas Dinâmicas Puxadas Automáticas (Lower Third)
Hoje temos um banner estático de H2H ou de estatísticas simples (Posse, Passes, Finalizações). A API possui muitos mais detalhes como Desarmes, Faltas cometidas, e Duelos Ganhos.
- **Uso no OBS:** Um modo "Carrossel Analytics" que durante o jogo sobe pequenos alertas na parte de baixo (`Lower Third`), mostrando fatos gerados por máquina. Ex: *"Flamengo tem 70% de posse nos últimos 10 minutos"*.

## 5. 🚥 Histórico Recente (Form / W-D-L)
Aquelas bolinhas coloridas (🟢 Vitória, 🟡 Empate, 🔴 Derrota).
- **Uso no OBS:** No painel de H2H, antes da bola rolar, adicionar abaixo de cada time uma prateleira com as 5 bolinhas dos últimos 5 jogos da equipe (fornecido em arrays na própria API de teams).

## 6. ⏱️ Momentum (Gráfico de Pressão Atual)
O SofaScore possui um recurso famoso chamado *Attack Momentum* que mede qual time está massacrando o outro naquele exato minuto.
- **Endpoint:** `event/{id}/graph`
- **Uso no OBS:** Mostrar um mini gráfico pulsante abaixo do placar, com barras verdes para o time da casa ou vermelhas para visitante. Útil demais se o jogo estiver "lá e cá", entregando valor para quem assiste a live sem necessariamente estar vendo o campo de futebol.

## 7. 🏟️ Árbitro e Informações de Estádio
- Os detalhes da partida trazem dados da capacidade de público do estádio e a nacionalidade/nome do árbitro principal (`event.referee.name`).
- **Uso no OBS:** Painel inicial do Pré-jogo com um design de "Bola Rolando" destacando Estádio, Arbitragem e Competição antes do timer de jogo começar.

---

## 🔥 **[NOVO] Mais Possibilidades com a API SofaScore**

## 8. 📊 Gráfico de Probabilidade de Vitória (Win Probability)
A API avalia em tempo real, baseada nas odds e andamento do jogo, qual a chance de cada time vencer.
- **Endpoint:** `event/{id}/win-probability`
- **Uso no OBS:** Uma barra preenchível (ex: 60% Azul, 40% Vermelho) que flutua durante o jogo, balançando de um lado para o outro conforme gols e minutos vão alterando a matemática do favoritismo.

## 9. 🎙️ Lance a Lance Automático (Text Commentary)
O SofaScore possui comentários em texto minuto a minuto da partida. 
- **Endpoint:** `event/{id}/comments` (ou incidentes detalhados)
- **Uso no OBS:** Uma coluna lateral estilo "Twitter" ou um rodapé tipo notícia local que rola informações cruciais textuais (ex: *"24' O chute de fora da área passou raspando a trave!"*) sem precisar de locutor.

## 10. 🏥 Desfalques e Lesionados (Missing Players)
Geralmente exposto dentro dos dados de `lineups` ou detalhes da partida (como a famigerada "Cruz Vermelha" nas listas).
- **Uso no OBS:** Antes de começar o jogo, chamar na tela um painel "Quem está fora", mostrando de imediato os craques suspensos ou machucados que não foram para o jogo hoje.

## 11. 🧠 Curiosidades e Tabus (Match Insights)
O SofaScore fornece um endpoint inteiro dedicado a gerar automaticamente frases de contexto (ex: *"Time A não perde do Time B há 8 jogos"*, ou *"Time C sofre gols primeiro há 5 rodadas seguidas"*).
- **Endpoint:** `event/{id}/h2h/events` (geralmente sob a tag de *insights* ou *streaks*)
- **Uso no OBS:** Um popup ("Você Sabia?") minimalista que surge na tela em momentos de pouca ação no jogo.

## 12. 📍 Posição Média Real (Heatmap de Posição Média)
Diferente da tática do papel (o "4-3-3" planejado antes do jogo), o SofaScore gera também o *Average Positions*, calculando o GPS médio real em campo.
- **Endpoint:** `event/{id}/average-positions`
- **Uso no OBS:** Ideal para ser mostrado no Intervalo (Half-time), comparando a "Prancheta Desejada" vs a "Onde os jogadores de fato estão jogando".

## 13. 🎲 Roleta de Pênaltis Imersiva (Penalty Shootout Screen)
Temos as "bolinhas" de pênalti no placar hoje, mas a API informa *quem* bateu, *se converteu*, e o *placar* em arrays dedicados.
- **Uso no OBS:** Nos torneios mata-mata (Série C, D, ou Copas), quando for pros Pênaltis, uma tela cheia 100% de overlay escuro, revelando lado a lado as fotos dos goleiros e o rosto de cada jogador que vai pra bola com a indicação ❌ ou ✅ gigante.

---

### Quer implementar alguma dessas lógicas?
Os sistemas de overlay do PlacarFut reagem à DOM, portanto, se você se interessar por uma ou mais funcionalidades acima (ex: **Fotos de jogadores para os Gols** ou **Gráfico de Momentum**), podemos montar os designs no Tailwind e mapear imediatamente no `broadcast.js`.
