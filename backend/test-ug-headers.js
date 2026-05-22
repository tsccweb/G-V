const axios = require('axios');
const cheerio = require('cheerio');

async function searchSong(title) {
    try {
        const url = `https://www.ultimate-guitar.com/search.php?title=${encodeURI(title)}&view_state=advanced&type=300`;
        console.log('Fetching:', url);
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });

        const $ = cheerio.load(response.data);
        const storeData = $("div[class='js-store']").attr("data-content");
        
        if (!storeData) {
            console.log('No js-store data-content found');
            return null;
        }

        const result = JSON.parse(storeData);
        const results = result.store.page.data.results;
        
        console.log('Found', results.length, 'results');
        return results;
    } catch (error) {
        console.error('Error:', error.response ? error.response.status : error.message);
        return null;
    }
}

searchSong('Oceans Hillsong').then(results => {
    if (results && results.length > 0) {
        console.log('First result:', JSON.stringify(results[0], null, 2));
    }
});
