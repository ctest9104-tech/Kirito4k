export default async function handler(req, res) {
  const { tmdb, season, episode } = req.query;

  // Active 2026 High-Uptime Extractor Endpoints
  const extractors = [
    {
      name: "Cinextma-Alpha",
      url: episode 
        ? `https://api.vidlink.pro/api/decode/tv/${tmdb}/${season}/${episode}`
        : `https://api.vidlink.pro/api/decode/movie/${tmdb}`
    },
    {
      name: "Mirror-V2",
      url: episode
        ? `https://vidsrc.icu/api/source/tv/${tmdb}/${season}/${episode}`
        : `https://vidsrc.icu/api/source/movie/${tmdb}`
    },
    {
      name: "Auto-Stream",
      url: episode
        ? `https://player.autoembed.cc/api/getSource?type=tv&id=${tmdb}&s=${season}&e=${episode}`
        : `https://player.autoembed.cc/api/getSource?type=movie&id=${tmdb}`
    }
  ];

  for (const bot of extractors) {
    try {
      const response = await fetch(bot.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/123.0.0.0',
          'Referer': 'https://google.com'
        },
        signal: AbortSignal.timeout(6000) 
      });

      if (!response.ok) continue;

      const data = await response.json();
      const stream = data?.url || data?.data?.stream_url || data?.source;

      if (stream) {
        return res.status(200).json({ url: stream, provider: bot.name });
      }
    } catch (e) { continue; }
  }

  return res.status(404).json({ error: "All servers currently unreachable." });
}
