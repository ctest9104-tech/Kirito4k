import { useState, useEffect, useRef } from "react";
import Hls from "hls.js";
import WebTorrent from "webtorrent/dist/webtorrent.min.js";

const TMDB_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzMTVjYWYzNjkxNTc1OGIwMDFlOTYwMzg5OWJlOTY3MCIsIm5iZiI6MTc3NTcxMjQyNy44MTksInN1YiI6IjY5ZDczOGFiNTIzNzlkODZhY2Q3NzE4YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ID34IJ0N4KSVI4UIziKBwiPR2NQlLAnblAxZC48GWS8";
const TMDB = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

async function tmdb(path) {
  const r = await fetch(`${TMDB}${path}`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } });
  return await r.json();
}
const img = (p) => p ? `${IMG}/w500${p}` : "";

const I = {
  Home: () => <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>,
  Film: () => <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/></svg>,
  Tv: () => <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M21 7h-6.7l2.2-2.2c.4-.4.4-1 0-1.4-.4-.4-1-.4-1.4 0L12.5 5.9 9.9 3.4c-.4-.4-1-.4-1.4 0-.4.4-.4 1 0 1.4L10.7 7H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm0 14H3V9h18v12z"/></svg>,
};

function Player({ media, onClose }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("Fetching...");
  const [useIframe, setUseIframe] = useState(false);
  const [loading, setLoading] = useState(true);

  const fallbackUrl = media.episode 
    ? `https://vidsrc.me/embed/tv?tmdb=${media.tmdbId}&s=${media.season}&e=${media.episode}`
    : `https://vidsrc.me/embed/movie?tmdb=${media.tmdbId}`;

  useEffect(() => {
    let hls;
    const client = new WebTorrent();

    const init = async () => {
      try {
        const query = media.episode ? `tmdb=${media.tmdbId}&season=${media.season}&episode=${media.episode}` : `tmdb=${media.tmdbId}`;
        const res = await fetch(`/api/scrape?${query}`);
        const data = await res.json();

        if (data.url) {
          setStatus("🛡️ PURE AD-FREE STREAM");
          if (Hls.isSupported()) {
            hls = new Hls();
            hls.loadSource(data.url);
            hls.attachMedia(videoRef.current);
            hls.on(Hls.Events.MANIFEST_PARSED, () => { setLoading(false); videoRef.current.play(); });
          } else { setUseIframe(true); }
        } else { throw new Error(); }
      } catch {
        setStatus("⚠️ FALLBACK MODE (ANTI-ADS ACTIVE)");
        setUseIframe(true);
        setLoading(false);
      }
    };
    init();
    return () => { hls?.destroy(); client.destroy(); };
  }, [media]);

  return (
    <div className="overlay">
      <div className="bar">
        <span>{status}</span>
        <button onClick={onClose}>EXIT</button>
      </div>
      {loading && <div className="loader">Searching...</div>}
      {useIframe ? (
        <iframe src={fallbackUrl} frameBorder="0" allowFullScreen sandbox="allow-forms allow-scripts allow-same-origin" />
      ) : (
        <video ref={videoRef} controls playsInline style={{display: loading ? 'none' : 'block'}} />
      )}
    </div>
  );
}

function Detail({ item, type, onClose }) {
  const [d, setD] = useState(null);
  const [season, setSeason] = useState(1);
  const [eps, setEps] = useState([]);
  const [playing, setPlaying] = useState(null);
  const t = type || (item.title ? "movie" : "tv");

  useEffect(() => { tmdb(`/${t}/${item.id}`).then(setD); }, [item, t]);
  useEffect(() => { if (t === "tv") tmdb(`/tv/${item.id}/season/${season}`).then(r => setEps(r?.episodes || [])); }, [season, t, item.id]);

  if (!d) return null;

  return (
    <div className="detail">
      <button onClick={onClose} className="back-btn">← BACK</button>
      <div className="hero">
        <img src={img(d.poster_path)} className="poster" />
        <div className="info">
          <h1>{d.title || d.name}</h1>
          <p>{d.overview}</p>
          <button className="play-btn" onClick={() => setPlaying({ tmdbId: item.id, type: t, season, episode: 1 })}>WATCH NOW</button>
        </div>
      </div>
      {t === "tv" && (
        <div className="seasons">
          <select value={season} onChange={e => setSeason(e.target.value)}>
            {d.seasons?.filter(s => s.season_number > 0).map(s => <option key={s.id} value={s.season_number}>Season {s.season_number}</option>)}
          </select>
          <div className="ep-list">
            {eps.map(ep => <div key={ep.id} className="ep-card" onClick={() => setPlaying({ tmdbId: item.id, type: t, season, episode: ep.episode_number })}>E{ep.episode_number}: {ep.name}</div>)}
          </div>
        </div>
      )}
      {playing && <Player media={playing} onClose={() => setPlaying(null)} />}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("home");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [rows, setRows] = useState({});
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    (async () => {
      const [tr, tm, tt] = await Promise.all([tmdb("/trending/all/week"), tmdb("/movie/popular"), tmdb("/tv/popular")]);
      setRows({ trending: tr?.results || [], movies: tm?.results || [], tv: tt?.results || [] });
    })();
  }, []);

  useEffect(() => {
    if (!search) return;
    const t = setTimeout(async () => {
      const r = await tmdb(`/search/multi?query=${encodeURIComponent(search)}`);
      setResults(r?.results || []);
    }, 500);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="app">
      <style>{`
        :root { --r:#e50914; --bg:#08080a; }
        body { background:var(--bg); color:#fff; font-family:sans-serif; margin:0; }
        .nav { position:fixed; top:0; width:100%; height:70px; background:rgba(0,0,0,0.8); display:flex; align-items:center; padding:0 40px; z-index:100; box-sizing:border-box; gap:20px; }
        .brand { color:var(--r); font-weight:900; font-size:24px; cursor:pointer; }
        .tabs { display:flex; gap:10px; }
        .tabs button { background:none; border:none; color:#aaa; cursor:pointer; font-weight:bold; display:flex; align-items:center; gap:5px; padding:10px; }
        .tabs button.on { color:#fff; }
        .search { background:#18181b; border:1px solid #333; color:#fff; padding:8px 15px; border-radius:5px; margin-left:auto; outline:none; }
        .sec { padding:100px 40px 20px; }
        .rl { display:flex; gap:15px; overflow-x:auto; padding-bottom:20px; scrollbar-width:none; }
        .card { flex:0 0 160px; cursor:pointer; transition:0.3s; }
        .card img { width:100%; border-radius:8px; }
        .card:hover { transform:scale(1.05); }
        .detail { position:fixed; inset:0; background:var(--bg); z-index:200; overflow-y:auto; padding:40px; }
        .hero { display:flex; gap:40px; flex-wrap:wrap; margin-top:20px; }
        .poster { width:300px; border-radius:12px; }
        .info { flex:1; min-width:300px; }
        .play-btn { background:var(--r); color:#fff; border:none; padding:15px 40px; border-radius:5px; font-weight:bold; cursor:pointer; font-size:18px; }
        .ep-list { display:grid; grid-template-columns:repeat(auto-fill, minmax(250px, 1fr)); gap:10px; margin-top:20px; }
        .ep-card { background:#18181b; padding:15px; border-radius:8px; cursor:pointer; }
        .overlay { position:fixed; inset:0; background:#000; z-index:1000; display:flex; flex-direction:column; }
        .bar { padding:15px 25px; display:flex; justify-content:space-between; background:#111; border-bottom:1px solid #222; font-size:12px; font-weight:bold; }
        .bar button { background:var(--r); color:#fff; border:none; padding:5px 15px; border-radius:4px; cursor:pointer; }
        iframe, video { width:100%; flex:1; border:none; }
        .loader { margin:auto; }
      `}</style>
      
      <nav className="nav">
        <div className="brand" onClick={() => {setTab("home"); setSearch("");}}>KIRITO4K</div>
        <div className="tabs">
          <button className={tab==="home"?"on":""} onClick={() => setTab("home")}><I.Home/> Home</button>
          <button className={tab==="movies"?"on":""} onClick={() => setTab("movies")}><I.Film/> Movies</button>
          <button className={tab==="tv"?"on":""} onClick={() => setTab("tv")}><I.Tv/> TV</button>
        </div>
        <input className="search" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
      </nav>

      <div className="sec">
        {search ? (
          <div className="rl" style={{flexWrap:'wrap'}}>{results.map(it => <div key={it.id} className="card" onClick={() => setDetail({item:it})}><img src={img(it.poster_path)} /></div>)}</div>
        ) : (
          <>
            <h2>Trending</h2>
            <div className="rl">{rows.trending?.map(it => <div key={it.id} className="card" onClick={() => setDetail({item:it})}><img src={img(it.poster_path)} /></div>)}</div>
            <h2>Popular Movies</h2>
            <div className="rl">{rows.movies?.map(it => <div key={it.id} className="card" onClick={() => setDetail({item:it, type:'movie'})}><img src={img(it.poster_path)} /></div>)}</div>
            <h2>TV Series</h2>
            <div className="rl">{rows.tv?.map(it => <div key={it.id} className="card" onClick={() => setDetail({item:it, type:'tv'})}><img src={img(it.poster_path)} /></div>)}</div>
          </>
        )}
      </div>

      {detail && <Detail item={detail.item} type={detail.type} onClose={() => setDetail(null)} />}
    </div>
  );
}
