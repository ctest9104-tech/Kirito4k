import { useState, useEffect, useRef } from "react";

// --- CONFIG ---
const TMDB_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzMTVjYWYzNjkxNTc1OGIwMDFlOTYwMzg5OWJlOTY3MCIsIm5iZiI6MTc3NTcxMjQyNy44MTksInN1YiI6IjY5ZDczOGFiNTIzNzlkODZhY2Q3NzE4YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ID34IJ0N4KSVI4UIziKBwiPR2NQlLAnblAxZC48GWS8";
const TMDB = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

// Full Server Mapping
const SERVERS = [
  { id: "vidlink", name: "VidLink (Fast)", movieUrl: (id) => `https://vidlink.pro/movie/${id}`, tvUrl: (id) => `https://vidlink.pro/tv/${id}`, episodeUrl: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}` },
  { id: "vidsrc", name: "VidSrc (Stable)", movieUrl: (id) => `https://vsrc.su/embed/movie?tmdb=${id}`, tvUrl: (id) => `https://vsrc.su/embed/tv?tmdb=${id}`, episodeUrl: (id, s, e) => `https://vsrc.su/embed/tv?tmdb=${id}&season=${s}&episode=${e}` },
];

const css = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700&display=swap');
:root { --bg: #06060a; --surface: #12121a; --accent: #e50914; --text: #f0f0f5; --text2: #9494b8; }
body { margin:0; background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; overflow-x: hidden; }
.nav { height: 70px; display: flex; align-items: center; padding: 0 40px; background: rgba(0,0,0,0.8); position: fixed; width: 100%; z-index: 100; border-bottom: 1px solid rgba(255,255,255,0.05); }
.logo { font-family: 'Bebas Neue'; font-size: 32px; color: var(--accent); cursor: pointer; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 20px; padding: 100px 40px 40px; }
.card { cursor: pointer; transition: 0.3s; }
.card:hover { transform: scale(1.05); }
.card img { width: 100%; border-radius: 10px; aspect-ratio: 2/3; object-fit: cover; background: #1a1a26; }
.detail-overlay { position: fixed; inset: 0; background: var(--bg); z-index: 200; overflow-y: auto; }
.hero { height: 50vh; background-size: cover; background-position: center; position: relative; }
.hero-grad { position: absolute; inset: 0; background: linear-gradient(to top, var(--bg), transparent); }
.content { padding: 0 40px 60px; margin-top: -60px; position: relative; z-index: 5; }
.ep-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; margin-top: 20px; }
.ep-card { background: var(--surface); border-radius: 8px; overflow: hidden; cursor: pointer; border: 1px solid transparent; transition: 0.2s; }
.ep-card:hover { border-color: var(--accent); background: #1a1a26; }
.ep-img { width: 100%; aspect-ratio: 16/9; object-fit: cover; }
.ep-info { padding: 12px; }
.player-full { position: fixed; inset: 0; background: #000; z-index: 1000; }
.shield-notif { position: absolute; top: 20px; left: 50%; transform: translateX(-50%); background: #22c55e; color: #000; padding: 6px 15px; border-radius: 20px; font-size: 11px; font-weight: bold; z-index: 3000; pointer-events: none; }
`;

function Player({ media, onClose }) {
  const [shieldActive, setShieldActive] = useState(true);
  const containerRef = useRef(null);
  const server = SERVERS[0];
  
  const url = media.episode 
    ? server.episodeUrl(media.tmdbId, media.season, media.episode)
    : (media.type === "movie" ? server.movieUrl(media.tmdbId) : server.tvUrl(media.tmdbId));

  useEffect(() => {
    const intercept = (e) => {
      if (shieldActive) {
        e.preventDefault();
        e.stopPropagation();
        setShieldActive(false);
      }
    };
    const div = containerRef.current;
    if (div) {
      div.addEventListener("click", intercept, true);
      div.addEventListener("mousedown", intercept, true);
    }
    return () => {
      if (div) {
        div.removeEventListener("click", intercept, true);
        div.removeEventListener("mousedown", intercept, true);
      }
    };
  }, [shieldActive]);

  return (
    <div className="player-full" ref={containerRef}>
      <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, zIndex: 3005, background: "var(--accent)", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>CLOSE</button>
      {shieldActive && <div className="shield-notif">AD-SHIELD: CLICK ONCE TO CLEAR</div>}
      <iframe src={url} style={{ width: "100%", height: "100%", border: "none" }} allowFullScreen />
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
      <div className="nav"><div className="logo" onClick={() => setSelected(null)}>KIRITO4K</div></div>
      
      <div className="grid">
        {items.map(item => (
          <div key={item.id} className="card" onClick={() => setSelected(item)}>
            <img src={`${IMG}/w500${item.poster_path}`} alt="" />
            <div style={{ marginTop: 10, fontSize: 14, fontWeight: "bold" }}>{item.title || item.name}</div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="detail-overlay">
          <div className="hero" style={{ backgroundImage: `url(${IMG}/original${selected.backdrop_path})` }}>
            <div className="hero-grad" />
            <button onClick={() => setSelected(null)} style={{ position: "absolute", top: 30, left: 30, background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", padding: "10px", borderRadius: "50%", cursor: "pointer" }}>←</button>
          </div>
          <div className="content">
            <h1 style={{ fontFamily: "Bebas Neue", fontSize: 50, marginBottom: 10 }}>{selected.title || selected.name}</h1>
            <p style={{ color: "var(--text2)", maxWidth: 700, lineHeight: 1.6, marginBottom: 30 }}>{selected.overview}</p>
            
            {selected.title ? (
              <button onClick={() => setPlay({ tmdbId: selected.id, type: "movie" })} style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "15px 40px", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}>WATCH MOVIE</button>
            ) : (
              <div>
                <h3>Episodes (Season 1)</h3>
                <div className="ep-grid">
                  {episodes.map(ep => (
                    <div key={ep.id} className="ep-card" onClick={() => setPlay({ tmdbId: selected.id, type: "tv", season: 1, episode: ep.episode_number })}>
                      <img className="ep-img" src={`${IMG}/w500${ep.still_path}`} alt="" />
                      <div className="ep-info">
                        <div style={{ fontWeight: "bold", fontSize: 14 }}>E{ep.episode_number}: {ep.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 5, height: "32px", overflow: "hidden" }}>{ep.overview}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {play && <Player media={play} onClose={() => setPlay(null)} />}
    </div>
  );
}
