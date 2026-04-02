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

### Quer implementar alguma dessas lógicas?
Os sistemas de overlay do PlacarFut reagem à DOM, portanto, se você se interessar por uma ou mais funcionalidades acima (ex: **Fotos de jogadores para os Gols** ou **Gráfico de Momentum**), podemos montar os designs no Tailwind e mapear imediatamente no `broadcast.js`.
