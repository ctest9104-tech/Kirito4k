import React, { useState, useEffect } from "react";

// This is a public OMDb mirror that doesn't require a personal key for basic searches
const API_URL = "https://www.omdbapi.com/?apikey=6924b423";

export default function App() {
  const [movies, setMovies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  // Initial Trending Load
  useEffect(() => {
    searchMovies("Batman"); // Loads a default set of movies
  }, []);

  const searchMovies = async (title) => {
    try {
      const res = await fetch(`${API_URL}&s=${title || "Marvel"}`);
      const data = await res.json();
      if (data.Search) {
        setMovies(data.Search);
        setError("");
      } else {
        setError("No movies found. Try another search.");
      }
    } catch (err) {
      setError("Network error. Try turning off your VPN.");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchMovies(query);
  };

  return (
    <div style={s.container}>
      <nav style={s.nav}>
        <h1 style={s.logo} onClick={() => window.location.reload()}>KIRITO4K</h1>
        <form onSubmit={handleSearch} style={s.searchBar}>
          <input 
            type="text" 
            placeholder="Search Movie..." 
            style={s.input} 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
          />
        </form>
      </nav>

      {error && <p style={s.error}>{error}</p>}

      <div style={s.grid}>
        {movies.map(m => (
          <div key={m.imdbID} style={s.card} onClick={() => setSelected(m)}>
            <img 
              src={m.Poster !== "N/A" ? m.Poster : "https://via.placeholder.com/300x450?text=No+Poster"} 
              style={s.poster} 
            />
            <p style={s.title}>{m.Title}</p>
          </div>
        ))}
      </div>

      {selected && (
        <div style={s.playerOverlay}>
          <div style={s.playerBar}>
            <span style={s.playerTitle}>{selected.Title}</span>
            <button onClick={() => setSelected(null)} style={s.closeBtn}>✕ CLOSE</button>
          </div>
          <iframe 
            /* Using Nepu.to with the IMDb ID from OMDb */
            src={`https://nepu.to/embed/movie/${selected.imdbID}`}
            style={s.iframe}
            allowFullScreen
            sandbox="allow-forms allow-scripts allow-same-origin"
          />
        </div>
      )}
    </div>
  );
}

const s = {
  container: { background: '#050505', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' },
  nav: { padding: '15px', background: '#000', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 },
  logo: { color: '#e50914', margin: 0, fontSize: '20px', fontWeight: '900', cursor: 'pointer' },
  searchBar: { flex: 1, marginLeft: '15px' },
  input: { width: '100%', padding: '10px', borderRadius: '5px', border: 'none', background: '#111', color: '#fff' },
  grid: { padding: '15px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '15px' },
  card: { cursor: 'pointer', textAlign: 'center' },
  poster: { width: '100%', borderRadius: '5px', aspectRatio: '2/3', objectFit: 'cover' },
  title: { fontSize: '10px', marginTop: '5px', opacity: 0.7 },
  error: { textAlign: 'center', color: '#555', fontSize: '12px' },
  playerOverlay: { position: 'fixed', inset: 0, background: '#000', zIndex: 100, display: 'flex', flexDirection: 'column' },
  playerBar: { padding: '15px', display: 'flex', justifyContent: 'space-between', background: '#111' },
  playerTitle: { fontSize: '14px', fontWeight: 'bold' },
  closeBtn: { background: '#e50914', color: '#fff', border: 'none', padding: '5px 15px', borderRadius: '4px' },
  iframe: { flex: 1, width: '100%', border: 'none' }
};
