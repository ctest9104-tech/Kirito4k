import { useState, useEffect, useRef } from "react";
import Hls from "hls.js";

const TMDB_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzMTVjYWYzNjkxNTc1OGIwMDFlOTYwMzg5OWJlOTY3MCIsIm5iZiI6MTc3NTcxMjQyNy44MTksInN1YiI6IjY5ZDczOGFiNTIzNzlkODZhY2Q3NzE4YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ID34IJ0N4KSVI4UIziKBwiPR2NQlLAnblAxZC48GWS8";
const TMDB_URL = "https://api.themoviedb.org/3";
const IMG_PATH = "https://image.tmdb.org/t/p/w500";

const api = async (p) => {
  const r = await fetch(`${TMDB_URL}${p}`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } });
  return r.json();
};

function Player({ media, onClose }) {
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("auto"); // 'auto', 'direct', or 'embed'
  const [status, setStatus] = useState("Bypassing ads...");

  const mirrors = {
    vidsrc: media.episode ? `https://vidsrc.me/embed/tv?tmdb=${media.id}&s=${media.season}&e=${media.episode}` : `https://vidsrc.me/embed/movie?tmdb=${media.id}`,
    vidsrcicu: media.episode ? `https://vidsrc.icu/embed/tv/${media.id}/${media.season}/${media.episode}` : `https://vidsrc.icu/embed/movie/${media.id}`
  };

  useEffect(() => {
    let hls;
    const start = async () => {
      try {
        const query = media.episode ? `tmdb=${media.id}&season=${media.season}&episode=${media.episode}` : `tmdb=${media.id}`;
        const res = await fetch(`/api/scrape?${query}`);
        const data = await res.json();

        if (data.url) {
          setStatus(`Streaming: ${data.provider} (Ad-Free)`);
          if (Hls.isSupported()) {
            hls = new Hls();
            hls.loadSource(data.url);
            hls.attachMedia(videoRef.current);
            hls.on(Hls.Events.MANIFEST_PARSED, () => { setLoading(false); videoRef.current.play(); });
          } else { setMode("embed"); }
        } else { throw new Error(); }
      } catch {
        setStatus("Mirror Mode (Ad-Block Recommended)");
        setMode("embed");
        setLoading(false);
      }
    };
    start();
    return () => hls?.destroy();
  }, [media]);

  return (
    <div className="player-wrap">
      <div className="player-header">
        <span>{status}</span>
        <button onClick={onClose}>✕</button>
      </div>
      {loading && <div className="loader"><div className="spin"></div></div>}
      {mode === "embed" ? (
        <iframe src={mirrors.vidsrcicu} frameBorder="0" allowFullScreen sandbox="allow-forms allow-scripts allow-same-origin" />
      ) : (
        <video ref={videoRef} controls playsInline style={{display: loading ? 'none' : 'block'}} />
      )}
    </div>
  );
}

function Details({ item, onClose }) {
  const [d, setD] = useState(null);
  const [season, setSeason] = useState(1);
  const [eps, setEps] = useState([]);
  const [play, setPlay] = useState(null);
  const type = item.title ? "movie" : "tv";

  useEffect(() => { api(`/${type}/${item.id}`).then(setD); }, [item]);
  useEffect(() => { if (type === "tv") api(`/tv/${item.id}/season/${season}`).then(r => setEps(r.episodes || [])); }, [season, item.id]);

  if (!d) return null;

  return (
    <div className="overlay">
      <button className="back" onClick={onClose}>← BROWSE</button>
      <div className="flex">
        <img className="side-poster" src={`${IMG_PATH}${d.poster_path}`} />
        <div className="details">
          <h1>{d.title || d.name}</h1>
          <p className="meta">{d.vote_average?.toFixed(1)} ⭐ • {d.release_date || d.first_air_date}</p>
          <p className="desc">{d.overview}</p>
          {type === "movie" && <button className="play-btn" onClick={() => setPlay({id: d.id, type: 'movie'})}>WATCH NOW</button>}
        </div>
      </div>

      {type === "tv" && (
        <div className="tv-section">
          <select value={season} onChange={e => setSeason(e.target.value)}>
            {d.seasons?.filter(s => s.season_number > 0).map(s => <option key={s.id} value={s.season_number}>Season {s.season_number}</option>)}
          </select>
          <div className="ep-grid">
            {eps.map(e => <div key={e.id} className="ep" onClick={() => setPlay({id: d.id, type: 'tv', season, episode: e.episode_number})}>E{e.episode_number}: {e.name}</div>)}
          </div>
        </div>
      )}
      {play && <Player media={play} onClose={() => setPlay(null)} />}
    </div>
  );
}

export default function App() {
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => { api("/trending/all/day").then(r => setList(r.results || [])); }, []);

  const filtered = query ? list.filter(i => (i.title || i.name).toLowerCase().includes(query.toLowerCase())) : list;

  return (
    <div className="main">
      <style>{`
        :root { --red: #ff0000; --bg: #000; }
        body { background: var(--bg); color: #fff; font-family: sans-serif; margin: 0; }
        .nav { height: 70px; display: flex; align-items: center; padding: 0 5%; background: rgba(0,0,0,0.9); position: fixed; width: 100%; box-sizing: border-box; z-index: 100; }
        .logo { font-size: 24px; font-weight: 900; color: var(--red); cursor: pointer; }
        .search { margin-left: auto; background: #111; border: 1px solid #333; color: #fff; padding: 10px 20px; border-radius: 30px; outline: none; width: 250px; }
        .grid { padding: 100px 5% 40px; display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 20px; }
        .card { cursor: pointer; transition: 0.3s; position: relative; }
        .card:hover { transform: translateY(-10px); }
        .card img { width: 100%; border-radius: 12px; }
        .overlay { position: fixed; inset: 0; background: var(--bg); z-index: 200; overflow-y: auto; padding: 50px 5%; }
        .back { background: none; border: 1px solid #333; color: #fff; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-bottom: 20px; }
        .flex { display: flex; gap: 40px; flex-wrap: wrap; }
        .side-poster { width: 300px; border-radius: 15px; }
        .details { flex: 1; min-width: 300px; }
        .play-btn { background: var(--red); color: #fff; border: none; padding: 15px 50px; border-radius: 10px; font-weight: bold; cursor: pointer; margin-top: 20px; }
        .ep-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 10px; margin-top: 20px; }
        .ep { background: #111; padding: 15px; border-radius: 8px; cursor: pointer; border: 1px solid #222; }
        .ep:hover { border-color: var(--red); }
        .player-wrap { position: fixed; inset: 0; background: #000; z-index: 1000; display: flex; flex-direction: column; }
        .player-header { padding: 15px 30px; display: flex; justify-content: space-between; background: #050505; border-bottom: 1px solid #111; font-size: 11px; }
        .player-header button { background: var(--red); border: none; color: #fff; padding: 5px 15px; cursor: pointer; }
        video, iframe { flex: 1; border: none; }
        .loader { margin: auto; }
        .spin { width: 40px; height: 40px; border: 4px solid #111; border-top-color: var(--red); border-radius: 50%; animation: s 1s linear infinite; }
        @keyframes s { to { transform: rotate(360deg); } }
      `}</style>

      <nav className="nav">
        <div className="logo" onClick={() => setSelected(null)}>KIRITO4K</div>
        <input className="search" placeholder="Search..." value={query} onChange={e => setQuery(e.target.value)} />
      </nav>

      <div className="grid">
        {filtered.map(it => <div key={it.id} className="card" onClick={() => setSelected(it)}><img src={`${IMG_PATH}${it.poster_path}`} /></div>)}
      </div>

      {selected && <Details item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
