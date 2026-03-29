// ========== js/utils.js ==========
// Funções auxiliares de lógica, datas e tratamentos isolados

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

/** Traduções EN → pt-BR para nomes de competições e fases (SofaScore / tickers). Frases mais longas primeiro. */
function mapTraducoesCampeonato(texto) {
    if (!texto) return '';
    const pairs = [
        ['UEFA Europa Conference League', 'Liga Conferência Europa'],
        ['UEFA Conference League', 'Liga Conferência Europa'],
        ['UEFA Champions League', 'Liga dos Campeões'],
        ['UEFA Europa League', 'Liga Europa'],
        ['Champions League', 'Liga dos Campeões'],
        ['Europa League', 'Liga Europa'],
        ['Conference League', 'Liga Conferência Europa'],

        ['Spanish La Liga', 'Campeonato Espanhol'],
        ['LaLiga', 'Campeonato Espanhol'],
        ['La Liga', 'Campeonato Espanhol'],
        ['Italian Serie A', 'Série A (Itália)'],
        ['Bundesliga', 'Campeonato Alemão'],
        ['Ligue 1', 'Campeonato Francês'],
        ['Ligue 2', 'Campeonato Francês — 2ª divisão'],
        ['EFL Cup', 'Copa da Liga Inglesa'],
        ['FA Cup', 'Copa da Inglaterra'],
        ['Int. Friendly Games', 'Amistosos Internacionais'],
        ['Club Friendly Games', 'Amistosos de Clubes'],
        ['Friendly Games', 'Amistosos'],
        ['World Cup', 'Copa do Mundo'],
        ['European Championship', 'Eurocopa'],
        ['Copa América', 'Copa América'],
        ['Copa America', 'Copa América'],
        ['Round of 16', 'Oitavas de final'],
        ['Quarter-finals', 'Quartas de final'],
        ['Quarter Finals', 'Quartas de final'],
        ['Semi-finals', 'Semifinais'],
        ['Semi Finals', 'Semifinais'],
        ['Knockout Round', 'Fase eliminatória'],
        ['Knockout round play-offs', 'Repescagem'],
        ['Play-offs', 'Mata-mata'],
        ['Playoffs', 'Mata-mata'],
        ['Qualifiers', 'Eliminatórias'],
        ['Group', 'Grupo'],
        ['Round', 'Rodada'],
        ['Final', 'Final']
    ];
    let s = String(texto);
    for (const [en, pt] of pairs) {
        const esc = en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        s = s.replace(new RegExp(esc, 'gi'), pt);
    }
    return s;
}

/** Nome do campeonato na UI: mapa fixo por ID (ui.js) ou tradução do nome da API. */
function nomeCampeonatoExibicao(tornId, nomeApi, fallback) {
    const id = tornId || 0;
    if (id && typeof NOMES_TORNEIOS_FIXOS !== 'undefined' && NOMES_TORNEIOS_FIXOS[id]) {
        return NOMES_TORNEIOS_FIXOS[id];
    }
    const n = (nomeApi || '').trim();
    if (n) return mapTraducoesCampeonato(n);
    return (fallback || '').trim() || 'Outros';
}

/** Tradução manual de nomes de equipes (especialmente seleções) EN -> pt-BR */
function traduzirNomeEquipe(nome) {
    if (!nome) return '';
    const n = nome.trim();
    const mapa = {
        'Hungary': 'Hungria',
        'Slovenia': 'Eslovênia',
        'Belgium': 'Bélgica',
        'Scotland': 'Escócia',
        'Japan': 'Japão',
        'South Korea': 'Coreia do Sul',
        'Cote d\'Ivoire': 'Costa do Marfim',
        'Côte d\'Ivoire': 'Costa do Marfim',
        'Canada': 'Canadá',
        'Iceland': 'Islândia',
        'Faroe Islands': 'Ilhas Faroé',
        'Tunisia': 'Tunísia',
        'Mexico': 'México',
        'Germany': 'Alemanha',
        'France': 'França',
        'Spain': 'Espanha',
        'Italy': 'Itália',
        'England': 'Inglaterra',
        'Netherlands': 'Holanda',
        'Uruguay': 'Uruguai',
        'Colombia': 'Colômbia',
        'Switzerland': 'Suíça',
        'Sweden': 'Suécia',
        'Norway': 'Noruega',
        'Denmark': 'Dinamarca',
        'Poland': 'Polônia',
        'Croatia': 'Croácia',
        'Serbia': 'Sérvia',
        'Turkey': 'Turquia',
        'Greece': 'Grécia',
        'Austria': 'Áustria',
        'Wales': 'País de Gales',
        'Ireland': 'Irlanda',
        'Northern Ireland': 'Irlanda do Norte',
        'South Africa': 'África do Sul',
        'Nigeria': 'Nigéria',
        'Egypt': 'Egito',
        'Morocco': 'Marrocos',
        'Algeria': 'Argélia',
        'Cameroon': 'Camarões',
        'Ghana': 'Gana',
        'USA': 'EUA',
        'United States': 'EUA',
        'Haiti': 'Haiti',
        'Senegal': 'Senegal',
        'Peru': 'Peru'
    };
    return mapa[n] || n;
}

/** Decide o melhor nome para exibir no placar (Overlay) - Sempre prioriza Sigla (3 letras) */
function getScoreboardName(equipe, torneio) {
    if (!equipe) return '?';
    
    // Prioridade absoluta para a sigla de 3 letras (nameCode) para manter o layout limpo
    // Fallback para shortName ou name apenas se a sigla não existir
    return equipe.nameCode || equipe.shortName || equipe.name || '?';
}
