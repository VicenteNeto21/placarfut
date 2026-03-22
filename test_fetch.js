
async function test() {
    const targetUrl = 'https://api.sofascore.com/api/v1/team/3295/image';
    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Referer': 'https://www.sofascore.com/',
                'Origin': 'https://www.sofascore.com'
            }
        });
        console.log('Status:', response.status);
        console.log('Content-Type:', response.headers.get('content-type'));
    } catch (e) {
        console.error('Error:', e.message);
    }
}
test();
