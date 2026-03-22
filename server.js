const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8080;

// Tipos MIME para servir arquivos estáticos
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

// ========== PROXY SOFASCORE ==========
async function handleSofaScore(req, res) {
    const parsed = url.parse(req.url, true);
    const sofaPath = parsed.query.path;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (!sofaPath) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Parâmetro "path" é obrigatório' }));
        return;
    }

    const targetUrl = `https://api.sofascore.com/api/v1/${sofaPath}`;
    console.log(`[PROXY] SofaScore → ${targetUrl}`);

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

        const contentType = response.headers.get('content-type');
        
        if (contentType && (contentType.includes('image') || contentType.includes('svg'))) {
            const buffer = await response.arrayBuffer();
            res.writeHead(response.status, { 
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400'
            });
            res.end(Buffer.from(buffer));
            return;
        }

        const data = await response.json().catch(() => ({}));
        res.writeHead(response.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
        console.log(`[PROXY] ${response.ok ? 'SUCCESS' : 'WARN'} SofaScore ${response.status} (${sofaPath})`);
    } catch (error) {
        console.error(`[PROXY] ERROR SofaScore:`, error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Falha ao buscar dados da SofaScore', details: error.message }));
    }
}

// ========== PROXY ESPN ==========
async function handleESPN(req, res) {
    const parsed = url.parse(req.url, true);
    const liga = parsed.query.liga || 'bra.1';

    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/${liga}/scoreboard`;
        console.log(`[PROXY] ESPN → ${espnUrl}`);

        const response = await fetch(espnUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const data = await response.json();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
        console.log(`[PROXY] SUCCESS ESPN OK (${liga})`);
    } catch (error) {
        console.error(`[PROXY] ERROR ESPN:`, error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Erro ESPN' }));
    }
}

// ========== SERVIR ARQUIVOS ESTÁTICOS ==========
function serveStatic(req, res) {
    const parsed = url.parse(req.url, true);
    let filePath = path.join(__dirname, parsed.pathname === '/' ? 'index.html' : parsed.pathname);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 - Arquivo não encontrado');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Erro interno do servidor');
            }
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
}

// ========== SERVIDOR HTTP ==========
const server = http.createServer((req, res) => {
    const parsed = url.parse(req.url, true);

    // Rotas de API
    if (parsed.pathname === '/api/sofascore') {
        return handleSofaScore(req, res);
    }
    if (parsed.pathname === '/api/espn') {
        return handleESPN(req, res);
    }

    // Arquivos estáticos
    serveStatic(req, res);
});

server.listen(PORT, () => {
    console.log('');
    console.log('  [APP] PlacarFut Dev Server');
    console.log('  ─────────────────────────────');
    console.log(`  Local:   http://localhost:${PORT}`);
    console.log('');
    console.log('  Rotas disponíveis:');
    console.log('    GET /                → index.html');
    console.log('    GET /api/sofascore   → Proxy SofaScore');
    console.log('    GET /api/espn        → Proxy ESPN');
    console.log('');
    console.log('  Aguardando requisições...');
    console.log('');
});
