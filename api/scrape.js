export default async function handler(req, res) {
  const { tmdb, season, episode } = req.query;

  // Priority list of active 2026 providers
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
      name: "AutoEmbed",
      url: episode
        ? `https://player.autoembed.cc/api/getSource?type=tv&id=${tmdb}&s=${season}&e=${episode}`
        : `https://player.autoembed.cc/api/getSource?type=movie&id=${tmdb}`
    }
  ];

  for (const provider of providers) {
    try {
      const response = await fetch(provider.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Referer': 'https://google.com'
        },
        signal: AbortSignal.timeout(5000) // Don't wait more than 5s per provider
      });

      if (!response.ok) continue;

      const data = await response.json();
      // Extract stream URL based on common API structures
      const streamUrl = data?.url || data?.data?.stream_url || data?.source;

      if (streamUrl) {
        console.log(`Success using ${provider.name}`);
        return res.status(200).json({ url: streamUrl, provider: provider.name });
      }
    } catch (e) {
      console.error(`${provider.name} failed:`, e.message);
      continue;
    }
  }

  return res.status(404).json({ error: "All providers are currently unavailable." });
}
