export default async function handler(req, res) {
  const { tmdb, season, episode } = req.query;

  const providers = [
    {
      name: "VidLink",
      url: episode 
        ? `https://api.vidlink.pro/api/decode/tv/${tmdb}/${season}/${episode}`
        : `https://api.vidlink.pro/api/decode/movie/${tmdb}`
    },
    {
      name: "VidSrc.icu",
      url: episode
        ? `https://vidsrc.icu/api/source/tv/${tmdb}/${season}/${episode}`
        : `https://vidsrc.icu/api/source/movie/${tmdb}`
    },
    {
      name: "Vidsrc.cc",
      url: episode
        ? `https://vidsrc.cc/api/source/tv/${tmdb}/${season}/${episode}`
        : `https://vidsrc.cc/api/source/movie/${tmdb}`
    }
  ];

  for (const provider of providers) {
    try {
      const response = await fetch(provider.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Referer': 'https://google.com'
        },
        signal: AbortSignal.timeout(6000) 
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

  return res.status(404).json({ error: "All sources offline." });
}
