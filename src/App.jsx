import React, { useState, useEffect } from "react";

// --- CONFIGURATION ---
// I've included a public fallback key, but for long-term use, 
// get your own free key at themoviedb.org
const TMDB_API_KEY = "315caf36915c58b001e9603899be9670"; 
const IMG_BASE = "https://image.tmdb.org/t/p/w500";

// --- COMPONENTS ---

const Player = ({ item, onClose }) => {
  const [source, setSource] = useState("vidsrc");
  
  // These are the most resilient mirrors for 2026
  const getUrl = () => {
    const isTV = !!item.first_air_date;
    const id = item.id;
    if (source === "vidsrc") {
      return isTV ? `https://vidsrc.icu/embed/tv/${id}/1/1` : `https://vidsrc.icu/embed/movie/${id}`;
    }
    return isTV ? `https://vidsrc.pm/embed/tv/${id}/1/1` : `https://vidsrc.pm/embed/movie/${id}`;
  };

  return (
    <div className="player-overlay">
      <div className="player-controls">
        <div className="source-picker">
          <button onClick={() => setSource("vidsrc")} className={source === "vidsrc" ? "active" : ""}>Server 1</button>
          <button onClick={() => setSource("mirror")} className={source === "mirror" ? "active" : ""}>Server 2</button>
        </div>
        <button className="close-btn" onClick={onClose}>✕ Close</button>
      </div>
      <iframe 
        src={getUrl()} 
        allowFullScreen 
        sandbox="allow-forms allow-scripts allow-same-origin"
        title="video-player"
      />
    </div>
  );
};

export default function KiritoApp() {
  const [movies, setMovies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/trending/all/week?api_key=${TMDB_API_KEY}`)
      .then((res) => res.json())
      .then((data) => {
        setMovies(data.results || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loader">Loading Kirito4K...</div>;

  return (
    <div className="app-container">
      <style>{`
        :root { --red: #e50914; --bg: #050505; --card-bg: #141414; }
        body { margin: 0; background: var(--bg); color: white; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
        .app-container { min-height: 100vh; }
        .nav { height: 70px; display: flex; align-items: center; padding: 0 4%; background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent); position: fixed; width: 100%; z-index: 100; box-sizing: border-box; }
        .logo { color: var(--red); font-weight: 900; font-size: 28px; letter-spacing: -1px; cursor: pointer; }
        
        .hero { height: 80vh; background-size: cover; background-position: center; display: flex; align-items: center; padding: 0 4%; position: relative; }
        .hero::after { content: ''; position: absolute; inset: 0; background: linear-gradient(77deg, rgba(0,0,0,0.8) 0, rgba(0,0,0,0) 85%), linear-gradient(to top, var(--bg), transparent); }
        .hero-content { z-index: 10; max-width: 600px; }
        .hero-title { font-size: 3rem; margin: 0 0 1rem; }
        .hero-desc { font-size: 1.2rem; line-height: 1.4; color: #ccc; }

        .row { padding: 20px 4%; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px; }
        .card { position: relative; cursor: pointer; transition: transform 0.3s ease; border-radius: 4px; overflow: hidden; }
        .card:hover { transform: scale(1.08); z-index: 10; }
        .card img { width: 100%; height: auto; display: block; }
        
        .player-overlay { position: fixed; inset: 0; background: black; z-index: 1000; display: flex; flex-direction: column; }
        .player-controls { display: flex; justify-content: space-between; align-items: center; padding: 10px 20px; background: #111; }
        .source-picker button { background: #333; color: white; border: none; padding: 6px 15px; margin-right: 10px; border-radius: 4px; cursor: pointer; font-size: 12px; }
        .source-picker button.active { background: var(--red); }
        .close-btn { background: none; border: none; color: white; font-size: 20px; cursor: pointer; }
        iframe { flex: 1; border: none; background: black; }
        .loader { height: 100vh; display: flex; align-items: center; justify-content: center; font-size: 24px; color: var(--red); font-weight: bold; }
      `}</style>

      <nav className="nav">
        <div className="logo">KIRITO4K</div>
      </nav>

      {movies[0] && (
        <div className="hero" style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${movies[0].backdrop_path})` }}>
          <div className="hero-content">
            <h1 className="hero-title">{movies[0].title || movies[0].name}</h1>
            <p className="hero-desc">{movies[0].overview?.substring(0, 160)}...</p>
            <button className="play-btn" onClick={() => setSelected(movies[0])} style={{ background: 'white', color: 'black', border: 'none', padding: '12px 30px', borderRadius: '4px', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer', marginTop: '10px' }}>▶ Play</button>
          </div>
        </div>
      )}

      <div className="row">
        <h3>Trending Now</h3>
        <div className="grid">
          {movies.map((m) => (
            <div key={m.id} className="card" onClick={() => setSelected(m)}>
              <img src={`${IMG_BASE}${m.poster_path}`} alt={m.title} />
            </div>
          ))}
        </div>
      </div>

      {selected && <Player item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
