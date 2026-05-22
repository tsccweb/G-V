const axios = require('axios');
const cheerio = require('cheerio');

const url = 'https://www.songsterr.com/a/wsa/hillsong-united-oceans-where-feet-may-fail-chords-s386343';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Referer': 'https://www.google.com/',
  'DNT': '1',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'cross-site',
  'Sec-Fetch-User': '?1',
  'Cache-Control': 'no-cache',
};

async function test() {
  try {
    // Extract ID from URL
    const idMatch = url.match(/-(\d+)$/);
    if (!idMatch) {
      console.log('Could not extract ID from URL');
      return;
    }
    const songId = idMatch[1];
    const printUrl = `https://tabs.ultimate-guitar.com/tab/print?flavour=lp&id=${songId}`;
    
    console.log(`Fetching Print Version: ${printUrl}...`);
    const resp = await axios.get(printUrl, { headers });
    console.log(`Status: ${resp.status}`);
    
    if (resp.data.includes('js-store')) {
       console.log('Success! Found js-store data in print version.');
    } else {
       console.log('Body length:', resp.data.length);
       if (resp.data.includes('window.UGAPP')) {
         console.log('Success! Found window.UGAPP data.');
       } else {
         console.log('Snippet:', resp.data.substring(0, 1000));
       }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
