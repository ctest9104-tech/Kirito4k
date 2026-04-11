import { useState, useEffect, useRef } from "react";
import Hls from "hls.js";

// --- CONFIGURATION ---
const TMDB_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzMTVjYWYzNjkxNTc1OGIwMDFlOTYwMzg5OWJlOTY3MCIsIm5iZiI6MTc3NTcxMjQyNy44MTksInN1YiI6IjY5ZDczOGFiNTIzNzlkODZhY2Q3NzE4YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ID34IJ0N4KSVI4UIziKBwiPR2NQlLAnblAxZC48GWS8";
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";

// --- API HELPERS ---
const fetchTMDB = async (path) => {
  const res = await fetch(`${TMDB_BASE}${path}`, {
    headers: { Authorization: `Bearer ${TMDB_TOKEN}` }
  });
  return res.json();
};

// --- COMPONENTS ---

function Player({ media, onClose }) {
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("direct"); // 'direct' or 'iframe'
  const [status, setStatus] = useState("Probing ad-free servers...");

  // 2026 Stable Mirrors for Iframe Fallback
  const getIframeUrl = () => {
    const { id, season, episode, type } = media;
    if (type === "tv") {
      return `https://vidsrc.icu/embed/tv/${id}/${season}/${episode}`;
    }
    return `https://vidsrc.icu/embed/movie/${id}`;
  };

  useEffect(() => {
    let hls;
    const initPlayer = async () => {
      try {
        const params = media.type === "tv" 
          ? `tmdb=${media.id}&season=${media.season}&episode=${media.episode}` 
          : `tmdb=${media.id}`;
        
        const res = await fetch(`/api/scrape?${params}`);
        const data = await res.json();

        if (data.url) {
          setStatus("🛡️ PURE AD-FREE STREAM ACTIVE");
          if (Hls.isSupported()) {
            hls = new Hls();
            hls.loadSource(data.url);
            hls.attachMedia(videoRef.current);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              setLoading(false);
              videoRef.current.play().catch(() => {}); 
            });
          } else {
            setSource("iframe");
          }
        } else {
          throw new Error("No direct link found");
        }
      } catch (err) {
        setStatus("⚠️ MIRROR MODE (AD-BLOCK RECOMMENDED)");
        setSource("iframe");
        setLoading(false);
      }
    };

    initPlayer();
    return () => hls?.destroy();
  }, [media]);

  return (
    <div className="player-overlay">
      <div className="player-bar">
        <span className="status-badge">{status}</span>
        <button className="exit-btn" onClick={onClose}>✕ CLOSE</button>
      </div>
      
      {loading && (
        <div className="loader-container">
          <div className="spinner"></div>
          <p>Optimizing Stream...</p>
        </div>
      )}

      {source === "iframe" ? (
        <iframe 
          src={getIframeUrl()} 
          allowFullScreen 
          sandbox="allow-forms allow-scripts allow-same-origin" 
          onLoad={() => setLoading(false)}
        />
      ) : (
        <video ref={videoRef} controls playsInline style={{ display: loading ? 'none' : 'block' }} />
      )}
    </div>
  );
}

function DetailView({ item, onClose }) {
  const [data, setData] = useState(null);
  const [season, setSeason] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [playing, setPlaying] = useState(null);
  const type = item.title ? "movie" : "tv";

  useEffect(() => {
    fetchTMDB(`/${type}/${item.id}`).then(setData);
  }, [item, type]);

  useEffect(() => {
    if (type === "tv") {
      fetchTMDB(`/tv/${item.id}/season/${season}`).then(res => setEpisodes(res.episodes || []));
    }
  }, [item.id, season, type]);

  if (!data) return null;

  return (
    <div className="detail-screen">
      <button className="back-link" onClick={onClose}>← BACK TO BROWSE</button>
      
      <div className="hero-content">
        <img className="main-poster" src={`${IMG_BASE}${data.poster_path}`} alt="" />
        <div className="text-info">
          <h1>{data.title || data.name}</h1>
          <div className="meta">
            <span className="rating">⭐ {data.vote_average?.toFixed(1)}</span>
            <span>{data.release_date || data.first_air_date}</span>
          </div>
          <p className="description">{data.overview}</p>
          
          {type === "movie" && (
            <button className="play-now" onClick={() => setPlaying({ id: data.id, type: "movie" })}>
              WATCH NOW
            </button>
          )}
        </div>
      </div>

      {type === "tv" && (
        <div className="episode-selector">
          <div className="selector-header">
            <h3>Episodes</h3>
            <select value={season} onChange={(e) => setSeason(e.target.value)}>
              {data.seasons?.filter(s => s.season_number > 0).map(s => (
                <option key={s.id} value={s.season_number}>Season {s.season_number}</option>
              ))}
            </select>
          </div>
          <div className="ep-list">
            {episodes.map(ep => (
              <div key={ep.id} className="ep-row" onClick={() => setPlaying({ id: data.id, type: "tv", season, episode: ep.episode_number })}>
                <span className="ep-num">{ep.episode_number}</span>
                <span className="ep-title">{ep.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {playing && <Player media={playing} onClose={() => setPlaying(null)} />}
    </div>
  );
}

export default function App() {
  const [content, setContent] = useState([]);
  const [selection, setSelection] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchTMDB("/trending/all/day").then(res => setContent(res.results || []));
  }, []);

  const results = search 
    ? content.filter(i => (i.title || i.name).toLowerCase().includes(search.toLowerCase())) 
    : content;

  return (
    <div className="kirito-root">
      <style>{`
        :root { --accent: #e50914; --bg: #0a0a0b; --surface: #141417; }
        body { background: var(--bg); color: white; font-family: 'Inter', system-ui, sans-serif; margin: 0; }
        .navbar { height: 70px; display: flex; align-items: center; padding: 0 4%; background: rgba(0,0,0,0.8); position: fixed; top: 0; width: 100%; z-index: 100; box-sizing: border-box; }
        .logo { font-weight: 900; color: var(--accent); font-size: 24px; letter-spacing: -1px; cursor: pointer; }
        .search-input { margin-left: auto; background: var(--surface); border: 1px solid #333; color: white; padding: 8px 16px; border-radius: 20px; outline: none; width: 250px; }
        .main-grid { padding: 100px 4% 40px; display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 20px; }
        .poster-card { cursor: pointer; transition: transform 0.3s cubic-bezier(0.2, 0, 0.2, 1); }
        .poster-card:hover { transform: scale(1.05); z-index: 2; }
        .poster-card img { width: 100%; border-radius: 8px; box-shadow: 0 10px 20px rgba(0,0,0,0.5); }
        .detail-screen { position: fixed; inset: 0; background: var(--bg); z-index: 200; overflow-y: auto; padding: 40px 6%; }
        .hero-content { display: flex; gap: 40px; margin-top: 30px; flex-wrap: wrap; }
        .main-poster { width: 300px; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.8); }
        .text-info { flex: 1; min-width: 300px; }
        .play-now { background: var(--accent); color: white; border: none; padding: 16px 48px; border-radius: 8px; font-weight: bold; font-size: 18px; cursor: pointer; margin-top: 20px; }
        .ep-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; margin-top: 20px; }
        .ep-row { background: var(--surface); padding: 15px; border-radius: 8px; cursor: pointer; display: flex; gap: 15px; border: 1px solid #222; }
        .ep-row:hover { border-color: var(--accent); }
        .player-overlay { position: fixed; inset: 0; background: black; z-index: 1000; display: flex; flex-direction: column; }
        .player-bar { height: 60px; background: #000; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; border-bottom: 1px solid #222; }
        .status-badge { font-size: 11px; font-weight: bold; color: #888; }
        .exit-btn { background: #222; border: none; color: white; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
        iframe, video { flex: 1; border: none; width: 100%; }
        .loader-container { margin: auto; text-align: center; color: #666; }
        .spinner { width: 40px; height: 40px; border: 3px solid #222; border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 15px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <nav className="navbar">
        <div className="logo" onClick={() => {setSelection(null); setSearch("");}}>KIRITO4K</div>
        <input 
          className="search-input" 
          placeholder="Search movies & shows..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </nav>

      <div className="main-grid">
        {results.map(item => (
          <div key={item.id} className="poster-card" onClick={() => setSelection(item)}>
            <img src={`${IMG_BASE}${item.poster_path}`} alt="" />
          </div>
        ))}
      </div>

      {selection && <DetailView item={selection} onClose={() => setSelection(null)} />}
    </div>
  );
}
