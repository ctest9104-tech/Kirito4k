import React, { useState, useEffect } from "react";

export default function App() {
  const [movies, setMovies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");

  // Fetches trending content from a public mirror (No key needed)
  useEffect(() => {
    fetch("https://vidsrc.icu/api/trending")
      .then(res => res.json())
      .then(data => setMovies(data.results || []))
      .catch(() => {
        // Fallback list if the server is down
        setMovies([{ id: "tt15239678", title: "Dune 2", poster: "https://image.tmdb.org/t/p/w500/8uVKf6hadi2jT60p4Fc9p0tQNfs.jpg" }]);
      });
  }, []);

  return (
    <div style={s.container}>
      <nav style={s.nav}>
        <h1 style={s.logo}>KIRITO4K</h1>
        <input 
          placeholder="Search..." 
          style={s.input} 
          onChange={(e) => setQuery(e.target.value)} 
        />
      </nav>

      <div style={s.grid}>
        {movies.filter(m => !query || (m.title || "").toLowerCase().includes(query.toLowerCase())).map(m => (
          <div key={m.id} style={s.card} onClick={() => setSelected(m)}>
            <img src={m.poster || `https://image.tmdb.org/t/p/w342${m.poster_path}`} style={s.poster} />
          </div>
        ))}
      </div>

      {selected && (
        <div style={s.overlay}>
          <div style={s.playerBar}>
            <span style={{fontSize: '14px'}}>{selected.title}</span>
            <button onClick={() => setSelected(null)} style={s.close}>✕ CLOSE</button>
          </div>
          <iframe 
            src={`https://vidsrc.to/embed/movie/${selected.id}`}
            style={s.iframe} 
            allowFullScreen 
          />
        </div>
      )}
    </div>
  );
}

const s = {
  container: { background: '#050505', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' },
  nav: { padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000' },
  logo: { color: '#e50914', fontSize: '20px', fontWeight: '900' },
  input: { background: '#111', border: '1px solid #333', color: '#fff', padding: '8px 15px', borderRadius: '20px' },
  grid: { padding: '15px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px' },
  card: { cursor: 'pointer', borderRadius: '5px', overflow: 'hidden' },
  poster: { width: '100%', aspectRatio: '2/3', display: 'block', objectFit: 'cover' },
  overlay: { position: 'fixed', inset: 0, background: '#000', zIndex: 100, display: 'flex', flexDirection: 'column' },
  playerBar: { padding: '15px', background: '#111', display: 'flex', justifyContent: 'space-between' },
  close: { background: '#e50914', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px' },
  iframe: { flex: 1, border: 'none' }
};
