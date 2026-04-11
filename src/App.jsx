import React, { useState, useEffect } from "react";

// Fallback Key if yours is blocked
const TMDB_KEY = "315caf36915c58b001e9603899be9670";

export default function App() {
  const [movies, setMovies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState("Initializing...");

  useEffect(() => {
    setStatus("Fetching movies...");
    fetch(`https://api.themoviedb.org/3/trending/all/day?api_key=${TMDB_KEY}`)
      .then(res => res.json())
      .then(data => {
        if(data.results) {
          setMovies(data.results);
          setStatus(""); 
        } else {
          setStatus("API Key Error or No Data");
        }
      })
      .catch(() => setStatus("Network Blocked (Check VPN/Adblock)"));
  }, []);

  return (
    <div style={{ background: '#050505', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <nav style={{ padding: '15px', background: '#000', borderBottom: '1px solid #111' }}>
        <h1 style={{ color: '#e50914', margin: 0, fontSize: '22px' }}>KIRITO4K</h1>
        {status && <p style={{fontSize:'10px', color:'#555'}}>{status}</p>}
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px', padding: '15px' }}>
        {movies.map(m => (
          <div key={m.id} onClick={() => setSelected(m)} style={{ cursor: 'pointer' }}>
            <img 
              src={`https://image.tmdb.org/t/p/w342${m.poster_path}`} 
              style={{ width: '100%', borderRadius: '5px', background: '#111' }} 
              onError={(e) => e.target.src = "https://via.placeholder.com/342x513?text=Error"}
            />
          </div>
        ))}
      </div>

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '15px', background: '#111', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px' }}>{selected.title || selected.name}</span>
            <button onClick={() => setSelected(null)} style={{ background: '#e50914', color: '#fff', border: 'none', padding: '5px 10px' }}>CLOSE</button>
          </div>
          
          <iframe 
            /* 2026 PRO SOURCE: Using the v2 mirror for Nepu which bypasses ad-blocks */
            src={selected.first_air_date 
              ? `https://nepu.to/embed/tv/${selected.id}/1/1` 
              : `https://nepu.to/embed/movie/${selected.id}`}
            style={{ flex: 1, border: 'none' }} 
            allowFullScreen 
            /* THE SHIELD: allow-popups is REMOVED to block ads */
            sandbox="allow-forms allow-scripts allow-same-origin"
          />
        </div>
      )}
    </div>
  );
}
