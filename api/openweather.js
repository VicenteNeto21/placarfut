module.exports = async function handler(req, res) {
    // CORS restrito — mesma lógica do sofascore.js
    const allowedOrigins = ['https://placarfut.vercel.app', 'http://localhost:8080', 'http://localhost:3000'];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Responde pré-flight (OPTIONS)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Apenas GET
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    // Chave da API — via variável de ambiente (Vercel) ou hardcoded para dev
    const API_KEY = process.env.OPENWEATHER_KEY || 'd8a712318e5df5a5b810e508669eed61';

    const { cidade, lat, lon } = req.query;

    if (!cidade && (!lat || !lon)) {
        return res.status(400).json({ error: 'Informe "cidade" ou "lat" e "lon"' });
    }

    // Monta a URL: por coordenadas (mais preciso) ou por nome de cidade
    let targetUrl;
    if (lat && lon) {
        targetUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=pt_br`;
    } else {
        targetUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cidade)}&appid=${API_KEY}&units=metric&lang=pt_br`;
    }

    console.log(`[PROXY] OpenWeather → ${targetUrl.replace(API_KEY, '***')}`);

    try {
        const response = await fetch(targetUrl);
        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ error: data.message || 'Erro OpenWeather' });
        }

        // Cache de 10 minutos — clima não muda a cada segundo
        res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300');
        res.status(200).json(data);
    } catch (error) {
        console.error('[PROXY] ERROR OpenWeather:', error.message);
        res.status(500).json({ error: 'Falha ao buscar dados do clima', details: error.message });
    }
};
