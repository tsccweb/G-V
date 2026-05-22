const axios = require('axios');
const cheerio = require('cheerio');

// pdf-parse with robust loading
let pdfParser = null;

const initPdfParser = async () => {
  if (pdfParser) return pdfParser;
  
  try {
    console.log('[PDF-Init] Initializing pdf-parse module');
    const pdfModule = require('pdf-parse');
    
    // pdf-parse v2.4.5 exports parser as PDFParse in CJS mode
    if (typeof pdfModule === 'function') {
      console.log('[PDF-Init] Using module directly as function');
      pdfParser = pdfModule;
    } else if (pdfModule.PDFParse && typeof pdfModule.PDFParse === 'function') {
      console.log('[PDF-Init] Using pdfModule.PDFParse as function');
      pdfParser = pdfModule.PDFParse;
    } else if (pdfModule.default && typeof pdfModule.default === 'function') {
      console.log('[PDF-Init] Using module.default as function');
      pdfParser = pdfModule.default;
    } else {
      console.error('[PDF-Init] Module is not callable:', {
        type: typeof pdfModule,
        keys: Object.keys(pdfModule),
        defaultType: typeof pdfModule.default,
        pdfParseType: typeof pdfModule.PDFParse
      });
    }
    
    console.log('[PDF-Init] PDF parser initialized:', !!pdfParser);
    return pdfParser;
  } catch (e) {
    console.error('[PDF-Init] Failed to load pdf-parse:', {
      message: e.message,
      code: e.code,
      stack: e.stack
    });
    return null;
  }
};

// Initialize on module load
initPdfParser();

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

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
];

exports.searchOnline = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Search query required' });

  const randomUA = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

  try {
    // Attempt 1: DuckDuckGo Standard HTML
    const searchUrl = `https://duckduckgo.com/html/?q=site:ultimate-guitar.com+${encodeURIComponent(q)}+chords`;
    
    const { data } = await axios.get(searchUrl, { 
      headers: {
        'User-Agent': randomUA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://duckduckgo.com/',
        'DNT': '1',
      },
      timeout: 5000
    });

    // If blocked, data will contain the anomaly check
    if (data.includes('anomaly-modal') || data.includes('bots use DuckDuckGo too')) {
      console.warn('Search BLOCKED by DDG. Sending empty results.');
      return res.json([]);
    }

    const $ = cheerio.load(data);
    const results = [];
    $('.result__body').each((i, el) => {
      const title = $(el).find('.result__title a').text().trim();
      const url = $(el).find('.result__title a').attr('href');
      const snippet = $(el).find('.result__snippet').text().trim();
      
      if (url && url.toLowerCase().includes('ultimate-guitar.com')) {
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
    console.error('Search ERROR:', error.message);
    res.json([]); // Graceful fallback
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
    console.log('[PDF-Import] Starting PDF import, buffer size:', req.file.buffer?.length);
    
    // Ensure PDF parser is initialized
    const pdf = await initPdfParser();
    
    if (!pdf || typeof pdf !== 'function') {
      console.error('[PDF-Import] ERROR: PDF parser not available');
      return res.status(500).json({ error: 'PDF parsing service unavailable. Please try again.' });
    }

    console.log('[PDF-Import] Parsing PDF buffer...');
    let data;
    try {
      if (pdf.prototype && typeof pdf.prototype.getText === 'function') {
        const parserInstance = new pdf(req.file.buffer);
        data = await parserInstance.getText();
      } else {
        data = await pdf(req.file.buffer);
      }
      console.log('[PDF-Import] PDF parsed successfully, text length:', data.text?.length);
    } catch (parseErr) {
      console.error('[PDF-Import] Parsing error:', {
        message: parseErr.message,
        stack: parseErr.stack,
        bufferSize: req.file.buffer.length,
        parserType: typeof pdf,
        hasGetText: pdf?.prototype?.getText ? true : false
      });
      throw parseErr;
    }

    const text = data?.text;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'PDF contains no readable text. Please ensure it is a valid text-based PDF.' });
    }

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

    console.log('[PDF-Import] Success:', { title: songData.title, artist: songData.artist, lyricsLength: songData.lyrics.length });
    res.json(songData);
  } catch (error) {
    console.error('[PDF-Import] Unhandled error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ error: 'Failed to parse PDF content.', debug: error.message });
  }
};
