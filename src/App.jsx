import { useState, useEffect, useRef } from "react";
import Hls from "hls.js";

const TMDB_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzMTVjYWYzNjkxNTc1OGIwMDFlOTYwMzg5OWJlOTY3MCIsIm5iZiI6MTc3NTcxMjQyNy44MTksInN1YiI6IjY5ZDczOGFiNTIzNzlkODZhY2Q3NzE4YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ID34IJ0N4KSVI4UIziKBwiPR2NQlLAnblAxZC48GWS8";
const TMDB = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

const tmdb = async (path) => {
  const r = await fetch(`${TMDB}${path}`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } });
  return r.json();
};

function Player({ media, onClose }) {
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [useIframe, setUseIframe] = useState(false);
  const [status, setStatus] = useState("Searching for stream...");

  // Fallback for when direct links are blocked
  const fallbackUrl = media.episode 
    ? `https://vidsrc.me/embed/tv?tmdb=${media.tmdbId}&s=${media.season}&e=${media.episode}`
    : `https://vidsrc.me/embed/movie?tmdb=${media.tmdbId}`;

  useEffect(() => {
    let hls;
    const init = async () => {
      try {
        const query = media.episode ? `tmdb=${media.tmdbId}&season=${media.season}&episode=${media.episode}` : `tmdb=${media.tmdbId}`;
        const res = await fetch(`/api/scrape?${query}`);
        const data = await res.json();

        if (data.url) {
          setStatus(`Playing via ${data.provider} (Ad-Free)`);
          if (Hls.isSupported()) {
            hls = new Hls();
            hls.loadSource(data.url);
            hls.attachMedia(videoRef.current);
            hls.on(Hls.Events.MANIFEST_PARSED, () => { setLoading(false); videoRef.current.play(); });
          } else { setUseIframe(true); }
        } else { throw new Error(); }
      } catch {
        setStatus("Fallback Mode (Popups Blocked)");
        setUseIframe(true);
        setLoading(false);
      }
    };
    init();
    return () => hls?.destroy();
  }, [media]);

  return (
    <div className="player-overlay">
      <div className="player-bar">
        <span>{status.toUpperCase()}</span>
        <button onClick={onClose}>CLOSE</button>
      </div>
      {loading && <div className="spinner-box"><div className="spinner"></div></div>}
      {useIframe ? (
        <iframe src={fallbackUrl} frameBorder="0" allowFullScreen sandbox="allow-forms allow-scripts allow-same-origin" />
      ) : (
        <video ref={videoRef} controls playsInline style={{display: loading ? 'none' : 'block'}} />
      )}
    </div>
  );
}

function Detail({ item, onClose }) {
  const [d, setD] = useState(null);
  const [season, setSeason] = useState(1);
  const [eps, setEps] = useState([]);
  const [playing, setPlaying] = useState(null);
  const type = item.title ? "movie" : "tv";

  useEffect(() => { tmdb(`/${type}/${item.id}`).then(setD); }, [item]);
  useEffect(() => { if (type === "tv") tmdb(`/tv/${item.id}/season/${season}`).then(r => setEps(r?.episodes || [])); }, [season, item.id]);

  if (!d) return null;

  return (
    <div className="detail-screen">
      <div className="detail-content">
        <button className="back-btn" onClick={onClose}>← BACK</button>
        <h1>{d.title || d.name}</h1>
        <p className="overview">{d.overview}</p>
        <button className="main-play" onClick={() => setPlaying({ tmdbId: item.id, season, episode: 1 })}>WATCH NOW</button>

        {type === "tv" && (
          <div className="tv-controls">
            <select value={season} onChange={e => setSeason(e.target.value)}>
              {d.seasons?.filter(s => s.season_number > 0).map(s => <option key={s.id} value={s.season_number}>Season {s.season_number}</option>)}
            </select>
            <div className="episode-grid">
              {eps.map(ep => <div key={ep.id} className="ep-card" onClick={() => setPlaying({ tmdbId: item.id, season, episode: ep.episode_number })}>E{ep.episode_number}: {ep.name}</div>)}
            </div>
          </div>
        )}
      </div>
      {playing && <Player media={playing} onClose={() => setPlaying(null)} />}
    </div>
  );
}

export default function App() {
  const [rows, setRows] = useState([]);
  const [detail, setDetail] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    tmdb("/trending/all/week").then(data => setRows(data.results || []));
  }, []);

  const filtered = search ? rows.filter(r => (r.title || r.name).toLowerCase().includes(search.toLowerCase())) : rows;

  return (
    <div className="app-container">
      <style>{`
        :root { --red: #e50914; --bg: #050505; }
        body { margin: 0; background: var(--bg); color: white; font-family: 'Inter', sans-serif; }
        .nav { height: 70px; display: flex; align-items: center; padding: 0 40px; background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent); position: fixed; width: 100%; z-index: 100; box-sizing: border-box; }
        .logo { color: var(--red); font-weight: 900; font-size: 28px; letter-spacing: -1px; cursor: pointer; }
        .search-bar { margin-left: auto; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 8px 15px; border-radius: 20px; outline: none; }
        .hero-sec { padding: 100px 40px 40px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 20px; }
        .movie-card { cursor: pointer; transition: 0.3s; }
        .movie-card:hover { transform: scale(1.05); }
        .movie-card img { width: 100%; border-radius: 10px; box-shadow: 0 10px 20px rgba(0,0,0,0.5); }
        .detail-screen { position: fixed; inset: 0; background: var(--bg); z-index: 200; overflow-y: auto; padding: 50px; }
        .back-btn { background: none; border: 1px solid #333; color: white; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-bottom: 20px; }
        .main-play { background: var(--red); color: white; border: none; padding: 15px 40px; border-radius: 5px; font-weight: bold; font-size: 18px; cursor: pointer; margin: 20px 0; }
        .overview { color: #aaa; max-width: 700px; line-height: 1.6; }
        .episode-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; margin-top: 20px; }
        .ep-card { background: #111; padding: 15px; border-radius: 8px; cursor: pointer; border: 1px solid #222; }
        .ep-card:hover { border-color: var(--red); }
        .player-overlay { position: fixed; inset: 0; background: black; z-index: 1000; display: flex; flex-direction: column; }
        .player-bar { padding: 15px 25px; display: flex; justify-content: space-between; align-items: center; background: #0a0a0a; border-bottom: 1px solid #222; font-size: 11px; font-weight: bold; }
        .player-bar button { background: var(--red); color: white; border: none; padding: 5px 15px; border-radius: 4px; cursor: pointer; }
        iframe, video { width: 100%; flex: 1; border: none; }
        .spinner-box { margin: auto; }
        .spinner { width: 40px; height: 40px; border: 4px solid #222; border-top-color: var(--red); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        select { background: #222; color: white; padding: 10px; border-radius: 5px; border: none; margin-bottom: 20px; }
      `}</style>

      <nav className="nav">
        <div className="logo">KIRITO4K</div>
        <input className="search-bar" placeholder="Search movies..." onChange={e => setSearch(e.target.value)} />
      </nav>

      <div className="hero-sec">
        <h2>Trending Now</h2>
        <div className="grid">
          {filtered.map(m => (
            <div key={m.id} className="movie-card" onClick={() => setDetail(m)}>
              <img src={`${IMG}/w500${m.poster_path}`} alt={m.title} />
            </div>
          ))}
        </div>
      </div>

      {detail && <Detail item={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
