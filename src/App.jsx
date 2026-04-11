import { useState, useEffect, useRef } from "react";

// Replace with your actual TMDB Key from their website if this one expires
const TMDB_KEY = "315caf36915c58b001e9603899be9670"; 
const IMG = "https://image.tmdb.org/t/p/w500";

function Player({ media, onClose }) {
  const [source, setSource] = useState(0);
  
  // These are the 2026 "Ultra-Stable" mirrors
  const providers = [
    { name: "Primary", url: (id) => `https://vidsrc.icu/embed/movie/${id}`, tv: (id, s, e) => `https://vidsrc.icu/embed/tv/${id}/${s}/${e}` },
    { name: "Mirror A", url: (id) => `https://vidsrc.pm/embed/movie/${id}`, tv: (id, s, e) => `https://vidsrc.pm/embed/tv/${id}/${s}/${e}` },
    { name: "Mirror B", url: (id) => `https://vidsrc.me/embed/movie?tmdb=${id}`, tv: (id, s, e) => `https://vidsrc.me/embed/tv?tmdb=${id}&s=${s}&e=${e}` }
  ];

  const current = providers[source];
  const srcUrl = media.type === "movie" ? current.url(media.id) : current.tv(media.id, media.s, media.e);

  return (
    <div style={{position:'fixed', inset:0, background:'#000', zIndex:1000, display:'flex', flexDirection:'column'}}>
      <div style={{padding:'10px 20px', background:'#111', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', gap:'10px'}}>
          {providers.map((p, i) => (
            <button key={i} onClick={() => setSource(i)} style={{background: source === i ? '#e50914' : '#333', color:'#fff', border:'none', padding:'5px 10px', borderRadius:'4px', fontSize:'12px'}}>
              {p.name}
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{background:'none', border:'none', color:'#fff', fontSize:'20px', cursor:'pointer'}}>✕</button>
      </div>
      <iframe src={srcUrl} style={{flex:1, border:'none'}} allowFullScreen sandbox="allow-forms allow-scripts allow-same-origin" />
    </div>
  );
}

export default function App() {
  const [movies, setMovies] = useState([]);
  const [view, setView] = useState(null);
  const [play, setPlay] = useState(null);

  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/trending/all/day?api_key=${TMDB_KEY}`)
      .then(res => res.json()).then(data => setMovies(data.results || []));
  }, []);

  return (
    <div style={{background:'#050505', color:'#fff', minHeight:'100vh', fontFamily:'sans-serif'}}>
      <nav style={{padding:'20px 40px', fontSize:'24px', fontWeight:'900', color:'#e50914', position:'fixed', top:0, width:'100%', background:'linear-gradient(to bottom, #000, transparent)', zIndex:100}}>
        KIRITO4K
      </nav>

      <div style={{padding:'100px 40px 40px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:'20px'}}>
        {movies.map(m => (
          <div key={m.id} onClick={() => setView(m)} style={{cursor:'pointer', transition:'0.3s'}} onMouseEnter={e => e.currentTarget.style.transform='scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
            <img src={IMG + m.poster_path} style={{width:'100%', borderRadius:'8px', boxShadow:'0 10px 20px rgba(0,0,0,0.5)'}} />
          </div>
        ))}
      </div>

      {view && (
        <div style={{position:'fixed', inset:0, background:'#050505', zIndex:200, padding:'60px', overflowY:'auto'}}>
          <button onClick={() => setView(null)} style={{background:'none', border:'1px solid #333', color:'#fff', padding:'10px 20px', borderRadius:'5px', cursor:'pointer'}}>← BACK</button>
          <div style={{display:'flex', gap:'40px', marginTop:'40px', flexWrap:'wrap'}}>
            <img src={IMG + view.poster_path} style={{width:'300px', borderRadius:'12px'}} />
            <div style={{flex:1, minWidth:'300px'}}>
              <h1 style={{fontSize:'48px', margin:'0 0 20px'}}>{view.title || view.name}</h1>
              <p style={{color:'#aaa', lineHeight:'1.6', fontSize:'18px'}}>{view.overview}</p>
              <button onClick={() => setPlay({id: view.id, type: view.title ? "movie" : "tv", s: 1, e: 1})} style={{background:'#e50914', color:'#fff', border:'none', padding:'15px 40px', borderRadius:'5px', fontSize:'18px', fontWeight:'bold', marginTop:'20px', cursor:'pointer'}}>WATCH NOW</button>
            </div>
          </div>
        </div>
      )}

      {play && <Player media={play} onClose={() => setPlay(null)} />}
    </div>
  );
}
