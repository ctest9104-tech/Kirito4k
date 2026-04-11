import { useState, useEffect, useRef, useCallback } from "react";
import Hls from "hls.js";
import WebTorrent from "webtorrent/dist/webtorrent.min.js";

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
:root { --bg:#07070c; --s1:#0f0f18; --s2:#181824; --r:#e50914; --t:#eeeef2; --t2:#8e8ea8; --rad:12px; --green:#4ade80; --gold:#f5c518; }
body{background:var(--bg);color:var(--t);font-family:sans-serif;margin:0;overflow-x:hidden;}
.cfw-nav{position:fixed;top:0;inset:0;height:68px;background:rgba(7,7,12,0.9);backdrop-filter:blur(15px);display:flex;align-items:center;padding:0 40px;z-index:100;gap:20px;border-bottom:1px solid rgba(255,255,255,0.05);}
.cfw-brand{font-weight:900;font-size:22px;cursor:pointer;display:flex;align-items:center;gap:5px;}
.cfw-brand b{color:var(--r);font-size:26px;}
.cfw-tabs{display:flex;gap:10px;}
.cfw-tab{background:none;border:none;color:var(--t2);cursor:pointer;font-weight:600;display:flex;align-items:center;gap:8px;padding:8px 16px;border-radius:10px;transition:0.2s;}
.cfw-tab.on{color:var(--t);background:rgba(255,255,255,0.08);}
.cfw-search{background:var(--s2);border:1px solid #333;color:#fff;padding:10px 18px;border-radius:10px;margin-left:auto;outline:none;width:240px;transition:0.3s;}
.cfw-search:focus{border-color:var(--r);width:300px;}
.cfw-sec{padding:30px 40px;}
.cfw-sec h2{font-size:18px;text-transform:uppercase;letter-spacing:1px;margin-bottom:15px;color:var(--t2);}
.cfw-rl{display:flex;gap:15px;overflow-x:auto;padding-bottom:15px;scrollbar-width:none;}
.cfw-c{flex:0 0 170px;cursor:pointer;transition:0.4s;position:relative;}
.cfw-c img{width:100%;border-radius:var(--rad);aspect-ratio:2/3;object-fit:cover;background:#111;}
.cfw-c:hover{transform:translateY(-8px);}
.cfw-det{position:fixed;inset:0;background:var(--bg);z-index:200;overflow-y:auto;padding:60px 40px;}
.cfw-player-overlay{position:fixed;inset:0;background:#000;z-index:1000;display:flex;flex-direction:column;}
.cfw-player-bar{padding:12px 25px;display:flex;justify-content:space-between;align-items:center;background:#0a0a0a;border-bottom:1px solid #222;}
.spinner{width:35px;height:35px;border:4px solid rgba(255,255,255,0.1);border-top-color:var(--r);border-radius:50%;animation:spin 1s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.cfw-ep{background:var(--s1);padding:18px;border-radius:12px;margin-bottom:10px;display:flex;justify-content:space-between;cursor:pointer;border:1px solid transparent;transition:0.2s;}
.cfw-ep:hover{background:var(--s2);border-color:rgba(255,255,255,0.1);}
`;

// --- MULTI-MODE PLAYER ---
function Player({ media, onClose }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("Probing sources...");
  const [useIframe, setUseIframe] = useState(false);
  const [loading, setLoading] = useState(true);

  const fallbackUrl = media.episode 
    ? `https://vidsrc.pro/embed/tv/${media.tmdbId}/${media.season}/${media.episode}`
    : `https://vidsrc.pro/embed/movie/${media.tmdbId}`;

  useEffect(() => {
    let hls;
    const client = new WebTorrent();

    const init = async () => {
      try {
        const query = media.episode ? `tmdb=${media.tmdbId}&season=${media.season}&episode=${media.episode}` : `tmdb=${media.tmdbId}`;
        const res = await fetch(`/api/scrape?${query}`);
        const data = await res.json();

        if (data.magnet) {
          setStatus("⚡ P2P (BitTorrent) Mode Active");
          client.add(data.magnet, (torrent) => {
            const file = torrent.files.find(f => f.name.endsWith('.mp4') || f.name.endsWith('.mkv'));
            file.renderTo(videoRef.current, { autoplay: true });
            setLoading(false);
          });
        } else if (data.url) {
          setStatus("🛡️ Secure Direct Stream Active");
          if (Hls.isSupported()) {
            hls = new Hls();
            hls.loadSource(data.url);
            hls.attachMedia(videoRef.current);
            hls.on(Hls.Events.MANIFEST_PARSED, () => { setLoading(false); videoRef.current.play(); });
          } else { setUseIframe(true); }
        } else {
          throw new Error("API Offline");
        }
      } catch {
        setStatus("⚠️ Fallback Mode (Anti-Ads Enabled)");
        setUseIframe(true);
        setLoading(false);
      }
    };
    init();
    return () => {
      if (hls) hls.destroy();
      client.destroy();
    };
  }, [media]);

  return (
    <div className="cfw-player-overlay">
      <div className="cfw-player-bar">
        <span style={{color: useIframe ? 'var(--gold)' : 'var(--green)', fontSize:11, fontWeight:'900', letterSpacing:'1px'}}>
          {status.toUpperCase()}
        </span>
        <button onClick={onClose} style={{background:'var(--r)', color:'#fff', border:'none', padding:'6px 18px', borderRadius:6, cursor:'pointer', fontWeight:'bold'}}>✕ EXIT</button>
      </div>
      {loading && (
        <div style={{margin:'auto', textAlign:'center'}}>
          <div className="spinner" style={{margin:'0 auto 15px'}}></div>
          <p style={{fontSize:14, color:'var(--t2)'}}>Fetching high-quality source...</p>
        </div>
      )}
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
    const title = d.title || d.name;
    saveCW({ id: item.id, tmdbId: item.id, type: t, title, backdrop: item.backdrop_path, ...p });
    setPlaying({ tmdbId: item.id, type: t, ...p });
  };

  return (
    <div className="cfw-det">
      <button onClick={onClose} style={{background:'rgba(255,255,255,0.05)', color:'#fff', border:'1px solid #333', padding:'12px 25px', borderRadius:10, cursor:'pointer', marginBottom:30}}>← BACK TO BROWSE</button>
      <div style={{display:'flex', gap:40, flexWrap:'wrap'}}>
        <img src={img(d.poster_path, "w500")} style={{width:300, borderRadius:15, boxShadow:'0 20px 40px rgba(0,0,0,0.5)'}} />
        <div style={{flex:1, minWidth:300}}>
          <h1 style={{fontSize:48, margin:'0 0 10px'}}>{d.title || d.name}</h1>
          <div style={{display:'flex', gap:15, marginBottom:20, color:'var(--gold)', fontWeight:'bold'}}>
            <span>⭐ {d.vote_average?.toFixed(1)}</span>
            <span style={{color:'var(--t2)'}}>{(d.release_date || d.first_air_date)?.split('-')[0]}</span>
          </div>
          <p style={{fontSize:18, color:'var(--t2)', lineHeight:1.6, marginBottom:30}}>{d.overview}</p>
          <button onClick={() => startPlay(t === "tv" ? {season, episode:1} : {})} style={{background:'var(--r)', color:'#fff', border:'none', padding:'16px 45px', borderRadius:12, fontWeight:'bold', fontSize:18, cursor:'pointer', boxShadow:'0 10px 20px rgba(229,9,20,0.3)'}}>WATCH NOW</button>
        </div>
      </div>

      {t === "tv" && (
        <div style={{marginTop:50}}>
          <h2 style={{color:'var(--t2)', fontSize:16, marginBottom:15}}>SELECT SEASON</h2>
          <select value={season} onChange={e => setSeason(e.target.value)} style={{background:'#181824', color:'#fff', padding:'12px 20px', borderRadius:10, border:'1px solid #333', marginBottom:30, width:200}}>
            {d.seasons?.filter(s => s.season_number > 0).map(s => <option key={s.id} value={s.season_number}>Season {s.season_number}</option>)}
          </select>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:15}}>
            {eps.map(ep => (
              <div key={ep.id} className="cfw-ep" onClick={() => startPlay({season, episode: ep.episode_number})}>
                <span style={{fontWeight:'bold'}}>E{ep.episode_number}: {ep.name}</span>
                <I.Play s={18} />
              </div>
            ))}
          </div>
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
    if (!search) { setResults([]); return; }
    const t = setTimeout(async () => {
      const r = await tmdb(`/search/multi?query=${encodeURIComponent(search)}`);
      setResults(r?.results?.filter(i => i.poster_path) || []);
    }, 500);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <>
      <style>{css}</style>
      <nav className="cfw-nav">
        <div className="cfw-brand" onClick={() => {setTab("home"); setSearch("");}}><b>CFW</b>4K</div>
        <div className="cfw-tabs">
          <button className={`cfw-tab ${tab==="home" && !search ?"on":""}`} onClick={() => {setTab("home"); setSearch("");}}><I.Home/> HOME</button>
          <button className={`cfw-tab ${tab==="movies"?"on":""}`} onClick={() => {setTab("movies"); setSearch("");}}><I.Film/> MOVIES</button>
          <button className={`cfw-tab ${tab==="tv"?"on":""}`} onClick={() => {setTab("tv"); setSearch("");}}><I.Tv/> TV SHOWS</button>
        </div>
        <input className="cfw-search" placeholder="Type to search..." value={search} onChange={e => setSearch(e.target.value)} />
      </nav>

      <div style={{paddingTop: 100}}>
        {search ? (
          <div className="cfw-sec">
            <h2>Showing results for "{search}"</h2>
            <div className="cfw-rl" style={{flexWrap:'wrap', justifyContent:'center'}}>
              {results.map(it => <div key={it.id} className="cfw-c" onClick={() => setDetail({item:it})}><img src={img(it.poster_path)} alt="" /></div>)}
            </div>
          </div>
        ) : (
          <>
            {tab === "home" && <div className="cfw-sec"><h2>Trending This Week</h2><div className="cfw-rl">{rows.trending?.map(it => <div key={it.id} className="cfw-c" onClick={() => setDetail({item:it})}><img src={img(it.poster_path)} alt="" /></div>)}</div></div>}
            {(tab === "home" || tab === "movies") && <div className="cfw-sec"><h2>Popular Movies</h2><div className="cfw-rl">{rows.movies?.map(it => <div key={it.id} className="cfw-c" onClick={() => setDetail({item:it, type:'movie'})}><img src={img(it.poster_path)} alt="" /></div>)}</div></div>}
            {(tab === "home" || tab === "tv") && <div className="cfw-sec"><h2>Must-Watch Series</h2><div className="cfw-rl">{rows.tv?.map(it => <div key={it.id} className="cfw-c" onClick={() => setDetail({item:it, type:'tv'})}><img src={img(it.poster_path)} alt="" /></div>)}</div></div>}
          </>
        )}
      </div>

      <div style={{textAlign:'center', padding:60, opacity:0.3, fontSize:12, borderTop:'1px solid rgba(255,255,255,0.05)'}}>
        CLARKSONS FARM WATCH 4K — POWERED BY P2P & AD-BLOCK TECHNOLOGY
      </div>

      {detail && <Detail item={detail.item} type={detail.type} onClose={() => setDetail(null)} />}
    </>
  );
}
