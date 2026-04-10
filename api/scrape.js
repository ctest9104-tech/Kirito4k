export default async function handler(req, res) {
  const { tmdb, season, episode } = req.query;

  // List of high-reliability JSON scrapers
  const sources = [
    episode 
      ? `https://api.vidlink.pro/api/decode/tv/${tmdb}/${season}/${episode}`
      : `https://api.vidlink.pro/api/decode/movie/${tmdb}`,
    episode
      ? `https://vidsrc.xyz/api/source/tv/${tmdb}/${season}/${episode}`
      : `https://vidsrc.xyz/api/source/movie/${tmdb}`
  ];

  for (const url of sources) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://vidlink.pro/'
        }
      });

      if (!response.ok) continue;

      const data = await response.json();
      // Try to find the stream link in common JSON keys
      const streamUrl = data?.url || data?.stream || data?.data?.stream_url;

      if (streamUrl) {
        return res.status(200).json({ url: streamUrl });
      }
    } catch (e) {
      console.error(`Source ${url} failed:`, e);
      continue; // Try the next source
    }
  }

  return res.status(404).json({ error: "All sources failed to provide a clean link." });
}
