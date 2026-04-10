import { useState, useEffect, useRef, useCallback } from "react";
import Hls from "hls.js";

// --- CONFIG ---
const TMDB_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzMTVjYWYzNjkxNTc1OGIwMDFlOTYwMzg5OWJlOTY3MCIsIm5iZiI6MTc3NTcxMjQyNy44MTksInN1YiI6IjY5ZDczOGFiNTIzNzlkODZhY2Q3NzE4YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ID34IJ0N4KSVI4UIziKBwiPR2NQlLAnblAxZC48GWS8";
const TMDB = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

// --- HELPERS ---
async function tmdb(path) {
  try {
    const r = await fetch(`${TMDB}${path}`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } });
    return await r.json();
  } catch { return null; }
}
function img(p, s = "w500") { return p ? `${IMG}/${s}${p}` : ""; }

function getCW() { try { return JSON.parse(localStorage.getItem("cfw_history") || "[]"); } catch { return []; } }
function saveCW(item) {
  try {
    let list = getCW().filter(i => !(i.id === item.id && i.season === item.season && i.episode === item.episode));
    list.unshift({ ...item, ts: Date.now() });
    localStorage.setItem("cfw_history", JSON.stringify(list.slice(0, 30)));
  } catch {}
}
function removeCW(id) {
  try {
    localStorage.setItem("cfw_history", JSON.stringify(getCW().filter(i => i.id !== id)));
  } catch {}
}

// --- ICONS ---
const I = {
  Search: () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  Play: ({s=20}={}) => <svg width={s} height={s} fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>,
  Star: () => <svg width="13" height="13" fill="#f5c518" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z"/></svg>,
  Back: () => <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  ChevL: () => <svg width="26" height="26" fill="none" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  ChevR: () => <svg width="26" height="26" fill="none" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Close: () => <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  Menu: () => <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  Clock: () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  X: () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>,
  Home: () => <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"/></svg>,
  Film: () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M7 2v20M17 2v20M2 12h20" stroke="currentColor" strokeWidth="2"/></svg>,
  Tv: () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="15" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M17 2l-5 5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

// --- STYLES ---
const css = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Bebas+Neue&display=swap');
:root { --bg:#07070c; --s1:#0f0f18; --s2:#181824; --s3:#222234; --r:#e50914; --r2:#b20710; --g:#f5c518; --t:#eeeef2; --t2:#8e8ea8; --t3:#55556a; --rad:10px; --green:#4ade80; }
*{margin:0;padding:0;box-sizing:border-box;}
body{background:var(--bg);color:var(--t);font-family:'Outfit',sans-serif;overflow-x:hidden;}
.cfw-nav{position:fixed;top:0;left:0;right:0;z-index:100;height:68px;display:flex;align-items:center;padding:0 40px;gap:28px;transition:0.35s}
.cfw-nav.s{background:rgba(7,7,12,0.92);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,0.04)}
.cfw-brand{font-family:'Bebas Neue';font-size:26px;letter-spacing:1.5px;cursor:pointer;user-select:none;display:flex;align-items:baseline;gap:4px}
.cfw-brand b{color:var(--r);font-size:30px}
.cfw-tabs{display:flex;gap:2px}
.cfw-tab{padding:8px 18px;border-radius:8px;font-size:13px;font-weight:600;color:var(--t2);cursor:pointer;border:none;background:none;display:flex;align-items:center;gap:7px;transition:0.2s}
.cfw-tab.on{color:var(--t);background:rgba(255,255,255,0.06)}
.cfw-search-w{margin-left:auto;position:relative}
.cfw-search{background:var(--s2);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:9px 14px 9px 38px;color:var(--t);font-size:14px;width:220px;outline:none}
.cfw-search-i{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--t3)}
.cfw-hero{position:relative;height:82vh;min-height:480px;overflow:hidden}
.cfw-hero-bg{position:absolute;inset:0;background-size:cover;background-position:center 20%}
.cfw-hero-grad{position:absolute;inset:0;background:linear-gradient(to right,rgba(7,7,12,0.95) 0%,rgba(7,7,12,0.5) 50%,rgba(7,7,12,0.2) 100%),linear-gradient(to top,var(--bg) 0%,transparent 35%)}
.cfw-hero-body{position:absolute;bottom:14%;left:40px;max-width:560px;z-index:2}
.cfw-hero-title{font-family:'Bebas Neue';font-size:clamp(34px,5.5vw,68px);line-height:0.95;margin-bottom:10px}
.cfw-hero-rate{display:flex;align-items:center;gap:4px;color:var(--g);font-weight:700}
.cfw-btn{padding:11px 26px;border-radius:9px;font-size:14px;font-weight:700;cursor:pointer;border:none;display:flex;align-items:center;gap:8px;transition:0.2s}
.cfw-btn-r{background:var(--r);color:#fff}.cfw-btn-r:hover{background:var(--r2)}
.cfw-sec{padding:28px 0 0}
.cfw-sec-h{padding:0 40px;margin-bottom:12px}.cfw-sec-t{font-family:'Bebas Neue';font-size:22px;display:flex;align-items:center;gap:8px}
.cfw-rl{display:flex;gap:14px;overflow-x:auto;padding:0 40px 14px;scrollbar-width:none}
.cfw-c{flex:0 0 auto;width:175px;cursor:pointer;transition:0.3s}
.cfw-c img{width:100%;aspect-ratio:2/3;border-radius:var(--rad);object-fit:cover;background:var(--s2)}
.cfw-c:hover{transform:scale(1.05)}
.cfw-cw{flex:0 0 auto;width:280px;cursor:pointer;position:relative;border-radius:var(--rad);overflow:hidden;background:var(--s1);border:1px solid rgba(255,255,255,0.04)}
.cfw-cw img{width:100%;aspect-ratio:16/9;object-fit:cover}
.cfw-cw-x{position:absolute;top:6px;right:6px;width:24px;height:24px;border-radius:50%;background:rgba(0,0,0,0.7);color:#fff;border:none;cursor:pointer}
.cfw-det{position:fixed;inset:0;z-index:200;background:var(--bg);overflow-y:auto}
.cfw-det-hero{position:relative;height:58vh}.cfw-det-bg{position:absolute;inset:0;background-size:cover;background-position:center}
.cfw-det-grad{position:absolute;inset:0;background:linear-gradient(to top,var(--bg) 0%,rgba(7,7,12,0.3) 50%,rgba(7,7,12,0.55) 100%)}
.cfw-det-back{position:absolute;top:18px;left:18px;z-index:5;width:42px;height:42px;border-radius:50%;background:rgba(7,7,12,0.7);color:var(--t);border:none;cursor:pointer}
.cfw-det-body{position:relative;z-index:2;max-width:1050px;margin:-110px auto 0;padding:0 30px 50px}
.cfw-stabs{display:flex;gap:6px;overflow-x:auto;margin:20px 0 14px}.cfw-stab{padding:7px 18px;border-radius:7px;background:var(--s2);color:var(--t2);border:none;cursor:pointer}
.cfw-stab.on{background:var(--r);color:#fff}
.cfw-ep{display:flex;justify-content:space-between;padding:12px;background:var(--s1);border-radius:var(--rad);margin-bottom:8px;cursor:pointer}
.cfw-player-overlay{position:fixed;inset:0;background:#000;z-index:1000;display:flex;flex-direction:column}
.cfw-player-bar{padding:10px 20px;display:flex;justify-content:space-between;background:#111;color:#fff;border-bottom:1px solid #333}
.spinner { width: 30px; height: 30px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--green); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 10px; }
@keyframes spin { to { transform: rotate(360deg); } }
`;

// --- COMPONENTS ---
function Player({ media, onClose }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("Bypassing ads...");
  const [error, setError] = useState(null);

  useEffect(() => {
    let hls;
    document.body.style.overflow = "hidden";
    const load = async () => {
      try {
        const query = media.episode ? `tmdb=${media.tmdbId}&season=${media.season}&episode=${media.episode}` : `tmdb=${media.tmdbId}`;
        const res = await fetch(`/api/scrape?${query}`);
        const data = await res.json();
        if (!data.url) throw new Error("Stream unavailable.");

        if (Hls.isSupported()) {
          hls = new Hls();
          hls.loadSource(data.url);
          hls.attachMedia(videoRef.current);
          hls.on(Hls.Events.MANIFEST_PARSED, () => { setStatus(""); videoRef.current.play(); });
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          videoRef.current.src = data.url;
          videoRef.current.oncanplay = () => { setStatus(""); videoRef.current.play(); };
        }
      } catch (err) { setError("Ad-free link fetch failed."); }
    };
    load();
    return () => { document.body.style.overflow = ""; if (hls) hls.destroy(); };
  }, [media]);

  return (
    <div className="cfw-player-overlay">
      <div className="cfw-player-bar">
        <span style={{fontSize: '11px', fontWeight: '900', color: 'var(--green)'}}>AD-FREE DIRECT STREAM</span>
        <button onClick={onClose} style={{ background: '#ff4444', border: 'none', color: '#fff', borderRadius: '4px', padding: '4px 12px', cursor: 'pointer', fontWeight: 'bold' }}>✕ EXIT</button>
      </div>
      {status && !error && <div style={{ margin: 'auto', textAlign: 'center' }}><div className="spinner"></div>{status}</div>}
      {error && <div style={{ color: '#ff4444', margin: 'auto' }}>{error}</div>}
      <video ref={videoRef} controls playsInline style={{ width: '100%', flex: 1, display: status || error ? 'none' : 'block' }} />
    </div>
  );
}

function Row({ title, items, type, onSelect }) {
  if (!items?.length) return null;
  return (
    <div className="cfw-sec">
      <div className="cfw-sec-h"><div className="cfw-sec-t">{title}</div></div>
      <div className="cfw-rl">
        {items.map(it => (
          <div key={it.id} className="cfw-c" onClick={() => onSelect(it, type)}>
            <img src={img(it.poster_path,"w342")} alt="" loading="lazy"/>
            <div style={{marginTop:7, fontSize:13, fontWeight:600}}>{it.title||it.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Detail({ item, type, onClose }) {
  const [d, setD] = useState(null);
  const [season, setSeason] = useState(1);
  const [eps, setEps] = useState([]);
  const [playing, setPlaying] = useState(null);
  const t = type || (item.title ? "movie" : "tv");

  useEffect(() => {
    tmdb(`/${t}/${item.id}`).then(setD);
  }, [item, t]);

  useEffect(() => {
    if (t === "tv") tmdb(`/tv/${item.id}/season/${season}`).then(r => setEps(r?.episodes || []));
  }, [season, t, item.id]);

  const doPlay = (p) => {
    const title = d?.title || d?.name || item.title || item.name;
    saveCW({ id: item.id, tmdbId: item.id, type: t, title, backdrop: item.backdrop_path, ...p });
    setPlaying({ tmdbId: item.id, type: t, ...p });
  };

  if (!d) return null;

  return (
    <div className="cfw-det">
      <div className="cfw-det-hero">
        <div className="cfw-det-bg" style={{backgroundImage:`url(${img(item.backdrop_path||item.poster_path,"original")})`}}/>
        <div className="cfw-det-grad"/>
        <button className="cfw-det-back" onClick={onClose}><I.Back/></button>
      </div>
      <div className="cfw-det-body">
        <div className="cfw-det-title">{d.title || d.name}</div>
        <p style={{fontSize:14, color:"var(--t2)", marginBottom:20}}>{d.overview}</p>
        <button className="cfw-btn cfw-btn-r" onClick={() => doPlay(t==="tv" ? {season, episode:1} : {})}>
          <I.Play/> Play Now
        </button>
        {t === "tv" && <>
          <div className="cfw-stabs">
            {d.seasons?.filter(s => s.season_number > 0).map(s => <button key={s.id} className={`cfw-stab ${season===s.season_number?"on":""}`} onClick={() => setSeason(s.season_number)}>S{s.season_number}</button>)}
          </div>
          {eps.map(ep => (
            <div key={ep.id} className="cfw-ep" onClick={() => doPlay({season, episode:ep.episode_number})}>
              <span>EP {ep.episode_number}: {ep.name}</span>
              <I.Play s={14}/>
            </div>
          ))}
        </>}
      </div>
      {playing && <Player media={playing} onClose={() => setPlaying(null)}/>}
    </div>
  );
}

// --- MAIN APP ---
export default function App() {
  const [scrolled, setScrolled] = useState(false);
  const [tab, setTab] = useState("home");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [rows, setRows] = useState({});
  const [detail, setDetail] = useState(null);
  const [cwKey, setCwKey] = useState(0);

  useEffect(() => { window.onscroll = () => setScrolled(window.scrollY > 30); }, []);

  useEffect(() => {
    (async () => {
      const [tr, tm, tt] = await Promise.all([tmdb("/trending/all/week"), tmdb("/movie/popular"), tmdb("/tv/popular")]);
      setRows({ trending: tr?.results||[], movies: tm?.results||[], tv: tt?.results||[] });
    })();
  }, []);

  useEffect(() => {
    if (!search) return;
    const t = setTimeout(async () => {
      const r = await tmdb(`/search/multi?query=${encodeURIComponent(search)}`);
      setResults(r?.results || []);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <>
      <style>{css}</style>
      <nav className={`cfw-nav ${scrolled?"s":""}`}>
        <div className="cfw-brand" onClick={() => setTab("home")}><b>CFW</b> 4K</div>
        <div className="cfw-tabs">
          <button className={`cfw-tab ${tab==="home"?"on":""}`} onClick={() => setTab("home")}><I.Home/> Home</button>
          <button className={`cfw-tab ${tab==="movies"?"on":""}`} onClick={() => setTab("movies")}><I.Film/> Movies</button>
          <button className={`cfw-tab ${tab==="tv"?"on":""}`} onClick={() => setTab("tv")}><I.Tv/> TV</button>
        </div>
        <div className="cfw-search-w">
          <span className="cfw-search-i"><I.Search/></span>
          <input className="cfw-search" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
      </nav>

      <div style={{paddingTop: 80}}>
        {search ? (
          <Row title="Results" items={results} onSelect={(it) => setDetail({item:it})} />
        ) : (
          <>
            {tab === "home" && <Row title="Trending Now" items={rows.trending} onSelect={(it) => setDetail({item:it})} />}
            {(tab === "home" || tab === "movies") && <Row title="Popular Movies" items={rows.movies} onSelect={(it) => setDetail({item:it}, "movie")} />}
            {(tab === "home" || tab === "tv") && <Row title="Popular TV Shows" items={rows.tv} onSelect={(it) => setDetail({item:it}, "tv")} />}
          </>
        )}
      </div>

      {detail && <Detail item={detail.item} type={detail.type} onClose={() => setDetail(null)} />}
    </>
  );
}
