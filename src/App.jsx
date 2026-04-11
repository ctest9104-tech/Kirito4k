import React, { useState, useEffect } from "react";

const TMDB_KEY = "315caf36915c58b001e9603899be9670";

export default function App() {
  const [movies, setMovies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");

  const fetchData = (url) => {
    fetch(url)
      .then(res => res.json())
      .then(data => setMovies(data.results || []))
      .catch(err => console.error("API Error:", err));
  };

  useEffect(() => {
    fetchData(`https://api.themoviedb.org/3/trending/all/day?api_key=${TMDB_KEY}`);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query) fetchData(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${query}`);
  };

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <h1 style={styles.logo} onClick={() => window.location.reload()}>KIRITO4K</h1>
        <form onSubmit={handleSearch} style={styles.searchBox}>
          <input 
            type="text" 
            placeholder="Search..." 
            style={styles.input} 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
          />
        </form>
      </nav>

      <div style={styles.grid}>
        {movies.map(m => (
          <div key={m.id} style={styles.card} onClick={() => setSelected(m)}>
            <img 
              src={m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : "https://via.placeholder.com/342x513?text=No+Poster"} 
              style={styles.poster} 
            />
          </div>
        ))}
      </div>

      {selected && (
        <div style={styles.playerOverlay}>
          <div style={styles.playerBar}>
            <span style={styles.playerTitle}>{selected.title || selected.name}</span>
            <button onClick={() => setSelected(null)} style={styles.closeBtn}>✕ CLOSE</button>
          </div>
          <div style={styles.iframeWrapper}>
            <iframe 
              src={selected.first_air_date 
                ? `https://nepu.to/embed/tv/${selected.id}/1/1` 
                : `https://nepu.to/embed/movie/${selected.id}`}
              style={styles.iframe}
              allowFullScreen
              /* THE SHIELD: This prevents ads from opening new tabs/popups */
              sandbox="allow-forms allow-scripts allow-same-origin"
            />
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { background: '#050505', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' },
  nav: { padding: '15px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000', position: 'sticky', top: 0, zIndex: 10 },
  logo: { color: '#e50914', margin: 0, fontSize: '20px', fontWeight: '900', cursor: 'pointer' },
  searchBox: { flex: 1, marginLeft: '15px' },
  input: { width: '100%', padding: '8px 12px', borderRadius: '20px', border: '1px solid #333', background: '#111', color: '#fff' },
  grid: { padding: '15px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' },
  card: { borderRadius: '5px', overflow: 'hidden', cursor: 'pointer' },
  poster: { width: '100%', display: 'block', aspectRatio: '2/3', objectFit: 'cover' },
  playerOverlay: { position: 'fixed', inset: 0, background: '#000', zIndex: 100, display: 'flex', flexDirection: 'column' },
  playerBar: { padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111' },
  playerTitle: { fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60%' },
  closeBtn: { background: '#e50914', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px' },
  iframeWrapper: { flex: 1, width: '100%', height: '100%', background: '#000' },
  iframe: { width: '100%', height: '100%', border: 'none' }
};
