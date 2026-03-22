// ========== js/api.js ==========
// Comunicação Centralizada com a API

async function fetchSofaScore(endpoint) {
    const url = `${BACKEND_URL}?path=${encodeURIComponent(endpoint)}&_t=${Date.now()}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Erro no proxy:', error);
        throw error;
    }
}
