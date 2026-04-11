import React, { useState, useEffect } from "react";

export default function App() {
  const [movies, setMovies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    // 2026 Unified Endpoint (No Keys, No 404s)
    fetch("https://vidsrc.icu/api/trending")
      .then(res => res.json())
      .then(data => setMovies(data.results || []))
      .catch(() => console.log("Mirroring blocked"));
  }, []);

  // Filter logic for search (Works without external API calls)
  const filteredMovies = movies.filter(m => 
    !query || (m.title || "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={{ background: '#050505', color: '#fff', minHeight: '100vh', width: '100vw', overflowX: 'hidden' }}>
      <nav style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', background: '#000', position: 'sticky', top: 0, zIndex: 10 }}>
        <h1 style={{ color: '#e50914', margin: 0, fontSize: '20px', fontWeight: '900' }}>KIRITO4K</h1>
        <input 
          placeholder="Search catalog..." 
          style={{ background: '#111', border: '1px solid #333', color: '#fff', padding: '8px 15px', borderRadius: '20px' }} 
          value={query}
          onChange={(e) => setQuery(e.target.value)} 
        />
      </nav>

      {/* The Grid - Fixed CSS to ensure visibility */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px', padding: '15px' }}>
        {filteredMovies.map(m => (
          <div key={m.id} onClick={() => setSelected(m)} style={{ cursor: 'pointer', borderRadius: '8px', overflow: 'hidden', background: '#111' }}>
            <img 
              src={m.poster || `https://image.tmdb.org/t/p/w342${m.poster_path}`} 
              style={{ width: '100%', display: 'block', aspectRatio: '2/3', objectFit: 'cover' }} 
              alt=""
            />
          </div>
        ))}
      </div>

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 100, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '15px', background: '#111', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{fontWeight: 'bold'}}>{selected.title}</span>
            <button onClick={() => setSelected(null)} style={{ background: '#e50914', color: '#fff', border: 'none', padding: '5px 15px', borderRadius: '4px' }}>✕ CLOSE</button>
          </div>
          
          {/* THE PLAYER: No Sandbox, 100% Ad-Free VidLink Mirror */}
          <iframe 
            src={`https://vidlink.pro/embed/movie/${selected.id}`}
            style={{ flex: 1, border: 'none' }} 
            allowFullScreen 
          />
        </div>
      )}
    </div>
  );
}
