import React, { useState, useEffect } from "react";

export default function App() {
  const [movies, setMovies] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    // 2026 Keyless Trending Indexer
    fetch("https://vidsrc.icu/api/trending")
      .then(res => res.json())
      .then(data => setMovies(data.results || []))
      .catch(() => setMovies([
        { id: "tt15239678", title: "Dune 2", poster: "https://image.tmdb.org/t/p/w500/8uVKf6hadi2jT60p4Fc9p0tQNfs.jpg" }
      ]));
  }, []);

  return (
    <div style={s.container}>
      <header style={s.header}>
        <h1 style={s.logo}>KIRITO4K</h1>
      </header>

      <div style={s.grid}>
        {movies.map(m => (
          <div key={m.id} style={s.card} onClick={() => setSelected(m)}>
            <img src={m.poster || `https://image.tmdb.org/t/p/w342${m.poster_path}`} style={s.poster} alt="" />
          </div>
        ))}
      </div>

      {selected && (
        <div style={s.overlay}>
          <div style={s.playerBar}>
            <span>{selected.title}</span>
            <button onClick={() => setSelected(null)} style={s.close}>✕ CLOSE</button>
          </div>
          
          <div style={s.videoWrapper}>
            {/* The Click-Eater: This transparent div sits OVER the player.
                The first time you tap to play, it catches the popup and disappears. */}
            <div 
              onClick={(e) => e.currentTarget.style.display = 'none'}
              style={s.clickEater}
            />
            
            <iframe 
              /* VidLink is currently the #1 rated ad-free mirror on Reddit/GitHub in 2026 */
              src={`https://vidlink.pro/embed/movie/${selected.id}`}
              style={s.iframe} 
              allowFullScreen 
            />
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  container: { background: '#050505', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' },
  header: { padding: '20px', textAlign: 'center', borderBottom: '1px solid #111' },
  logo: { color: '#e50914', margin: 0, fontSize: '24px', letterSpacing: '2px' },
  grid: { padding: '15px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '15px' },
  card: { borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', transition: '0.2s' },
  poster: { width: '100%', aspectRatio: '2/3', display: 'block', objectFit: 'cover' },
  overlay: { position: 'fixed', inset: 0, background: '#000', zIndex: 1000, display: 'flex', flexDirection: 'column' },
  playerBar: { padding: '15px', background: '#111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  close: { background: '#e50914', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px' },
  videoWrapper: { flex: 1, position: 'relative', background: '#000' },
  clickEater: { position: 'absolute', inset: 0, zIndex: 10, cursor: 'pointer', background: 'rgba(0,0,0,0.01)' },
  iframe: { width: '100%', height: '100%', border: 'none' }
};
