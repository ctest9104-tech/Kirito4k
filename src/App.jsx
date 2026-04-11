import React, { useState, useEffect } from "react";

export default function App() {
  const [movies, setMovies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [source, setSource] = useState("vidsrc"); // vidsrc, superembed, 2embed
  const [query, setQuery] = useState("");

  useEffect(() => {
    // 2026 Keyless Trending Mirror
    fetch("https://vidsrc.icu/api/trending")
      .then(res => res.json())
      .then(data => setMovies(data.results || []))
      .catch(() => setMovies([
        { id: "tt15239678", title: "Dune: Part Two", poster: "https://image.tmdb.org/t/p/w500/8uVKf6hadi2jT60p4Fc9p0tQNfs.jpg" },
        { id: "tt1677720", title: "The Batman", poster: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T6fujdq.jpg" }
      ]));
  }, []);

  const getPlayerUrl = (item) => {
    const id = item.id || item.imdbID;
    const isTV = !!item.first_air_date;
    
    // Engine Logic: Multi-source for 100% uptime
    const engines = {
      vidsrc: isTV ? `https://vidsrc.me/embed/tv?imdb=${id}&sea=1&epi=1` : `https://vidsrc.me/embed/movie?imdb=${id}`,
      superembed: isTV ? `https://multiembed.mov/?video_id=${id}&tmdb=1&s=1&e=1` : `https://multiembed.mov/?video_id=${id}&tmdb=1`,
      twoembed: isTV ? `https://www.2embed.cc/embedtv/${id}&s=1&e=1` : `https://www.2embed.cc/embed/${id}`
    };
    return engines[source];
  };

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <h1 style={styles.logo} onClick={() => window.location.reload()}>KIRITO4K</h1>
        <input 
          placeholder="Search..." 
          style={styles.input} 
          onChange={(e) => setQuery(e.target.value)} 
        />
      </nav>

      <div style={styles.grid}>
        {movies.filter(m => !query || (m.title || m.Title).toLowerCase().includes(query.toLowerCase())).map(m => (
          <div key={m.id || m.imdbID} style={styles.card} onClick={() => setSelected(m)}>
            <img src={m.poster || `https://image.tmdb.org/t/p/w342${m.poster_path}`} style={styles.poster} />
          </div>
        ))}
      </div>

      {selected && (
        <div style={styles.overlay}>
          <div style={styles.playerBar}>
            <div style={{display:'flex', gap:'5px'}}>
              <button onClick={() => setSource('vidsrc')} style={source === 'vidsrc' ? styles.activeBtn : styles.btn}>Source 1</button>
              <button onClick={() => setSource('superembed')} style={source === 'superembed' ? styles.activeBtn : styles.btn}>Source 2</button>
              <button onClick={() => setSource('twoembed')} style={source === 'twoembed' ? styles.activeBtn : styles.btn}>Source 3</button>
            </div>
            <button onClick={() => setSelected(null)} style={styles.closeBtn}>✕</button>
          </div>
          <iframe 
            src={getPlayerUrl(selected)} 
            style={styles.iframe} 
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
  nav: { padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000', borderBottom: '1px solid #111' },
  logo: { color: '#e50914', fontSize: '20px', fontWeight: '900', cursor: 'pointer' },
  input: { background: '#111', border: '1px solid #222', color: '#fff', padding: '8px 15px', borderRadius: '20px', width: '40%' },
  grid: { padding: '15px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px' },
  card: { cursor: 'pointer', borderRadius: '5px', overflow: 'hidden' },
  poster: { width: '100%', aspectRatio: '2/3', display: 'block' },
  overlay: { position: 'fixed', inset: 0, background: '#000', zIndex: 100, display: 'flex', flexDirection: 'column' },
  playerBar: { padding: '10px', background: '#111', display: 'flex', justifyContent: 'space-between' },
  btn: { background: '#222', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '10px' },
  activeBtn: { background: '#e50914', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' },
  closeBtn: { background: 'none', border: 'none', color: '#fff', fontSize: '18px' },
  iframe: { flex: 1, border: 'none' }
};
