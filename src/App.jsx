import React, { useState, useEffect } from "react";

const TMDB_KEY = "315caf36915c58b001e9603899be9670";

export default function App() {
  const [movies, setMovies] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/trending/all/day?api_key=${TMDB_KEY}`)
      .then(res => res.json())
      .then(data => setMovies(data.results || []))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <span style={styles.logo}>KIRITO4K</span>
      </nav>

      <div style={styles.grid}>
        {movies.map(m => (
          <div key={m.id} style={styles.card} onClick={() => setSelected(m)}>
            <img 
              src={`https://image.tmdb.org/t/p/w500${m.poster_path}`} 
              style={styles.poster} 
              alt={m.title} 
            />
          </div>
        ))}
      </div>

      {selected && (
        <div style={styles.playerOverlay}>
          <div style={styles.playerBar}>
            <span style={{fontSize: '14px'}}>{selected.title || selected.name}</span>
            <button onClick={() => setSelected(null)} style={styles.closeBtn}>✕ CLOSE</button>
          </div>
          <iframe 
            src={selected.first_air_date 
              ? `https://vidsrc.icu/embed/tv/${selected.id}/1/1` 
              : `https://vidsrc.icu/embed/movie/${selected.id}`}
            style={{flex: 1, border: 'none', background: '#000'}} 
            allowFullScreen 
            sandbox="allow-forms allow-scripts allow-same-origin"
          />
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { background: '#050505', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' },
  nav: { padding: '20px 5%', background: '#000' },
  logo: { fontSize: '24px', fontWeight: '900', color: '#e50914' },
  grid: { padding: '10px 5%', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '15px' },
  card: { cursor: 'pointer', borderRadius: '8px', overflow: 'hidden' },
  poster: { width: '100%', display: 'block' },
  playerOverlay: { position: 'fixed', inset: 0, background: '#000', zIndex: 1000, display: 'flex', flexDirection: 'column' },
  playerBar: { padding: '15px', background: '#111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { background: '#e50914', color: '#fff', border: 'none', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }
};
