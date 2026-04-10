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
  try { localStorage.setItem("cfw_history", JSON.stringify(getCW().filter(i => i.id !== id))); } catch {}
}

// --- ICONS ---
const I = {
  Search: () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  Play: ({s=20}={}) => <svg width={s} height={s} fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>,
  Star: () => <svg width="13" height="13" fill="#f5c518" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z"/></svg>,
  Back: () => <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Home: () => <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"/></svg>,
  Film: () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M7 2v20M17 2v20M2 12h20" stroke="currentColor" strokeWidth="2"/></svg>,
  Tv: () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="15" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M17 2l-5 5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

// --- STYLES ---
const css = `
:root { --bg:#07070c; --s1:#0f0f18; --s2:#181824; --r:#e50914; --t:#eeeef2; --t2:#8e8ea8; --rad:10px; --green:#4ade80; --gold:#f5c518; }
body{background:var(--bg);color:var(--t);font-family:sans-serif;margin:0;overflow-x:hidden;}
.cfw-nav{position:fixed;top:0;inset:0;height:68px;background:rgba(7,7,12,0.8);backdrop-filter:blur(10px);display:flex;align-items:center;padding:0 40px;z-index:100;gap:20px;}
.cfw-brand{font-weight:900;font-size:22px;cursor:pointer;}
.cfw-brand b{color:var(--r);}
.cfw-tabs{display:flex;gap:10px;}
.cfw-tab{background:none;border:none;color:var(--t2);cursor:pointer;font-weight:600;display:flex;align-items:center;gap:5px;padding:8px 12px;border-radius:8px;}
.cfw-tab.on{color:var(--t);background:rgba(255,255,255,0.1);}
.cfw-search{background:var(--s2);border:1px solid #333;color:#fff;padding:8px 15px;border-radius:8px;margin-left:auto;outline:none;}
.cfw-sec{padding:20px 40px;}
.cfw-rl{display:flex;gap:15px;overflow-x:auto;padding-bottom:10px;scrollbar-width:none;}
.cfw-c{flex:0 0 170px;cursor:pointer;transition:0.3s;}
.cfw-c img{width:100%;border-radius:var(--rad);aspect-ratio:2/3;object-fit:cover;}
.cfw-c:hover{transform:scale(1.05);}
.cfw-det{position:fixed;inset:0;background:var(--bg);z-index:200;overflow-y:auto;padding:40px;}
.cfw-player-overlay{position:fixed;inset:0;background:#000;z-index:1000;display:flex;flex-direction:column;}
.cfw-player-bar{padding:10px 20px;display:flex;justify-content:space-between;background:#111;border-bottom:1px solid #333;}
.spinner{width:30px;height:30px;border:3px solid #333;border-top-color:var(--green);border-radius:50%;animation:spin 1s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.cfw-ep{background:var(--s1);padding:15px;border-radius:10px;margin-bottom:10px;display:flex;justify-content:space-between;cursor:pointer;}
`;

// --- PLAYER COMPONENT ---
function Player({ media, onClose }) {
  const videoRef = useRef(null);
  const [useIframe, setUseIframe] = useState(false);
  const [loading, setLoading] = useState(true);

  const fallbackUrl = media.episode 
    ? `https://vidsrc.pro/embed/tv/${media.tmdbId}/${media.season}/${media.episode}`
    : `https://vidsrc.pro/embed/movie/${media.tmdbId}`;

  useEffect(() => {
    let hls;
    const init = async () => {
      try {
        const query = media.episode ? `tmdb=${media.tmdbId}&season=${media.season}&episode=${media.episode}` : `tmdb=${media.tmdbId}`;
        const res = await fetch(`/api/scrape?${query}`);
        if (!res.ok) throw new Error();
        const data = await res.json();

        if (Hls.isSupported()) {
          hls = new Hls();
          hls.loadSource(data.url);
          hls.attachMedia(videoRef.current);
          hls.on(Hls.Events.MANIFEST_PARSED, () => { setLoading(false); videoRef.current.play(); });
        } else { setUseIframe(true); }
      } catch {
        setUseIframe(true);
        setLoading(false);
      }
    };
    init();
    return () => hls?.destroy();
  }, [media]);

  return (
    <div className="cfw-player-overlay">
      <div className="cfw-player-bar">
        <span style={{color: useIframe ? 'var(--gold)' : 'var(--green)', fontSize:12, fontWeight:'bold'}}>
          {useIframe ? '⚡ FALLBACK MODE (ADS BLOCKED)' : '🛡️ PURE AD-FREE STREAM'}
        </span>
        <button onClick={onClose} style={{background: 'var(--r)', color:'#fff', border:'none', padding:'5px 15px', borderRadius:4, cursor:'pointer'}}>EXIT</button>
      </div>
      {loading && <div style={{margin:'auto', textAlign:'center'}}><div className="spinner"></div><br/>Finding Clean Stream...</div>}
      {useIframe ? (
        <iframe src={fallbackUrl} style={{width:'100%', flex:1, border:'none'}} allowFullScreen sandbox="allow-forms allow-scripts allow-same-origin" />
      ) : (
        <video ref={videoRef} controls playsInline style={{width:'100%', flex:1, display: loading ? 'none' : 'block'}} />
      )}
    </div>
  );
}

// --- DETAIL COMPONENT ---
function Detail({ item, type, onClose }) {
  const [d, setD] = useState(null);
  const [season, setSeason] = useState(1);
  const [eps, setEps] = useState([]);
  const [playing, setPlaying] = useState(null);
  const t = type || (item.title ? "movie" : "tv");

  useEffect(() => { tmdb(`/${t}/${item.id}`).then(setD); }, [item, t]);
  useEffect(() => { if (t === "tv") tmdb(`/tv/${item.id}/season/${season}`).then(r => setEps(r?.episodes || [])); }, [season, t, item.id]);

  if (!d) return null;

  const startPlay = (p) => {
    saveCW({ id: item.id, tmdbId: item.id, type: t, title: d.title || d.name, backdrop: item.backdrop_path, ...p });
    setPlaying({ tmdbId: item.id, type: t, ...p });
  };

  return (
    <div className="cfw-det">
      <button onClick={onClose} style={{background:'none', color:'#fff', border:'1px solid #333', padding:'10px 20px', borderRadius:8, cursor:'pointer', marginBottom:20}}>BACK</button>
      <h1>{d.title || d.name}</h1>
      <p style={{color:'var(--t2)', maxWidth:600}}>{d.overview}</p>
      <button onClick={() => startPlay(t === "tv" ? {season, episode:1} : {})} style={{background:'var(--r)', color:'#fff', border:'none', padding:'12px 30px', borderRadius:8, fontWeight:'bold', cursor:'pointer', margin:'20px 0'}}>PLAY NOW</button>

      {t === "tv" && (
        <div>
          <select value={season} onChange={e => setSeason(e.target.value)} style={{background:'#222', color:'#fff', padding:10, borderRadius:8, border:'none', marginBottom:20}}>
            {d.seasons?.filter(s => s.season_number > 0).map(s => <option key={s.id} value={s.season_number}>Season {s.season_number}</option>)}
          </select>
          {eps.map(ep => (
            <div key={ep.id} className="cfw-ep" onClick={() => startPlay({season, episode: ep.episode_number})}>
              <span>Episode {ep.episode_number}: {ep.name}</span>
              <I.Play s={16} />
            </div>
          ))}
        </div>
      )}
      {playing && <Player media={playing} onClose={() => setPlaying(null)} />}
    </div>
  );
}

// --- MAIN APP ---
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
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <>
      <style>{css}</style>
      <nav className="cfw-nav">
        <div className="cfw-brand" onClick={() => {setTab("home"); setSearch("");}}><b>CFW</b> 4K</div>
        <div className="cfw-tabs">
          <button className={`cfw-tab ${tab==="home"?"on":""}`} onClick={() => setTab("home")}><I.Home/> Home</button>
          <button className={`cfw-tab ${tab==="movies"?"on":""}`} onClick={() => setTab("movies")}><I.Film/> Movies</button>
          <button className={`cfw-tab ${tab==="tv"?"on":""}`} onClick={() => setTab("tv")}><I.Tv/> TV</button>
        </div>
        <input className="cfw-search" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
      </nav>

      <div style={{paddingTop: 80}}>
        {search ? (
          <div className="cfw-sec">
            <h2>Search Results</h2>
            <div className="cfw-rl" style={{flexWrap:'wrap'}}>
              {results.map(it => <div key={it.id} className="cfw-c" onClick={() => setDetail({item:it})}><img src={img(it.poster_path)} alt="" /></div>)}
            </div>
          </div>
        ) : (
          <>
            {tab === "home" && <div className="cfw-sec"><h2>Trending</h2><div className="cfw-rl">{rows.trending?.map(it => <div key={it.id} className="cfw-c" onClick={() => setDetail({item:it})}><img src={img(it.poster_path)} alt="" /></div>)}</div></div>}
            {(tab === "home" || tab === "movies") && <div className="cfw-sec"><h2>Popular Movies</h2><div className="cfw-rl">{rows.movies?.map(it => <div key={it.id} className="cfw-c" onClick={() => setDetail({item:it, type:'movie'})}><img src={img(it.poster_path)} alt="" /></div>)}</div></div>}
            {(tab === "home" || tab === "tv") && <div className="cfw-sec"><h2>Popular TV</h2><div className="cfw-rl">{rows.tv?.map(it => <div key={it.id} className="cfw-c" onClick={() => setDetail({item:it, type:'tv'})}><img src={img(it.poster_path)} alt="" /></div>)}</div></div>}
          </>
        )}
      </div>

      {detail && <Detail item={detail.item} type={detail.type} onClose={() => setDetail(null)} />}
    </>
  );
}
