import React, { useState, useEffect, useRef } from "react";
import WebTorrent from "webtorrent";

const TMDB_KEY = "315caf36915c58b001e9603899be9670"; 
const client = new WebTorrent({ dht: false });

function Player({ item, onClose }) {
  const videoRef = useRef(null);
  const [mode, setMode] = useState("p2p"); // 'p2p' or 'web'
  const [progress, setProgress] = useState(0);

  // Fallback Web URL if Torrent has no seeds
  const webUrl = item.first_air_date 
    ? `https://vidsrc.icu/embed/tv/${item.id}/1/1` 
    : `https://vidsrc.icu/embed/movie/${item.id}`;

  useEffect(() => {
    if (mode === "p2p") {
      // Sample Magnet logic - in a full build, you'd fetch the hash from an API
      const testMagnet = "magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969";
      
      client.add(testMagnet, (torrent) => {
        const file = torrent.files.find(f => f.name.endsWith('.mp4') || f.name.endsWith('.mkv') || f.name.endsWith('.webm'));
        if (file) file.renderTo(videoRef.current);
        torrent.on('download', () => setProgress(Math.round(torrent.progress * 100)));
      });
    }

    return () => {
      const torrents = client.torrents;
      torrents.forEach(t => t.destroy());
    };
  }, [mode]);

  return (
    <div style={styles.playerOverlay}>
      <div style={styles.playerBar}>
        <div style={{display:'flex', gap:'10px'}}>
          <button onClick={() => setMode('p2p')} style={mode === 'p2p' ? styles.activeBtn : styles.btn}>P2P Engine {progress > 0 && `(${progress}%)`}</button>
          <button onClick={() => setMode('web')} style={mode === 'web' ? styles.activeBtn : styles.btn}>Web Server (Direct)</button>
        </div>
        <button onClick={onClose} style={styles.closeBtn}>✕ CLOSE</button>
      </div>

      {mode === 'p2p' ? (
        <div style={{flex:1, display:'flex', flexDirection:'column', background:'#000'}}>
          <video ref={videoRef} controls autoPlay style={{width:'100%', height:'100%'}} />
          {progress === 0 && <div style={styles.loader}>Searching for peers...</div>}
        </div>
      ) : (
        <iframe src={webUrl} style={{flex:1, border:'none'}} allowFullScreen sandbox="allow-forms allow-scripts allow-same-origin" />
      )}
    </div>
  );
}

export default function App() {
  const [movies, setMovies] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/trending/all/day?api_key=${TMDB_KEY}`)
      .then(res => res.json())
      .then(data => setMovies(data.results || []));
  }, []);

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <span style={styles.logo}>KIRITO4K</span>
        <span style={styles.tagline}>BYPASS MODE ACTIVE</span>
      </nav>

      <div style={styles.grid}>
        {movies.map(m => (
          <div key={m.id} style={styles.card} onClick={() => setSelected(m)}>
            <img 
              src={`https://image.tmdb.org/t/p/w500${m.poster_path}`} 
              style={styles.poster} 
              alt={m.title} 
            />
            <div style={styles.cardOverlay}>
              <div style={styles.playIcon}>▶</div>
            </div>
          </div>
        ))}
      </div>

      {selected && <Player item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

const styles = {
  container: { background: '#050505', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' },
  nav: { padding: '20px 5%', display: 'flex', alignItems: 'baseline', gap: '15px', background: 'linear-gradient(to bottom, #000, transparent)' },
  logo: { fontSize: '28px', fontWeight: '900', color: '#e50914', letterSpacing: '-1px' },
  tagline: { fontSize: '10px', color: '#555', fontWeight: 'bold' },
  grid: { padding: '20px 5%', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px' },
  card: { position: 'relative', cursor: 'pointer', borderRadius: '8px', overflow: 'hidden', transition: '0.3s' },
  poster: { width: '100%', display: 'block' },
  cardOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', opacity: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.3s' },
  playIcon: { fontSize: '40px', color: '#fff' },
  playerOverlay: { position: 'fixed', inset: 0, background: '#000', zIndex: 1000, display: 'flex', flexDirection: 'column' },
  playerBar: { padding: '10px 20px', background: '#111', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222' },
  btn: { background: '#222', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' },
  activeBtn: { background: '#e50914', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' },
  closeBtn: { background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' },
  loader: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#666' }
};
