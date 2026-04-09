import { useState, useEffect, useRef } from "react";

const TMDB_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzMTVjYWYzNjkxNTc1OGIwMDFlOTYwMzg5OWJlOTY3MCIsIm5iZiI6MTc3NTcxMjQyNy44MTksInN1YiI6IjY5ZDczOGFiNTIzNzlkODZhY2Q3NzE4YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ID34IJ0N4KSVI4UIziKBwiPR2NQlLAnblAxZC48GWS8";
const TMDB = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

const SERVERS = [
  { id: "vidlink", name: "VidLink (Fast)", movieUrl: (id) => `https://vidlink.pro/movie/${id}`, tvUrl: (id) => `https://vidlink.pro/tv/${id}`, episodeUrl: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}` },
  { id: "vidsrc", name: "VidSrc (Stable)", movieUrl: (id) => `https://vsrc.su/embed/movie?tmdb=${id}`, tvUrl: (id) => `https://vsrc.su/embed/tv?tmdb=${id}`, episodeUrl: (id, s, e) => `https://vsrc.su/embed/tv?tmdb=${id}&season=${s}&episode=${e}` },
];

const css = `
:root { --bg: #050507; --accent: #ff0000; --surface: #101015; }
body { margin:0; background: var(--bg); color: #fff; font-family: sans-serif; overflow-x: hidden; }
.nav { height: 60px; display: flex; align-items: center; padding: 0 30px; background: rgba(0,0,0,0.8); position: fixed; width: 100%; z-index: 100; }
.logo { font-weight: 900; font-size: 24px; color: var(--accent); cursor: pointer; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 20px; padding: 100px 30px 30px; }
.card { cursor: pointer; transition: 0.2s; }
.card:hover { transform: translateY(-5px); }
.card img { width: 100%; border-radius: 8px; aspect-ratio: 2/3; object-fit: cover; }
.player-overlay { position: fixed; inset: 0; background: #000; z-index: 1000; }
.shield-notif { position: absolute; top: 20px; left: 50%; transform: translateX(-50%); background: var(--accent); color: #fff; padding: 8px 16px; borderRadius: 20px; font-size: 12px; font-weight: bold; z-index: 2001; pointer-events: none; animation: fade 2s infinite; }
@keyframes fade { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
`;

function Player({ media, onClose }) {
  const [clicks, setClicks] = useState(3);
  const server = SERVERS[0]; // Default to VidLink
  
  const url = media.episode 
    ? server.episodeUrl(media.tmdbId, media.season, media.episode)
    : (media.type === "movie" ? server.movieUrl(media.tmdbId) : server.tvUrl(media.tmdbId));

  // POPUP ANTI-GRAVITY: 
  // Since sandbox is removed, we monitor window focus. 
  // If an ad tries to pop and steal focus, we force the window back.
  useEffect(() => {
    const handleBlur = () => {
      if (document.activeElement instanceof HTMLIFrameElement) {
        setTimeout(() => window.focus(), 100);
      }
    };
    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, []);

  return (
    <div className="player-overlay">
      <div style={{ position: "absolute", top: 20, right: 20, zIndex: 2005 }}>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", padding: "10px 20px", borderRadius: "5px", cursor: "pointer" }}>CLOSE</button>
      </div>

      {clicks > 0 && (
        <>
          <div className="shield-notif">CLICK PLAYER {clicks}x TO PURGE ADS</div>
          <div 
            onClick={() => setClicks(c => c - 1)}
            style={{ position: "absolute", inset: 0, zIndex: 2000, cursor: "pointer", background: "rgba(0,0,0,0.01)" }} 
          />
        </>
      )}

      <iframe
        src={url}
        style={{ width: "100%", height: "100%", border: "none" }}
        allowFullScreen
        /* SANDBOX REMOVED TO PREVENT BLOCKING */
      />
    </div>
  );
}

export default function Kirito4K() {
  const [items, setItems] = useState([]);
  const [play, setPlay] = useState(null);

  useEffect(() => {
    fetch(`${TMDB}/trending/all/day`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } })
      .then(r => r.json()).then(d => setItems(d.results));
  }, []);

  return (
    <div>
      <style>{css}</style>
      <div className="nav"><div className="logo">KIRITO4K</div></div>
      <div className="grid">
        {items.map(item => (
          <div key={item.id} className="card" onClick={() => setPlay({ tmdbId: item.id, type: item.media_type })}>
            <img src={`${IMG}/w500${item.poster_path}`} alt="" />
            <div style={{ marginTop: 8, fontSize: 14 }}>{item.title || item.name}</div>
          </div>
        ))}
      </div>
      {play && <Player media={play} onClose={() => setPlay(null)} />}
    </div>
  );
}
