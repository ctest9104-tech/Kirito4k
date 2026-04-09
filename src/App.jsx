import { useState, useEffect, useRef } from "react";

const TMDB_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzMTVjYWYzNjkxNTc1OGIwMDFlOTYwMzg5OWJlOTY3MCIsIm5iZiI6MTc3NTcxMjQyNy44MTksInN1YiI6IjY5ZDczOGFiNTIzNzlkODZhY2Q3NzE4YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ID34IJ0N4KSVI4UIziKBwiPR2NQlLAnblAxZC48GWS8";
const TMDB = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

const SERVERS = [
  { id: "vidlink", name: "VidLink (Fastest)", movieUrl: (id) => `https://vidlink.pro/movie/${id}`, tvUrl: (id) => `https://vidlink.pro/tv/${id}`, episodeUrl: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}` },
  { id: "vidsrc", name: "VidSrc", movieUrl: (id) => `https://vsrc.su/embed/movie?tmdb=${id}`, tvUrl: (id) => `https://vsrc.su/embed/tv?tmdb=${id}`, episodeUrl: (id, s, e) => `https://vsrc.su/embed/tv?tmdb=${id}&season=${s}&episode=${e}` },
];

const css = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;700&display=swap');
:root { --bg: #050507; --surface: #111116; --accent: #ff0000; --text: #ffffff; }
body { margin:0; background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; }
.nav { height: 65px; display: flex; align-items: center; padding: 0 40px; background: rgba(0,0,0,0.9); position: fixed; width: 100%; z-index: 100; border-bottom: 1px solid #222; }
.logo { font-family: 'Bebas Neue'; font-size: 30px; color: var(--accent); cursor: pointer; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 20px; padding: 90px 40px 40px; }
.card { cursor: pointer; transition: 0.3s; position: relative; }
.card:hover { transform: scale(1.05); }
.card img { width: 100%; border-radius: 8px; aspect-ratio: 2/3; object-fit: cover; }
.card-title { margin-top: 8px; font-size: 13px; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.player-wrap { position: fixed; inset: 0; background: #000; z-index: 2000; }
.close-btn { position: absolute; top: 20px; right: 20px; z-index: 3000; background: var(--accent); color: #fff; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; }
.shield-active { position: absolute; top: 25px; left: 50%; transform: translateX(-50%); background: #22c55e; color: #000; padding: 5px 15px; border-radius: 20px; font-size: 11px; font-weight: 800; z-index: 3000; pointer-events: none; }
`;

function Player({ media, onClose }) {
  const [shieldActive, setShieldActive] = useState(true);
  const containerRef = useRef(null);
  const server = SERVERS[0];
  
  const url = media.episode 
    ? server.episodeUrl(media.tmdbId, media.season, media.episode)
    : (media.type === "movie" ? server.movieUrl(media.tmdbId) : server.tvUrl(media.tmdbId));

  // THE AD-STOPPER: High-level event interception
  useEffect(() => {
    const interceptClicks = (e) => {
      // If the shield is on, we stop EVERYTHING from reaching the iframe
      if (shieldActive) {
        e.preventDefault();
        e.stopPropagation();
        setShieldActive(false); // Disable after first block to let user hit play
        console.log("Ad Blocked: Shield absorbed the click.");
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("click", interceptClicks, true);
      container.addEventListener("mousedown", interceptClicks, true);
    }
    return () => {
      if (container) {
        container.removeEventListener("click", interceptClicks, true);
        container.removeEventListener("mousedown", interceptClicks, true);
      }
    };
  }, [shieldActive]);

  return (
    <div className="player-wrap" ref={containerRef}>
      <button className="close-btn" onClick={onClose}>CLOSE</button>
      {shieldActive && <div className="shield-active">AD-SHIELD ENGAGED</div>}
      
      <iframe 
        src={url} 
        style={{ width: "100%", height: "100%", border: "none" }} 
        allowFullScreen 
      />
    </div>
  );
}

export default function Kirito4K() {
  const [items, setItems] = useState([]);
  const [play, setPlay] = useState(null);

  useEffect(() => {
    fetch(`${TMDB}/trending/all/day`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } })
      .then(r => r.json()).then(d => setItems(d.results || []));
  }, []);

  return (
    <div>
      <style>{css}</style>
      <nav className="nav"><div className="logo">KIRITO4K</div></nav>
      <div className="grid">
        {items.map(item => (
          <div key={item.id} className="card" onClick={() => setPlay({ tmdbId: item.id, type: item.media_type })}>
            <img src={`${IMG}/w500${item.poster_path}`} alt="" />
            <div className="card-title">{item.title || item.name}</div>
          </div>
        ))}
      </div>
      {play && <Player media={play} onClose={() => setPlay(null)} />}
    </div>
  );
}
