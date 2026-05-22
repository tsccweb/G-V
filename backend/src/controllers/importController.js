const axios = require('axios');
const cheerio = require('cheerio');
const pdf = require('pdf-parse');

const BROWSER_HEADERS = {
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

exports.searchOnline = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Search query required' });

  try {
    // Search Ultimate Guitar via DuckDuckGo
    const searchUrl = `https://html.duckduckgo.com/html/?q=site:ultimate-guitar.com+${encodeURIComponent(q)}+chords`;
    const { data } = await axios.get(searchUrl, { headers: BROWSER_HEADERS });
    const $ = cheerio.load(data);
    
    const results = [];
    $('.result__body').each((i, el) => {
      const title = $(el).find('.result__title a').text().trim();
      const url = $(el).find('.result__title a').attr('href');
      const snippet = $(el).find('.result__snippet').text().trim();
      
      // DuckDuckGo results go through a redirector, we need to extract the real URL if possible
      // or just use the link as is if it works.
      if (url && url.includes('tabs.ultimate-guitar.com')) {
        results.push({
          title: title.replace(' | Ultimate-Guitar.Com', '').replace(' Chords', ''),
          url: url,
          snippet: snippet,
          source: 'Ultimate Guitar'
        });
      }
    });

    res.json(results);
  } catch (error) {
    console.error('Search Error:', error.message);
    res.status(500).json({ error: 'Failed to search online.' });
  }
};

exports.importSong = async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });

  try {
    const { data } = await axios.get(url, { headers: BROWSER_HEADERS });
    const $ = cheerio.load(data);
    
    let songData = {
      title: '',
      artist: '',
      lyrics: '',
      chords: '',
      sourceUrl: url
    };

    if (url.includes('ultimate-guitar.com')) {
      const storeData = $("div[class='js-store']").attr("data-content");
      if (storeData) {
        try {
          const json = JSON.parse(storeData);
          const tabData = json.store.page.data.tab;
          songData.title = tabData.song_name;
          songData.artist = tabData.artist_name;
          songData.lyrics = json.store.page.data.tab_view.wiki_tab.content || '';
          songData.key = tabData.tonality_name || '';
        } catch (parseError) {
          console.error('[Import] Failed to parse UG store data:', parseError.message);
        }
      }
    } else if (url.includes('songsterr.com')) {
      // Find window.STATE or similar
      const scripts = $('script');
      scripts.each((i, el) => {
        const content = $(el).html();
        if (content.includes('window.STATE')) {
          const jsonMatch = content.match(/window\.STATE\s*=\s*(.*?);/);
          if (jsonMatch) {
            try {
              const state = JSON.parse(jsonMatch[1]);
              songData.title = state.song.title;
              songData.artist = state.song.artist;
            } catch (e) {
              console.error('[Import] Failed to parse Songsterr state:', e.message);
            }
          }
        }
      });
    }

    // Generic Fallback if specific parsers failed to get lyrics
    if (!songData.lyrics) {
      songData.title = songData.title || $('h1').first().text().trim() || 'Untitled Song';
      songData.artist = songData.artist || $('.artist').first().text().trim() || 'Unknown Artist';
      
      // Look for pre or specific containers
      const content = $('pre, .lyrics, .chords, .tab-content').first().text().trim();
      songData.lyrics = content || 'No content found';
    }

    res.json(songData);
  } catch (error) {
    console.error('Import Error:', error.message);
    const status = error.response?.status || 500;
    const message = status === 403 ? 'This site is blocking automated imports. Please try copying the lyrics manually.' : 
                    status === 429 ? 'Too many requests. Please wait a moment and try again.' :
                    'Failed to import song from URL. Please ensure it\'s a valid Ultimate Guitar or Songsterr link.';
    
    res.status(status).json({ error: message, details: error.message });
  }
};

exports.importPdf = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded.' });

  try {
    const data = await pdf(req.file.buffer);
    const text = data.text;

    // Split into lines to extract title/artist
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let songData = {
      title: lines[0] || 'Unknown Title',
      artist: lines[1] || 'Unknown Artist',
      lyrics: text,
      chords: '',
      key: '',
      category: 'Imported'
    };

    // Try to clean up artist name (UG often has "Song name by Artist" or similar)
    if (songData.title.toLowerCase().includes('by ')) {
      const parts = songData.title.split(/ by /i);
      songData.title = parts[0].trim();
      songData.artist = parts[1].trim();
    }

    res.json(songData);
  } catch (error) {
    console.error('PDF Import Error:', error.message);
    res.status(500).json({ error: 'Failed to parse PDF content. Please ensure it is a valid text-based PDF.' });
  }
};
