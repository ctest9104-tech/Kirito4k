export default async function handler(req, res) {
  const { tmdb, season, episode } = req.query;

  try {
    // We use a public 'decoder' that returns raw JSON instead of an ad-filled iframe
    const target = episode 
      ? `https://api.vidlink.pro/api/decode/tv/${tmdb}/${season}/${episode}`
      : `https://api.vidlink.pro/api/decode/movie/${tmdb}`;

    const response = await fetch(target);
    const data = await response.json();

    // Look for the raw video stream (.m3u8)
    const streamUrl = data?.url || data?.stream;

    if (streamUrl) {
      return res.status(200).json({ url: streamUrl });
    }

    return res.status(404).json({ error: "No direct stream found." });
  } catch (error) {
    return res.status(500).json({ error: "Scraper failed." });
  }
}
