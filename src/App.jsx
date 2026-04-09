import { useState, useEffect, useRef } from "react";

const TMDB_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzMTVjYWYzNjkxNTc1OGIwMDFlOTYwMzg5OWJlOTY3MCIsIm5iZiI6MTc3NTcxMjQyNy44MTksInN1YiI6IjY5ZDczOGFiNTIzNzlkODZhY2Q3NzE4YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ID34IJ0N4KSVI4UIziKBwiPR2NQlLAnblAxZC48GWS8";
const TMDB = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

const SERVERS = [
  { id: "vidlink", name: "VidLink", movieUrl: (id) => `https://vidlink.pro/movie/${id}`, tvUrl: (id) => `https://vidlink.pro/tv/${id}`, episodeUrl: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}` },
  { id: "vidsrc", name: "VidSrc", movieUrl: (id) => `https://vsrc.su/embed/movie?tmdb=${id}`, tvUrl: (id) => `https://vsrc.su/embed/tv?tmdb=${id}`, episodeUrl: (id, s, e) => `https://vsrc.su/embed/tv?tmdb=${id}&season=${s}&episode=${e}` },
];

const css = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;700&display=swap');
:root { --bg: #050508; --accent: #e50914; --surface: #111118; --text: #ffffff; }
body { margin:0; background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; }
.nav { height: 70px; display: flex; align-items: center; padding: 0 40px; background: rgba(0,0,0,0.9); position: fixed; width: 100%; z-index: 100; border-bottom: 1px solid #222; }
.logo { font-family: 'Bebas Neue'; font-size: 32px; color: var(--accent); cursor: pointer; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px; padding: 100px 40px 40px; }
.card { cursor: pointer; transition: 0.3s; background: var(--surface); border-radius: 10px; overflow: hidden; }
.card:hover { transform: scale(1.05); }
.card img { width: 100%; aspect-ratio: 2/3; object-fit: cover; }
.card-info { padding: 10px; font-weight: bold; font-size: 14px; }
.detail-view { position: fixed; inset: 0; background: var(--bg); z-index: 200; overflow-y: auto; }
.hero { height: 45vh; background-size: cover; background-position: center; position: relative; }
.hero-grad { position: absolute; inset: 0; background: linear-gradient(to top, var(--bg), transparent); }
.ep-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; padding: 20px 0; }
.ep-box { background: var(--surface); border-radius: 8px; cursor: pointer; border: 1px solid transparent; transition: 0.2s; }
.ep-box:hover { border-color: var(--accent); }
.player-full { position: fixed; inset: 0; background: #000; z-index: 2000; }

/* NUCLEAR AD-BLOCKING CSS */
.ad-nullifier { position: absolute; inset: 0; pointer-events: none; z-index: 1999; }
iframe { pointer-events: auto !important; }
/* Target any div that tries to sit on top of the player with a high z-index */
div[style*="z-index: 2147483647"], div[id*="pop"], div[class*="overlay"] { 
    display: none !important; 
    visibility: hidden !important; 
    pointer-events: none !important; 
}
`;

function Player({ media, onClose }) {
  const server = SERVERS[0];
  const url = media.episode 
    ? server.episodeUrl(media.tmdbId, media.season, media.episode)
    : (media.type === "movie" ? server.movieUrl(media.tmdbId) : server.tvUrl(media.tmdbId));

  useEffect(() => {
    // HIJACK WINDOW.OPEN: This stops popups from firing in the current context
    const originalOpen = window.open;
    window.open = function() { return null; };

    // Also disable the alert/confirm boxes ad scripts use
    const originalAlert = window.alert;
    window.alert = function() { return true; };

    return () => {
      window.open = originalOpen;
      window.alert = originalAlert;
    };
  }, []);

  return (
    <div className="player-full">
      <div style={{ position: "absolute", top: 20, right: 20, zIndex: 3000, display: "flex", gap: 10 }}>
        <button onClick={onClose} style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>CLOSE</button>
      </div>
      
      {/* Ghost layer to absorb potential focus steals */}
      <div className="ad-nullifier" />
      
      <iframe 
        src={url} 
        style={{ width: "100%", height: "100%", border: "none" }} 
        allowFullScreen 
        title="Kirito4K Player"
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
      <nav className="nav"><div className="logo" onClick={() => setSelected(null)}>KIRITO4K</div></nav>
      
      <div className="grid">
        {items.map(item => (
          <div key={item.id} className="card" onClick={() => setSelected(item)}>
            <img src={`${IMG}/w500${item.poster_path}`} alt="" />
            <div className="card-info">{item.title || item.name}</div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="detail-view">
          <div className="hero" style={{ backgroundImage: `url(${IMG}/original${selected.backdrop_path})` }}>
            <div className="hero-grad" />
            <button onClick={() => setSelected(null)} style={{ position: "absolute", top: 30, left: 30, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", padding: "12px", borderRadius: "50%", cursor: "pointer" }}>←</button>
          </div>
          <div style={{ padding: "0 40px 60px", marginTop: "-50px", position: "relative" }}>
            <h1 style={{ fontFamily: "Bebas Neue", fontSize: 48 }}>{selected.title || selected.name}</h1>
            <p style={{ color: "#aaa", maxWidth: 800 }}>{selected.overview}</p>
            
            {selected.title ? (
              <button onClick={() => setPlay({ tmdbId: selected.id, type: "movie" })} style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "15px 40px", borderRadius: 8, fontWeight: "bold", cursor: "pointer", marginTop: 20 }}>PLAY MOVIE</button>
            ) : (
              <div className="ep-list">
                {episodes.map(ep => (
                  <div key={ep.id} className="ep-box" onClick={() => setPlay({ tmdbId: selected.id, type: "tv", season: 1, episode: ep.episode_number })}>
                    <img src={`${IMG}/w500${ep.still_path}`} style={{ width: "100%", borderRadius: "8px 8px 0 0" }} alt="" />
                    <div style={{ padding: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: "bold" }}>E{ep.episode_number}: {ep.name}</div>
                    </div>
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
