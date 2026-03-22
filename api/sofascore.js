export default async function handler(req, res) {
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
    // Exemplo: /api/sofascore?path=sport/football/events/live
    const { path } = req.query;
    if (!path) {
        return res.status(400).json({ error: 'Parâmetro "path" é obrigatório' });
    }

    // Monta a URL alvo
    const targetUrl = `https://api.sofascore.com/api/v1/${path}`;

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
                'Referer': 'https://www.sofascore.com/',
                'Origin': 'https://www.sofascore.com'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('Erro no proxy:', error);
        res.status(500).json({ error: 'Falha ao buscar dados da SofaScore', details: error.message });
    }
}