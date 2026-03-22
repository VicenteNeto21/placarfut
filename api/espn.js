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

        res.setHeader("Access-Control-Allow-Origin", "*");
        res.status(200).json(data);

    } catch (error) {
        res.status(500).json({ error: "Erro ESPN" });
    }
};
