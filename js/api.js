// ========== js/api.js ==========
// Comunicação Centralizada com a API

async function fetchSofaScore(endpoint) {
    const url = `${BACKEND_URL}?path=${encodeURIComponent(endpoint)}&_t=${Date.now()}`;
    try {
        const response = await fetch(url, {
            headers: {
                'Accept-Language': 'pt-BR,pt;q=0.9'
            }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        throw error;
    }
}
