export default async function handler(req, res) {
  const { tmdb, season, episode } = req.query;

  // These are the top 3 high-uptime providers for April 2026
  const providers = [
    {
      name: "VidLink (Direct)",
      url: episode 
        ? `https://api.vidlink.pro/api/decode/tv/${tmdb}/${season}/${episode}`
        : `https://api.vidlink.pro/api/decode/movie/${tmdb}`
    },
    {
      name: "Vidsrc.icu (Mirror)",
      url: episode
        ? `https://vidsrc.icu/api/source/tv/${tmdb}/${season}/${episode}`
        : `https://vidsrc.icu/api/source/movie/${tmdb}`
    },
    {
      name: "AutoEmbed (Secondary)",
      url: episode
        ? `https://player.autoembed.cc/api/getSource?type=tv&id=${tmdb}&s=${season}&e=${episode}`
        : `https://player.autoembed.cc/api/getSource?type=movie&id=${tmdb}`
    }
  ];

  for (const provider of providers) {
    try {
      const response = await fetch(provider.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/123.0.0.0',
          'Referer': 'https://google.com'
        },
        signal: AbortSignal.timeout(5000) // Don't hang on a dead server
      });

      if (!response.ok) continue;

      const data = await response.json();
      const streamUrl = data?.url || data?.data?.stream_url || data?.source;

      if (streamUrl) {
        return res.status(200).json({ url: streamUrl, provider: provider.name });
      }
    } catch (e) {
      continue;
    }
  }

  return res.status(404).json({ error: "All providers are currently offline." });
}
