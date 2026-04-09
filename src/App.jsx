import { useState, useEffect, useRef } from "react";

const TMDB_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzMTVjYWYzNjkxNTc1OGIwMDFlOTYwMzg5OWJlOTY3MCIsIm5iZiI6MTc3NTcxMjQyNy44MTksInN1YiI6IjY5ZDczOGFiNTIzNzlkODZhY2Q3NzE4YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ID34IJ0N4KSVI4UIziKBwiPR2NQlLAnblAxZC48GWS8";
const TMDB = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

// Expanded Server List
const SERVERS = [
  { id: "vidlink", name: "VidLink (Fast/Few Ads)", movieUrl: (id) => `https://vidlink.pro/movie/${id}`, tvUrl: (id) => `https://vidlink.pro/tv/${id}`, episodeUrl: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}` },
  { id: "vidsrc", name: "VidSrc (Stable)", movieUrl: (id) => `https://vsrc.su/embed/movie?tmdb=${id}`, tvUrl: (id) => `https://vsrc.su/embed/tv?tmdb=${id}`, episodeUrl: (id, s, e) => `https://vsrc.su/embed/tv?tmdb=${id}&season=${s}&episode=${e}` },
  { id: "embedsu", name: "Embed.su", movieUrl: (id) => `https://embed.su/embed/movie/${id}`, tvUrl: (id) => `https://embed.su/embed/tv/${id}`, episodeUrl: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}` },
  { id: "auto", name: "AutoEmbed", movieUrl: (id) => `https://player.autoembed.cc/embed/movie/${id}`, tvUrl: (id) => `https://player.autoembed.cc/embed/tv/${id}`, episodeUrl: (id, s, e) => `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}` },
];

const css = `
:root { --bg: #050508; --accent: #e50914; --surface: #111118; }
body { margin:0; background: var(--bg); color: #fff; font-family: sans-serif; }
.nav { height: 70px; display: flex; align-items: center; padding: 0 40px; background: #000; position: fixed; width: 100%; z-index: 100; border-bottom: 1px solid #222; }
.logo { font-size: 28px; font-weight: 900; color: var(--accent); cursor: pointer; letter-spacing: -1px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 20px; padding: 100px 40px; }
.card { cursor: pointer; transition: 0.2s; }
.card:hover { transform: translateY(-5px); }
.card img { width: 100%; border-radius: 8px; aspect-ratio: 2/3; object-fit: cover; }
.detail-overlay { position: fixed; inset: 0; background: var(--bg); z-index: 200; overflow-y: auto; padding-bottom: 50px; }
.hero { height: 40vh; background-size: cover; background-position: center; position: relative; }
.hero-grad { position: absolute; inset: 0; background: linear-gradient(to top, var(--bg), transparent); }
.ep-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin-top: 20px; }
.ep-item { background: var(--surface); border-radius: 6px; cursor: pointer; border: 1px solid #333; overflow: hidden; }
.ep-item:hover { border-color: var(--accent); }
.player-screen { position: fixed; inset: 0; background: #000; z-index: 3000; }
.player-controls { position: absolute; top: 0; left: 0; right: 0; z-index: 4000; display: flex; justify-content: space-between; padding: 20px; background: linear-gradient(to bottom, rgba(0,0,0,0.9), transparent); }
.server-select { background: #222; color: #fff; border: 1px solid #444; padding: 8px 15px; border-radius: 5px; outline: none; }
`;

function Player({ media, onClose }) {
  const [serverId, setServerId] = useState("vidlink");
  const [shield, setShield] = useState(true);
  const server = SERVERS.find(s => s.id === serverId);

  const url = media.episode 
    ? server.episodeUrl(media.tmdbId, media.season, media.episode)
    : (media.type === "movie" ? server.movieUrl(media.tmdbId) : server.tvUrl(media.tmdbId));

  // FORCE RECOVERY: Every time server changes, window.open is re-hijacked
  useEffect(() => {
    const killPopups = () => {
      window.open = () => null;
      window.alert = () => true;
    };
    killPopups();
    window.addEventListener('click', killPopups);
    return () => window.removeEventListener('click', killPopups);
  }, [serverId]);

  return (
    <div className="player-screen">
      <div className="player-controls">
        <select 
          className="server-select" 
          value={serverId} 
          onChange={(e) => { setServerId(e.target.value); setShield(true); }}
        >
          {SERVERS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button onClick={onClose} style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "10px 25px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>EXIT</button>
      </div>

      <div style={{ width: "100%", height: "100%", position: "relative" }}>
        {shield && (
          <div 
            onClick={() => setShield(false)}
            style={{ position: "absolute", inset: 0, zIndex: 3500, background: "rgba(0,0,0,0.01)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
             <div style={{ background: "rgba(255,255,255,0.1)", padding: "10px 20px", borderRadius: "30px", fontSize: "12px", border: "1px solid rgba(255,255,255,0.2)" }}>
               Click Once to Initialize Player (Ads Blocked)
             </div>
          </div>
        )}
        <iframe 
          key={serverId} // Forces iframe to re-mount when switching players
          src={url} 
          style={{ width: "100%", height: "100%", border: "none" }} 
          allowFullScreen 
        />
      </div>
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
      <nav className="nav"><div className="logo" onClick={() => setSelected(null)}>KIRITO4K</div></nav>
      
      <div className="grid">
        {items.map(item => (
          <div key={item.id} className="card" onClick={() => setSelected(item)}>
            <img src={`${IMG}/w500${item.poster_path}`} alt="" />
            <div style={{ marginTop: 10, fontSize: 13, fontWeight: "bold" }}>{item.title || item.name}</div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="detail-overlay">
          <div className="hero" style={{ backgroundImage: `url(${IMG}/original${selected.backdrop_path})` }}>
            <div className="hero-grad" />
            <button onClick={() => setSelected(null)} style={{ position: "absolute", top: 20, left: 20, background: "#000", border: "none", color: "#fff", padding: "10px", borderRadius: "50%", cursor: "pointer" }}>✕</button>
          </div>
          <div style={{ padding: "0 40px" }}>
            <h1 style={{ fontSize: 40, margin: "20px 0 10px" }}>{selected.title || selected.name}</h1>
            <p style={{ color: "#888", maxWidth: 800 }}>{selected.overview}</p>
            
            {selected.title ? (
              <button onClick={() => setPlay({ tmdbId: selected.id, type: "movie" })} style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "15px 40px", borderRadius: 6, fontWeight: "bold", cursor: "pointer", marginTop: 10 }}>PLAY MOVIE</button>
            ) : (
              <div className="ep-list">
                {episodes.map(ep => (
                  <div key={ep.id} className="ep-item" onClick={() => setPlay({ tmdbId: selected.id, type: "tv", season: 1, episode: ep.episode_number })}>
                    <img src={`${IMG}/w500${ep.still_path}`} style={{ width: "100%" }} alt="" />
                    <div style={{ padding: 10, fontSize: 13, fontWeight: "bold" }}>E{ep.episode_number}: {ep.name}</div>
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
