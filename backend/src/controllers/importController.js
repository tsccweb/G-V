const axios = require('axios');
const cheerio = require('cheerio');

exports.searchOnline = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Search query required' });

  try {
    // For MVP, we'll mock a search result or scrape a specific site.
    // Let's simulate a search across common worship sites.
    // In a real scenario, we'd use a search API or more complex scrapers.
    const results = [
      { id: '1', title: `${q} - Worthy of It All`, artist: 'CeCe Winans', source: 'WorshipChords' },
      { id: '2', title: `${q} - Way Maker`, artist: 'Leeland', source: 'WorshipTogether' }
    ];
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search online' });
  }
};

exports.importSong = async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    
    // Example scraping logic (specific to a site)
    const title = $('h1').first().text().trim() || 'Untitled Song';
    const artist = $('.artist').first().text().trim() || 'Unknown Artist';
    const lyrics = $('.lyrics, .chords').first().text().trim() || 'No content found';

    res.json({ title, artist, lyrics, sourceUrl: url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to import song from URL' });
  }
};
