const axios = require('axios');
const cheerio = require('cheerio');

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.google.com/',
};

async function testSearch(q) {
  try {
    const searchUrl = `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(q)}`;
    console.log('Searching Direct UG:', searchUrl);
    const { data } = await axios.get(searchUrl, { headers: BROWSER_HEADERS });
    const fs = require('fs');
    fs.writeFileSync('search-output-ug.html', data);
    console.log('HTML written to search-output-ug.html');
    const $ = cheerio.load(data);
    
    // UG search results are in js-store too sometimes
    const storeData = $("div[class='js-store']").attr("data-content");
    if (storeData) {
      const json = JSON.parse(storeData);
      const results = json.store.page.data.results;
      console.log('Direct UG Results found:', results?.length || 0);
      console.log(JSON.stringify(results?.slice(0, 2), null, 2));
    } else {
      console.log('No js-store found in direct UG search.');
    }

    console.log('Results found:', results.length);
    console.log(JSON.stringify(results.slice(0, 2), null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  }
}

testSearch('still');
