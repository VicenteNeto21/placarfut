module.exports = async function handler(req, res) {
    // Configuração de CORS – permite qualquer origem (ajuste para produção)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Responde pré‑flight (OPTIONS)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Apenas GET
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    // Extrai o endpoint da SofaScore a partir da query string
    const { path } = req.query;
    if (!path) {
        return res.status(400).json({ error: 'Parâmetro "path" é obrigatório' });
    }

    // Segurança: Validar que o path começa com prefixos esperados
    const allowedPrefixes = [
        'event/', 'team/', 'sport/', 'unique-tournament/',
        'category/', 'player/', 'manager/'
    ];
    if (!allowedPrefixes.some(p => path.startsWith(p))) {
        return res.status(400).json({ error: 'Path não permitido' });
    }

    const baseUrls = [
        'https://www.sofascore.com/api/v1',
        'https://api.sofascore.app/api/v1',
        'https://api.sofascore.com/api/v1'
    ];

    const requestHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Referer': 'https://www.sofascore.com/',
        'Origin': 'https://www.sofascore.com'
    };

    // Detecta se o path é de imagem (team/ID/image, player/ID/image, unique-tournament/ID/image)
    const isImageRequest = /\/image(\/|$)/.test(path);

    try {
        let lastError = null;
        for (const baseUrl of baseUrls) {
            const targetUrl = `${baseUrl}/${path}`;
            try {
                const response = await fetch(targetUrl, {
                    headers: requestHeaders
                });
                if (!response.ok) {
                    lastError = new Error(`HTTP ${response.status} em ${baseUrl}`);
                    continue;
                }

                const contentType = response.headers.get('content-type') || '';

                // Resposta binária (imagens, SVG)
                if (isImageRequest || contentType.includes('image') || contentType.includes('svg')) {
                    const buffer = await response.arrayBuffer();
                    res.setHeader('Content-Type', contentType || 'image/png');
                    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=3600');
                    res.status(200).end(Buffer.from(buffer));
                    return;
                }

                // Resposta JSON (dados de eventos, estatísticas, etc.)
                res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
                const data = await response.json();
                res.status(200).json(data);
                return;
            } catch (error) {
                lastError = error;
            }
        }
        throw lastError || new Error('Nenhum endpoint da SofaScore respondeu com sucesso');
    } catch (error) {
        console.error('Erro no proxy:', error);
        res.status(500).json({ error: 'Falha ao buscar dados da SofaScore', details: error.message });
    }
};
