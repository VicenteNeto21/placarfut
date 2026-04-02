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
function getScoreboardName(equipe) {
    if (!equipe) return '?';
    
    // Prioridade absoluta para a sigla de 3 letras (nameCode) para manter o layout limpo
    if (equipe.nameCode && equipe.nameCode.length <= 4) {
        return equipe.nameCode.toUpperCase();
    }
    
    // Fallback para shortName ou nome normal (traduzido se for seleção)
    const fallbackName = equipe.shortName || equipe.name || '?';
    return traduzirNomeEquipe(fallbackName).toUpperCase();
}

const H2H_TRANSLATIONS = {
    // Status
    'Expected': 'Previsto',
    'Postponed': 'Adiado',
    'Canceled': 'Cancelado',
    'Finished': 'Encerrado',
    'Ended': 'Encerrado',
    'In progress': 'Em andamento',
    'Not started': 'Não iniciado',
    'Halftime': 'Intervalo',
    'Awaiting updates': 'Aguardando atualizações',
    'LIVE': 'AO VIVO',
    'ROLANDO': 'AO VIVO',
    // Fases (para garantir que os H2H também traduzam, se necessário)
    'Round of 16': 'Oitavas de Final',
    'Round of 32': 'Dezesseis-avos de Final',
    'Round of 64': 'Trinta-e-dois-avos de Final',
    'Round of 128': 'Sessenta-e-quatro-avos de Final',
    'First leg': 'Ida',
    'Second leg': 'Volta',
    'Third place': 'Terceiro Lugar',
    'Qualification': 'Qualificação',
    'Pre-match': 'Pré-jogo',
};

function traduzirH2H(texto) {
    if (!texto) return '';
    let traduzido = texto;
    // Traduz primeiro usando o mapa do H2H
    Object.keys(H2H_TRANSLATIONS).forEach(key => {
        const regex = new RegExp(key, 'gi');
        traduzido = traduzido.replace(regex, H2H_TRANSLATIONS[key]);
    });
    // Passa também pelo mapa geral para garantir termos comuns como Round, Group, Quarter-finals, etc.
    traduzido = mapTraducoesCampeonato(traduzido);
    return traduzido;
}
