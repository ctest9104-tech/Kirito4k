import React, { useState, useEffect } from "react";

// Using a fresh TMDB key or your own is recommended
const TMDB_KEY = "315caf36915c58b001e9603899be9670";

export default function App() {
  const [movies, setMovies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");

  const fetchTrending = () => {
    fetch(`https://api.themoviedb.org/3/trending/all/day?api_key=${TMDB_KEY}`)
      .then(res => res.json())
      .then(data => setMovies(data.results || []))
      .catch(err => console.error("Data fetch failed"));
  };

  const searchMovies = (e) => {
    e.preventDefault();
    if (!query) return;
    fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${query}`)
      .then(res => res.json())
      .then(data => setMovies(data.results || []));
  };

  useEffect(() => {
    fetchTrending();
  }, []);

  return (
    <div style={styles.container}>
      {/* Header with Search */}
      <nav style={styles.nav}>
        <span style={styles.logo} onClick={() => window.location.reload()}>KIRITO4K</span>
        <form onSubmit={searchMovies} style={styles.searchForm}>
          <input 
            type="text" 
            placeholder="Search movie or show..." 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            style={styles.searchInput}
          />
        </form>
      </nav>

      {/* Movie Grid */}
      <div style={styles.grid}>
        {movies.length > 0 ? movies.map(m => (
          <div key={m.id} style={styles.card} onClick={() => setSelected(m)}>
            <img 
              src={m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : "https://via.placeholder.com/500x750?text=No+Image"} 
              style={styles.poster} 
              alt="" 
            />
            <p style={styles.titleText}>{m.title || m.name}</p>
          </div>
        )) : (
          <div style={{gridColumn: '1/-1', textAlign: 'center', marginTop: '50px'}}>
            <p>No content found. Try searching or check your connection.</p>
            <button onClick={fetchTrending} style={styles.refreshBtn}>Reload Trending</button>
          </div>
        )}
      </div>

      {/* Player Overlay */}
      {selected && (
        <div style={styles.playerOverlay}>
          <div style={styles.playerBar}>
            <span style={{fontSize: '14px', fontWeight: 'bold'}}>{selected.title || selected.name}</span>
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
  nav: { padding: '15px 5%', background: '#000', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 },
  logo: { fontSize: '22px', fontWeight: '900', color: '#e50914', cursor: 'pointer' },
  searchForm: { flex: 1, marginLeft: '20px', maxWidth: '400px' },
  searchInput: { width: '100%', padding: '8px 15px', borderRadius: '20px', border: '1px solid #333', background: '#111', color: '#fff', outline: 'none' },
  grid: { padding: '20px 5%', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '15px' },
  card: { cursor: 'pointer', borderRadius: '4px', overflow: 'hidden', textAlign: 'center' },
  poster: { width: '100%', display: 'block', borderRadius: '4px' },
  titleText: { fontSize: '10px', marginTop: '5px', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  playerOverlay: { position: 'fixed', inset: 0, background: '#000', zIndex: 1000, display: 'flex', flexDirection: 'column' },
  playerBar: { padding: '15px', background: '#111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { background: '#e50914', color: '#fff', border: 'none', padding: '5px 15px', borderRadius: '4px' },
  refreshBtn: { marginTop: '20px', background: '#333', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }
};
