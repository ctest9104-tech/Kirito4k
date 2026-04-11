import React, { useState, useEffect } from "react";

export default function App() {
  const [movies, setMovies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // 2026 Keyless Indexer: Fetches trending content directly from the mirror feed
  const loadTrending = async () => {
    try {
      const res = await fetch("https://vidsrc.icu/api/trending");
      const data = await res.json();
      setMovies(data.results || []);
    } catch (err) {
      // Fallback: If the indexer is down, show a high-quality static list
      setMovies([
        { id: "tt15239678", title: "Dune: Part Two", poster: "https://image.tmdb.org/t/p/w500/8uVKf6hadi2jT60p4Fc9p0tQNfs.jpg" },
        { id: "tt1160419", title: "Dune", poster: "https://image.tmdb.org/t/p/w500/d5N0BbxWnTzP3SvcZ0uW9p2zYQO.jpg" },
        { id: "tt1677720", title: "The Batman", poster: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T6fujdq.jpg" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTrending(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    // Search using the public OMDb fallback mirror
    fetch(`https://www.omdbapi.com/?apikey=6924b423&s=${query}`)
      .then(res => res.json())
      .then(data => {
        const formatted = data.Search?.map(m => ({ id: m.imdbID, title: m.Title, poster: m.Poster })) || [];
        setMovies(formatted);
        setLoading(false);
      });
  };

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <h1 style={styles.logo} onClick={() => window.location.reload()}>KIRITO4K</h1>
        <form onSubmit={handleSearch} style={styles.searchBox}>
          <input 
            type="text" 
            placeholder="Search movie..." 
            style={styles.input} 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
          />
        </form>
      </nav>

      <div style={styles.grid}>
        {movies.map(m => (
          <div key={m.id} style={styles.card} onClick={() => setSelected(m)}>
            <img src={m.poster || m.Poster} style={styles.poster} alt="" />
          </div>
        ))}
      </div>

      {selected && (
        <div style={styles.playerOverlay}>
          <div style={styles.playerBar}>
            <span style={styles.playerTitle}>{selected.title || selected.Title}</span>
            <button onClick={() => setSelected(null)} style={styles.closeBtn}>✕ CLOSE</button>
          </div>
          <iframe 
            src={`https://nepu.to/embed/movie/${selected.id || selected.imdbID}`}
            style={styles.iframe}
            allowFullScreen
            /* THE SHIELD: allow-popups is REMOVED to keep it ad-free */
            sandbox="allow-forms allow-scripts allow-same-origin"
          />
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { background: '#050505', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' },
  nav: { padding: '15px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000', position: 'sticky', top: 0, zIndex: 10 },
  logo: { color: '#e50914', margin: 0, fontSize: '22px', fontWeight: '900', cursor: 'pointer' },
  searchBox: { flex: 1, marginLeft: '20px' },
  input: { width: '100%', padding: '10px 15px', borderRadius: '25px', border: '1px solid #222', background: '#111', color: '#fff', outline: 'none' },
  grid: { padding: '15px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '12px' },
  card: { borderRadius: '6px', overflow: 'hidden', cursor: 'pointer', background: '#111', aspectRatio: '2/3' },
  poster: { width: '100%', height: '100%', objectFit: 'cover' },
  playerOverlay: { position: 'fixed', inset: 0, background: '#000', zIndex: 100, display: 'flex', flexDirection: 'column' },
  playerBar: { padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111' },
  playerTitle: { fontSize: '14px', fontWeight: 'bold' },
  closeBtn: { background: '#e50914', color: '#fff', border: 'none', padding: '6px 15px', borderRadius: '4px', cursor: 'pointer' },
  iframe: { flex: 1, width: '100%', border: 'none' }
};
