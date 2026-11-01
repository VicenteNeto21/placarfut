// ========== api/flashscore-parser.js ==========
// Parser para o formato proprietário da Livesport/Flashscore Ninja
// Transforma feeds de texto delimitado em JSON compatível com o PlacarFut

const FLASHSCORE_CDN_IMG = 'https://static.flashscore.com/res/image/data';

// Mapeamento de ligas conhecidas para IDs fixos do PlacarFut (SofaScore / OBS Themes)
const FLASHSCORE_KNOWN_LEAGUES = {
    'BRAZIL: SERIE A': { id: 325, name: 'Brasileirão Série A' },
    'BRAZIL: SERIE B': { id: 390, name: 'Brasileirão Série B' },
    'BRAZIL: SERIE C': { id: 1281, name: 'Brasileirão Série C' },
    'BRAZIL: SERIE D': { id: 10326, name: 'Brasileirão Série D' },
    'BRAZIL: COPA DO BRASIL': { id: 373, name: 'Copa do Brasil' },
    'BRAZIL: COPA DO NORDESTE': { id: 1596, name: 'Copa do Nordeste' },
    'BRAZIL: COPA VERDE': { id: 10158, name: 'Copa Verde' },
    'SOUTH AMERICA: COPA LIBERTADORES': { id: 384, name: 'Copa Libertadores' },
    'SOUTH AMERICA: COPA SUDAMERICANA': { id: 480, name: 'Copa Sul-Americana' },
    'SOUTH AMERICA: RECOPA SUDAMERICANA': { id: 490, name: 'Recopa Sul-Americana' },
    'ENGLAND: PREMIER LEAGUE': { id: 17, name: 'Premier League' },
    'SPAIN: LALIGA': { id: 8, name: 'La Liga' },
    'GERMANY: BUNDESLIGA': { id: 35, name: 'Bundesliga' },
    'ITALY: SERIE A': { id: 23, name: 'Serie A (Itália)' },
    'FRANCE: LIGUE 1': { id: 34, name: 'Ligue 1' },
    'EUROPE: CHAMPIONS LEAGUE': { id: 7, name: 'Champions League' },
    'WORLD: WORLD CUP': { id: 16, name: 'Copa do Mundo' }
};

/**
 * Converte status numérico do Flashscore para o padrão SofaScore
 * @param {string|number} code 
 * @param {string} minute 
 */
function mapFlashscoreStatus(code, minute = '') {
    const c = parseInt(code, 10);
    switch (c) {
        case 1:
            return { code: 0, type: 'notstarted', description: 'Not started' };
        case 2:
        case 6:
        case 12:
            return { code: 6, type: 'inprogress', description: minute ? `${minute}'` : '1st half' };
        case 7:
        case 13:
            return { code: 7, type: 'inprogress', description: minute ? `${minute}'` : '2nd half' };
        case 31:
        case 38:
            return { code: 31, type: 'inprogress', description: 'Halftime' };
        case 4:
            return { code: 100, type: 'inprogress', description: 'Extra time' };
        case 5:
            return { code: 120, type: 'inprogress', description: 'Penalties' };
        case 3:
        case 11:
            return { code: 100, type: 'finished', description: 'Ended' };
        case 60:
            return { code: 60, type: 'postponed', description: 'Postponed' };
        case 70:
            return { code: 70, type: 'canceled', description: 'Canceled' };
        default:
            return { code: 0, type: 'notstarted', description: 'Not started' };
    }
}

/**
 * Converte string para hash numérico positivo estável (para IDs de times/torneios)
 */
function stringToNumericId(str) {
    if (!str) return 0;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

/**
 * Converte bloco de chave÷valor¬ em objeto Javascript
 */
function parseKeyValueBlock(block) {
    const result = {};
    if (!block) return result;
    const items = block.split('¬');
    for (const item of items) {
        const sepIndex = item.indexOf('÷');
        if (sepIndex !== -1) {
            const key = item.substring(0, sepIndex);
            const val = item.substring(sepIndex + 1);
            result[key] = val;
        }
    }
    return result;
}

/**
 * Faz o parse completo do feed f_1_X_3_pt-br_1
 * @param {string} feedText 
 * @returns {Array<Object>} Lista de eventos formatados
 */
function parseFlashscoreFeed(feedText) {
    if (!feedText || typeof feedText !== 'string') return [];

    const events = [];
    const sections = feedText.split('~');
    let currentTournament = null;

    for (const section of sections) {
        if (!section) continue;

        // Seção de Torneio (~ZA÷)
        if (section.startsWith('ZA÷')) {
            const block = parseKeyValueBlock(section);
            const rawName = block['ZA'] || '';
            const country = block['ZY'] || '';
            const logoFile = block['OAJ'] || '';
            const tournamentKey = block['ZEE'] || rawName;

            const normalizedKey = rawName.toUpperCase().trim();
            const known = FLASHSCORE_KNOWN_LEAGUES[normalizedKey];

            const tournamentId = known ? known.id : stringToNumericId(tournamentKey);
            const tournamentName = known
                ? known.name
                : (rawName.includes(':') ? rawName.split(':')[1].trim() : rawName);

            currentTournament = {
                id: tournamentId,
                name: tournamentName,
                fullName: rawName,
                country,
                logo: logoFile ? `${FLASHSCORE_CDN_IMG}/${logoFile}` : '',
                uniqueTournament: {
                    id: tournamentId,
                    name: tournamentName
                }
            };
            continue;
        }

        // Seção de Partida (~AA÷)
        if (section.startsWith('AA÷') && currentTournament) {
            const block = parseKeyValueBlock(section);
            const matchId = block['AA'];
            if (!matchId) continue;

            const homeName = block['AE'] || 'Casa';
            const awayName = block['AF'] || 'Fora';
            const homeShort = block['WM'] || homeName.substring(0, 3).toUpperCase();
            const awayShort = block['WN'] || awayName.substring(0, 3).toUpperCase();
            const homeLogo = block['OA'] ? `${FLASHSCORE_CDN_IMG}/${block['OA']}` : '';
            const awayLogo = block['OB'] ? `${FLASHSCORE_CDN_IMG}/${block['OB']}` : '';

            const startTimestamp = parseInt(block['AD'], 10) || 0;
            const periodStartTimestamp = parseInt(block['AO'], 10) || 0;
            const statusCode = block['AC'] || '1';
            const liveMin = block['BX'] && block['BX'] !== '-1' ? block['BX'].trim() : '';
            const status = mapFlashscoreStatus(statusCode, liveMin);

            const homeScoreRaw = block['AG'];
            const awayScoreRaw = block['AH'];
            const isStarted = status.type !== 'notstarted';

            let timeInfo = {};
            let statusTime = undefined;
            if (status.type === 'inprogress') {
                const nowSec = Math.floor(Date.now() / 1000);
                let currentMin = 1;
                // AO é o timestamp exato de quando o tempo atual começou (1T ou 2T)
                const refTimestamp = periodStartTimestamp > 0 ? periodStartTimestamp : startTimestamp;

                if (liveMin) {
                    currentMin = parseInt(liveMin, 10) || 1;
                } else if (refTimestamp > 0) {
                    const elapsed = Math.max(0, nowSec - refTimestamp);
                    const elapsedMin = Math.floor(elapsed / 60);

                    if (status.code === 6) { // 1º tempo
                        currentMin = Math.max(1, elapsedMin);
                    } else if (status.code === 7) { // 2º tempo
                        if (periodStartTimestamp > 0) {
                            currentMin = 45 + elapsedMin;
                        } else {
                            currentMin = 45 + Math.max(1, elapsedMin - 60);
                        }
                    } else if (status.code === 31) { // Intervalo
                        currentMin = 45;
                    } else {
                        currentMin = elapsedMin;
                    }
                }

                timeInfo = {
                    currentPeriodStartTimestamp: refTimestamp,
                    period: status.code === 7 ? 2 : 1,
                    minute: currentMin
                };
                statusTime = { current: currentMin };
                status.description = `${currentMin}'`;
            }

            const roundName = block['ER'] || '';

            events.push({
                id: matchId,
                numericId: stringToNumericId(matchId),
                startTimestamp,
                status,
                statusTime,
                time: timeInfo,
                tournament: currentTournament,
                homeTeam: {
                    id: stringToNumericId(homeName),
                    name: homeName,
                    shortName: homeShort,
                    logo: homeLogo,
                    _espnLogo: homeLogo
                },
                awayTeam: {
                    id: stringToNumericId(awayName),
                    name: awayName,
                    shortName: awayShort,
                    logo: awayLogo,
                    _espnLogo: awayLogo
                },
                homeScore: {
                    current: isStarted ? (parseInt(homeScoreRaw, 10) || 0) : null,
                    period1: block['BA'] ? parseInt(block['BA'], 10) : undefined,
                    period2: block['BC'] ? parseInt(block['BC'], 10) : undefined,
                    penalties: block['AP'] ? parseInt(block['AP'], 10) : undefined
                },
                awayScore: {
                    current: isStarted ? (parseInt(awayScoreRaw, 10) || 0) : null,
                    period1: block['BB'] ? parseInt(block['BB'], 10) : undefined,
                    period2: block['BD'] ? parseInt(block['BD'], 10) : undefined,
                    penalties: block['AQ'] ? parseInt(block['AQ'], 10) : undefined
                },
                roundInfo: roundName ? { name: roundName } : undefined,
                _source: 'flashscore'
            });
        }
    }

    return events;
}

/**
 * Converte feed de estatísticas (df_st_1_ID) em lista compatível com SofaScore statistics
 * @param {string} statsFeedText 
 */
function parseFlashscoreStats(statsFeedText) {
    if (!statsFeedText || typeof statsFeedText !== 'string') return [];
    
    const items = [];
    const parts = statsFeedText.split('~');

    for (const part of parts) {
        if (!part) continue;
        const block = parseKeyValueBlock(part);
        const name = block['SG'];
        const homeVal = block['SH'];
        const awayVal = block['SI'];

        if (name && homeVal !== undefined && awayVal !== undefined) {
            items.push({
                name,
                home: homeVal.includes('%') ? homeVal : parseInt(homeVal, 10) || 0,
                away: awayVal.includes('%') ? awayVal : parseInt(awayVal, 10) || 0,
                compareCode: 1
            });
        }
    }

    if (items.length === 0) return [];

    return [{
        period: 'ALL',
        groups: [{
            groupName: 'Match overview',
            statisticsItems: items
        }]
    }];
}

module.exports = {
    parseFlashscoreFeed,
    parseFlashscoreStats,
    mapFlashscoreStatus,
    stringToNumericId
};
