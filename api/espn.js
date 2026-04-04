module.exports = async function handler(req, res) {
    const liga = req.query.liga || "bra.1";

    try {
        const response = await fetch(
            `https://site.api.espn.com/apis/site/v2/sports/soccer/${liga}/scoreboard`,
            {
                headers: {
                    "User-Agent": "Mozilla/5.0"
                }
            }
        );

        const data = await response.json();

        // CORS restrito
        const allowedOrigins = ['https://placarfut.vercel.app', 'http://localhost:8080', 'http://localhost:3000'];
        const origin = req.headers.origin;
        if (allowedOrigins.includes(origin)) {
            res.setHeader("Access-Control-Allow-Origin", origin);
        }
        res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=60");
        res.status(200).json(data);

    } catch (error) {
        res.status(500).json({ error: "Erro ESPN" });
    }
};
