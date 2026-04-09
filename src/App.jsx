import { useState, useEffect, useRef } from "react";

const TMDB_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzMTVjYWYzNjkxNTc1OGIwMDFlOTYwMzg5OWJlOTY3MCIsIm5iZiI6MTc3NTcxMjQyNy44MTksInN1YiI6IjY5ZDczOGFiNTIzNzlkODZhY2Q3NzE4YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ID34IJ0N4KSVI4UIziKBwiPR2NQlLAnblAxZC48GWS8";
const TMDB = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

const SERVERS = [
  { id: "vidsrc", name: "VidSrc (Best)", movieUrl: (id) => `https://vsrc.su/embed/movie?tmdb=${id}`, tvUrl: (id) => `https://vsrc.su/embed/tv?tmdb=${id}`, episodeUrl: (id, s, e) => `https://vsrc.su/embed/tv?tmdb=${id}&season=${s}&episode=${e}` },
  { id: "vidlink", name: "VidLink", movieUrl: (id) => `https://vidlink.pro/movie/${id}`, tvUrl: (id) => `https://vidlink.pro/tv/${id}`, episodeUrl: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}` },
];

const css = `
:root { --bg: #050508; --accent: #e50914; --surface: #111118; }
body { margin:0; background: var(--bg); color: #fff; font-family: sans-serif; overflow-x: hidden; }
.nav { height: 70px; display: flex; align-items: center; padding: 0 40px; background: #000; position: fixed; width: 100%; z-index: 100; border-bottom: 1px solid #222; }
.logo { font-size: 28px; font-weight: 900; color: var(--accent); cursor: pointer; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 20px; padding: 100px 40px; }
.card { cursor: pointer; transition: 0.2s; background: var(--surface); border-radius: 8px; overflow: hidden; }
.card:hover { transform: scale(1.03); }
.card img { width: 100%; aspect-ratio: 2/3; object-fit: cover; }
.detail-overlay { position: fixed; inset: 0; background: var(--bg); z-index: 200; overflow-y: auto; }
.hero { height: 45vh; background-size: cover; background-position: center; position: relative; }
.hero-grad { position: absolute; inset: 0; background: linear-gradient(to top, var(--bg), transparent); }
.ep-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px; padding: 20px 0; }
.ep-item { background: var(--surface); border-radius: 6px; cursor: pointer; border: 1px solid #222; }
.ep-item:hover { border-color: var(--accent); }
.player-screen { position: fixed; inset: 0; background: #000; z-index: 3000; }
.player-bar { position: absolute; top: 0; width: 100%; z-index: 4000; display: flex; justify-content: space-between; padding: 15px 25px; background: rgba(0,0,0,0.8); }
.srv-pill { background: #333; color: #fff; border: 1px solid #555; padding: 6px 12px; border-radius: 4px; font-size: 12px; }
.focus-alert { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); background: #22c55e; color: #000; padding: 8px 16px; border-radius: 20px; font-size: 11px; font-weight: bold; z-index: 4001; }
`;

function Player({ media, onClose }) {
  const [serverId, setServerId] = useState("vidsrc");
  const [isFightingAds, setIsFightingAds] = useState(false);
  const server = SERVERS.find(s => s.id === serverId);

  const url = media.episode 
    ? server.episodeUrl(media.tmdbId, media.season, media.episode)
    : (media.type === "movie" ? server.movieUrl(media.tmdbId) : server.tvUrl(media.tmdbId));

  // AGGRESSIVE REVERT LOGIC
  const startAdFight = () => {
    setIsFightingAds(true);
    // For the next 10 seconds, force focus back to this window every 500ms
    const interval = setInterval(() => {
      window.focus();
    }, 500);

    // Stop fighting after 10 seconds to save resources
    setTimeout(() => {
      clearInterval(interval);
      setIsFightingAds(false);
    }, 10000);
  };

  useEffect(() => {
    const killPopups = () => { 
      window.open = () => null;
      startAdFight(); // Every time the player is clicked, start the focus fight
    };
    window.addEventListener("click", killPopups);
    return () => window.removeEventListener("click", killPopups);
  }, []);

  return (
    <div className="player-screen">
      <div className="player-bar">
        <select className="srv-pill" value={serverId} onChange={(e) => setServerId(e.target.value)}>
          {SERVERS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button onClick={onClose} style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "8px 20px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>CLOSE</button>
      </div>

      {isFightingAds && <div className="focus-alert">🛡️ AGGRESSIVE REVERT ACTIVE: SNAPPING FOCUS BACK</div>}

      <iframe 
        key={serverId}
        src={url} 
        style={{ width: "100%", height: "100%", border: "none" }} 
        allowFullScreen 
      />
    </div>
  );
}

export default function Kirito4K() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [play, setPlay] = useState(null);

  useEffect(() => {
    fetch(`${TMDB}/trending/all/day`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } })
      .then(r => r.json()).then(d => setItems(d.results || []));
  }, []);

  useEffect(() => {
    if (selected && (selected.media_type === "tv" || !selected.title)) {
      fetch(`${TMDB}/tv/${selected.id}/season/1`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } })
        .then(r => r.json()).then(d => setEpisodes(d.episodes || []));
    }
  }, [selected]);

  return (
    <div>
      <style>{css}</style>
      <div className="nav">
        <div className="logo" onClick={() => { setSelected(null); setPlay(null); }}>KIRITO4K</div>
      </div>
      
      <div className="grid">
        {items.map(item => (
          <div key={item.id} className="card" onClick={() => setSelected(item)}>
            <img src={`${IMG}/w500${item.poster_path}`} alt="" />
            <div style={{ padding: 10, fontSize: 13, fontWeight: "bold" }}>{item.title || item.name}</div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="detail-overlay">
          <div className="hero" style={{ backgroundImage: `url(${IMG}/original${selected.backdrop_path})` }}>
            <div className="hero-grad" />
            <button onClick={() => setSelected(null)} style={{ position: "absolute", top: 25, left: 25, background: "#000", border: "none", color: "#fff", padding: "10px 15px", borderRadius: "5px", cursor: "pointer" }}>BACK</button>
          </div>
          <div style={{ padding: "0 40px" }}>
            <h1 style={{ fontSize: 42, margin: "20px 0 10px" }}>{selected.title || selected.name}</h1>
            <p style={{ color: "#999", maxWidth: 800, lineHeight: "1.6" }}>{selected.overview}</p>
            
            {selected.title ? (
              <button onClick={() => setPlay({ tmdbId: selected.id, type: "movie" })} style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "15px 45px", borderRadius: 5, fontWeight: "bold", cursor: "pointer", fontSize: 16 }}>WATCH NOW</button>
            ) : (
              <div className="ep-list">
                {episodes.map(ep => (
                  <div key={ep.id} className="ep-item" onClick={() => setPlay({ tmdbId: selected.id, type: "tv", season: 1, episode: ep.episode_number })}>
                    <img src={`${IMG}/w500${ep.still_path}`} style={{ width: "100%", borderRadius: "6px 6px 0 0" }} alt="" />
                    <div style={{ padding: 12, fontSize: 14, fontWeight: "bold" }}>Episode {ep.episode_number}: {ep.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {play && <Player media={play} onClose={() => setPlay(null)} />}
    </div>
  );
}
