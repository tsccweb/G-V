const axios = require('axios');

async function testSearch() {
  try {
    const res = await axios.get('https://www.ultimate-guitar.com/search.php?search_type=title&value=oceans+hillsong', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      maxRedirects: 5
    });
    const html = res.data;
    console.log('status:', res.status, 'length:', html.length);
    
    // Try data-content attribute
    const match = html.match(/data-content="([\s\S]*?)"/);
    if (match) {
      console.log('Found data-content!');
      const decoded = match[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
      console.log(decoded.substring(0, 500));
    }
    
    // Try js-store
    const storeMatch = html.match(/class="js-store" data-content="([\s\S]*?)"/);
    if (storeMatch) {
      console.log('Found js-store data!');
    }
    
    // Try UGAPP.store
    const appMatch = html.match(/window\.UGAPP\.store\.page\s*=\s*(\{[\s\S]*?\});/);
    if (appMatch) {
      console.log('Found UGAPP store!');
    }

    // Print a snippet of the HTML to see what we get
    console.log('\n--- HTML SNIPPET ---');
    console.log(html.substring(0, 1000));
  } catch (e) {
    console.log('ERR:', e.response?.status, e.message);
  }
}

testSearch();
