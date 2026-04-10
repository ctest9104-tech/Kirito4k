import { useState, useEffect, useRef, useCallback } from "react";

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
  Info: () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  Close: () => <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  Menu: () => <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  Clock: () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  X: () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>,
  Home: () => <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"/></svg>,
  Film: () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M7 2v20M17 2v20M2 12h20" stroke="currentColor" strokeWidth="2"/></svg>,
  Tv: () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="15" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M17 2l-5 5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Fullscreen: () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>,
};

// --- STYLES ---
const css = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Bebas+Neue&display=swap');
:root { --bg:#07070c; --s1:#0f0f18; --s2:#181824; --s3:#222234; --r:#e50914; --r2:#b20710; --g:#f5c518; --t:#eeeef2; --t2:#8e8ea8; --t3:#55556a; --rad:10px; --green:#22c55e; }
*{margin:0;padding:0;box-sizing:border-box;}
body{background:var(--bg);color:var(--t);font-family:'Outfit',sans-serif;overflow-x:hidden;}
::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-thumb{background:var(--t3);border-radius:4px}::-webkit-scrollbar-track{background:transparent}

.cfw-nav{position:fixed;top:0;left:0;right:0;z-index:100;height:68px;display:flex;align-items:center;padding:0 40px;gap:28px;transition:0.35s}
.cfw-nav.s{background:rgba(7,7,12,0.92);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,0.04)}
.cfw-brand{font-family:'Bebas Neue';font-size:26px;letter-spacing:1.5px;cursor:pointer;user-select:none;display:flex;align-items:baseline;gap:4px}
.cfw-brand b{color:var(--r);font-size:30px}
.cfw-tabs{display:flex;gap:2px}
.cfw-tab{padding:8px 18px;border-radius:8px;font-size:13px;font-weight:600;color:var(--t2);cursor:pointer;border:none;background:none;display:flex;align-items:center;gap:7px;transition:0.2s}
.cfw-tab:hover,.cfw-tab.on{color:var(--t);background:rgba(255,255,255,0.06)}
.cfw-search-w{margin-left:auto;position:relative}
.cfw-search{background:var(--s2);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:9px 14px 9px 38px;color:var(--t);font-size:14px;width:220px;outline:none;transition:0.3s}
.cfw-search:focus{width:300px;border-color:var(--r);background:var(--s1)}
.cfw-search-i{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--t3)}
.cfw-mob-btn{display:none;background:none;border:none;color:var(--t);cursor:pointer}

.cfw-hero{position:relative;height:82vh;min-height:480px;overflow:hidden}
.cfw-hero-bg{position:absolute;inset:0;background-size:cover;background-position:center 20%;transition:opacity 0.8s}
.cfw-hero-grad{position:absolute;inset:0;background:linear-gradient(to right,rgba(7,7,12,0.95) 0%,rgba(7,7,12,0.5) 50%,rgba(7,7,12,0.2) 100%),linear-gradient(to top,var(--bg) 0%,transparent 35%)}
.cfw-hero-body{position:absolute;bottom:14%;left:40px;max-width:560px;z-index:2}
.cfw-hero-title{font-family:'Bebas Neue';font-size:clamp(34px,5.5vw,68px);line-height:0.95;margin-bottom:10px}
.cfw-hero-meta{display:flex;align-items:center;gap:10px;margin-bottom:14px;font-size:13px;color:var(--t2)}
.cfw-hero-rate{display:flex;align-items:center;gap:4px;color:var(--g);font-weight:700}
.cfw-hero-desc{font-size:14px;line-height:1.65;color:var(--t2);margin-bottom:22px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.cfw-hero-btns{display:flex;gap:10px}

.cfw-btn{padding:11px 26px;border-radius:9px;font-size:14px;font-weight:700;cursor:pointer;border:none;display:flex;align-items:center;gap:8px;transition:0.2s}
.cfw-btn-r{background:var(--r);color:#fff}.cfw-btn-r:hover{background:var(--r2);transform:scale(1.04)}
.cfw-btn-g{background:rgba(255,255,255,0.08);color:var(--t);backdrop-filter:blur(8px)}.cfw-btn-g:hover{background:rgba(255,255,255,0.14)}

.cfw-sec{padding:28px 0 0}
.cfw-sec-h{display:flex;justify-content:space-between;align-items:center;padding:0 40px;margin-bottom:12px}
.cfw-sec-t{font-family:'Bebas Neue';font-size:22px;display:flex;align-items:center;gap:8px}
.cfw-rw{position:relative}
.cfw-rl{display:flex;gap:14px;overflow-x:auto;padding:0 40px 14px;scroll-behavior:smooth;scrollbar-width:none}
.cfw-rl::-webkit-scrollbar{display:none}
.cfw-ra{position:absolute;top:50%;transform:translateY(-55%);z-index:5;width:40px;height:40px;border-radius:50%;background:rgba(7,7,12,0.85);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,0.08);color:var(--t);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:0.2s;opacity:0}
.cfw-rw:hover .cfw-ra{opacity:1}.cfw-ra:hover{background:var(--r)}
.cfw-ra.l{left:6px}.cfw-ra.r{right:6px}

.cfw-c{flex:0 0 auto;width:175px;cursor:pointer;transition:transform 0.3s;position:relative}
.cfw-c:hover{transform:scale(1.07);z-index:3}
.cfw-c img{width:100%;aspect-ratio:2/3;border-radius:var(--rad);object-fit:cover;background:var(--s2)}
.cfw-c-n{margin-top:7px;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cfw-c-m{font-size:11px;color:var(--t3);display:flex;align-items:center;gap:4px;margin-top:2px}

.cfw-cw{flex:0 0 auto;width:280px;cursor:pointer;transition:transform 0.3s;position:relative;border-radius:var(--rad);overflow:hidden;background:var(--s1);border:1px solid rgba(255,255,255,0.04)}
.cfw-cw:hover{transform:scale(1.04);border-color:rgba(255,255,255,0.1)}
.cfw-cw img{width:100%;aspect-ratio:16/9;object-fit:cover}
.cfw-cw-body{padding:10px 14px 12px}
.cfw-cw-title{font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cfw-cw-sub{font-size:11px;color:var(--t3);margin-top:2px}
.cfw-cw-play{position:absolute;top:50%;left:50%;transform:translate(-50%,-70%);width:44px;height:44px;border-radius:50%;background:rgba(229,9,20,0.9);display:flex;align-items:center;justify-content:center;opacity:0;transition:0.25s}
.cfw-cw:hover .cfw-cw-play{opacity:1}
.cfw-cw-x{position:absolute;top:6px;right:6px;width:24px;height:24px;border-radius:50%;background:rgba(0,0,0,0.7);border:none;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:0.2s}
.cfw-cw:hover .cfw-cw-x{opacity:1}

.cfw-det{position:fixed;inset:0;z-index:200;background:var(--bg);overflow-y:auto;animation:fu 0.3s ease}
@keyframes fu{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.cfw-det-hero{position:relative;height:58vh;min-height:380px}
.cfw-det-bg{position:absolute;inset:0;background-size:cover;background-position:center}
.cfw-det-grad{position:absolute;inset:0;background:linear-gradient(to top,var(--bg) 0%,rgba(7,7,12,0.3) 50%,rgba(7,7,12,0.55) 100%)}
.cfw-det-back{position:absolute;top:18px;left:18px;z-index:5;width:42px;height:42px;border-radius:50%;background:rgba(7,7,12,0.7);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.08);color:var(--t);cursor:pointer;display:flex;align-items:center;justify-content:center}
.cfw-det-body{position:relative;z-index:2;max-width:1050px;margin:-110px auto 0;padding:0 30px 50px}
.cfw-det-title{font-family:'Bebas Neue';font-size:clamp(30px,4.5vw,52px);line-height:1;margin-bottom:10px}

.cfw-stabs{display:flex;gap:6px;overflow-x:auto;margin:20px 0 14px;padding-bottom:4px}
.cfw-stab{padding:7px 18px;border-radius:7px;background:var(--s2);border:1px solid rgba(255,255,255,0.05);color:var(--t2);font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;transition:0.2s}
.cfw-stab.on{background:var(--r);color:#fff;border-color:var(--r)}
.cfw-eps{display:flex;flex-direction:column;gap:10px}
.cfw-ep{display:flex;gap:12px;padding:10px;border-radius:var(--rad);background:var(--s1);border:1px solid rgba(255,255,255,0.03);cursor:pointer;transition:0.2s;align-items:center}
.cfw-ep:hover{background:var(--s2);border-color:rgba(255,255,255,0.08)}
.cfw-ep-img{width:160px;aspect-ratio:16/9;border-radius:7px;object-fit:cover;background:var(--s2);flex-shrink:0}
.cfw-ep-info{flex:1;min-width:0}
.cfw-ep-n{font-size:10px;color:var(--r);font-weight:800;margin-bottom:2px}
.cfw-ep-name{font-size:13px;font-weight:700;margin-bottom:3px}
.cfw-ep-desc{font-size:11px;color:var(--t3);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.cfw-ep-play{width:36px;height:36px;border-radius:50%;background:var(--r);color:#fff;display:flex;align-items:center;justify-content:center}

.cfw-player{position:fixed;inset:0;z-index:300;background:#000;display:flex;flex-direction:column}
.cfw-player-top{position:absolute;top:0;left:0;right:0;z-index:10;display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:linear-gradient(to bottom,rgba(0,0,0,0.9),transparent)}
.cfw-exit{background:var(--r);color:#fff;border:none;padding:9px 22px;border-radius:8px;cursor:pointer;font-weight:800;font-size:12px}
.cfw-fs-btn{background:rgba(0,0,0,0.7);color:#fff;border:1px solid rgba(255,255,255,0.12);padding:9px 16px;border-radius:8px;cursor:pointer;font-weight:800;font-size:12px;display:flex;align-items:center;gap:6px}

.cfw-res{padding:80px 40px 40px;min-height:80vh}
.cfw-res-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(165px,1fr));gap:18px}

.cfw-genres{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:22px}
.cfw-genre{padding:5px 14px;border-radius:20px;background:var(--s2);font-size:11px;font-weight:700;color:var(--t2);border:1px solid rgba(255,255,255,0.05)}

.cfw-footer{margin-top:50px;padding:30px 40px;border-top:1px solid rgba(255,255,255,0.04);text-align:center;color:var(--t3);font-size:11px}
.cfw-skel{background:linear-gradient(90deg,var(--s2) 25%,var(--s1) 50%,var(--s2) 75%);background-size:200% 100%;animation:sh 1.5s infinite;border-radius:var(--rad)}
@keyframes sh{0%{background-position:200% 0}100%{background-position:-200% 0}}

@media(max-width:768px){
  .cfw-tabs{display:none}.cfw-mob-btn{display:block}
  .cfw-search{width:130px}
  .cfw-hero-body{left:20px;right:20px}
  .cfw-sec-h,.cfw-rl{padding-left:20px;padding-right:20px}
  .cfw-c{width:135px}.cfw-cw{width:220px}
}
.cfw-mob-drawer{position:fixed;inset:0;z-index:150;background:rgba(7,7,12,0.92);backdrop-filter:blur(20px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px}
`;

// --- ROW ---
function Row({ title, icon, items, type, onSelect }) {
  const ref = useRef();
  const sc = (d) => ref.current?.scrollBy({ left: d * 550, behavior: "smooth" });
  if (!items?.length) return null;
  return (
    <div className="cfw-sec">
      <div className="cfw-sec-h"><div className="cfw-sec-t">{icon}{title}</div></div>
      <div className="cfw-rw">
        <button className="cfw-ra l" onClick={() => sc(-1)}><I.ChevL /></button>
        <div className="cfw-rl" ref={ref}>
          {items.map(it => (
            <div key={it.id} className="cfw-c" onClick={() => onSelect(it, type)}>
              {it.poster_path ? <img src={img(it.poster_path,"w342")} alt="" loading="lazy"/> : <div className="cfw-skel" style={{width:"100%",aspectRatio:"2/3"}}/>}
              <div className="cfw-c-n">{it.title||it.name}</div>
              <div className="cfw-c-m"><I.Star/> {(it.vote_average||0).toFixed(1)} <span style={{marginLeft:4}}>{(it.release_date||it.first_air_date||"").slice(0,4)}</span></div>
            </div>
          ))}
        </div>
        <button className="cfw-ra r" onClick={() => sc(1)}><I.ChevR /></button>
      </div>
    </div>
  );
}

// --- CONTINUE WATCHING ---
function ContinueRow({ onPlay, onRefresh }) {
  const [items, setItems] = useState(getCW());
  useEffect(() => { setItems(getCW()); }, [onRefresh]);
  if (!items.length) return null;
  return (
    <div className="cfw-sec">
      <div className="cfw-sec-h"><div className="cfw-sec-t"><I.Clock/> Continue Watching</div></div>
      <div className="cfw-rw">
        <div className="cfw-rl">
          {items.map((it, i) => (
            <div key={`${it.id}-${i}`} className="cfw-cw" onClick={() => onPlay(it)}>
              {it.backdrop ? <img src={img(it.backdrop,"w500")} alt="" loading="lazy"/> : <div className="cfw-skel" style={{width:"100%",aspectRatio:"16/9"}}/>}
              <div className="cfw-cw-play"><I.Play s={22}/></div>
              <button className="cfw-cw-x" onClick={e => { e.stopPropagation(); removeCW(it.id); setItems(getCW()); }}><I.X/></button>
              <div className="cfw-cw-body">
                <div className="cfw-cw-title">{it.title}</div>
                <div className="cfw-cw-sub">{it.episode ? `S${it.season} E${it.episode}` : "Movie"}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- NEW FAST PLAYER (NO BACKEND NEEDED) ---
function Player({ media, onClose }) {
  const playerRef = useRef(null);
  
  // High-reliability embed providers
  const embedUrl = media.episode 
    ? `https://vidsrc.me/embed/tv?tmdb=${media.tmdbId}&s=${media.season}&e=${media.episode}`
    : `https://vidsrc.me/embed/movie?tmdb=${media.tmdbId}`;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const toggleFs = () => {
    if (!document.fullscreenElement) playerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  };

  return (
    <div className="cfw-player" ref={playerRef}>
      <div className="cfw-player-top">
        <div style={{color:"#fff", fontSize:12, fontWeight:800, opacity:0.6}}>
          {media.episode ? `SERIES: S${media.season} E${media.episode}` : "MOVIE: 4K SOURCE"}
        </div>
        <div style={{display:"flex", gap:10}}>
          <button className="cfw-fs-btn" onClick={toggleFs}><I.Fullscreen/> FULLSCREEN</button>
          <button className="cfw-exit" onClick={onClose}>✕ EXIT</button>
        </div>
      </div>
      <iframe 
        src={embedUrl}
        style={{ width: "100%", height: "100%", border: "none" }}
        allowFullScreen
        allow="autoplay; encrypted-media"
        title="video-player"
      />
    </div>
  );
}

// --- DETAIL PAGE ---
function Detail({ item, type, onClose }) {
  const [d, setD] = useState(null);
  const [credits, setCredits] = useState(null);
  const [season, setSeason] = useState(1);
  const [eps, setEps] = useState([]);
  const [playing, setPlaying] = useState(null);
  const t = type || (item.title ? "movie" : "tv");

  useEffect(() => {
    (async () => {
      const [det, cred] = await Promise.all([tmdb(`/${t}/${item.id}`), tmdb(`/${t}/${item.id}/credits`)]);
      setD(det); setCredits(cred);
      if (t === "tv" && det?.seasons?.length) setSeason((det.seasons.find(s => s.season_number === 1) || det.seasons[0]).season_number);
    })();
  }, [item, t]);

  useEffect(() => {
    if (t === "tv" && d) tmdb(`/tv/${item.id}/season/${season}`).then(r => setEps(r?.episodes || []));
  }, [season, d, item, t]);

  const cast = credits?.cast?.slice(0, 10) || [];
  const title = d?.title || d?.name || item.title || item.name;

  const doPlay = (p) => {
    saveCW({ id: item.id, tmdbId: item.id, type: t, title, backdrop: item.backdrop_path, ...p });
    setPlaying({ tmdbId: item.id, type: t, ...p });
  };

  return (
    <div className="cfw-det">
      <div className="cfw-det-hero">
        <div className="cfw-det-bg" style={{backgroundImage:`url(${img(item.backdrop_path||item.poster_path,"original")})`}}/>
        <div className="cfw-det-grad"/>
        <button className="cfw-det-back" onClick={onClose}><I.Back/></button>
      </div>
      <div className="cfw-det-body">
        <div className="cfw-det-title">{title}</div>
        <div className="cfw-hero-meta">
          <span className="cfw-hero-rate"><I.Star/> {(d?.vote_average||0).toFixed(1)}</span>
          <span>{(d?.release_date||d?.first_air_date||"").slice(0,4)}</span>
          <span style={{textTransform:"uppercase",fontSize:10,background:"var(--s2)",padding:"2px 8px",borderRadius:4,fontWeight:700}}>{t==="movie"?"Movie":"Series"}</span>
        </div>
        <div className="cfw-genres">{(d?.genres||[]).map(g => <span key={g.id} className="cfw-genre">{g.name}</span>)}</div>
        <p style={{fontSize:14,lineHeight:1.7,color:"var(--t2)",maxWidth:680,marginBottom:24}}>{d?.overview}</p>
        <button className="cfw-btn cfw-btn-r" onClick={() => doPlay(t==="tv" ? {season,episode:eps[0]?.episode_number||1} : {})}>
          <I.Play/> {t==="movie" ? "Watch Movie" : `Play S${season}:E1`}
        </button>

        {cast.length > 0 && <>
          <div className="cfw-sec-t" style={{fontSize:18,marginTop:28,marginBottom:4}}>Cast</div>
          <div className="cfw-cast-row">
            {cast.map(c => <div key={c.id} className="cfw-cast-card">{c.profile_path ? <img className="cfw-cast-img" src={img(c.profile_path,"w185")} alt=""/> : <div className="cfw-cast-img cfw-skel"/>}<div className="cfw-cast-n">{c.name}</div></div>)}
          </div>
        </>}

        {t === "tv" && d?.seasons?.length > 0 && <>
          <div className="cfw-sec-t" style={{fontSize:18,marginTop:28,marginBottom:4}}>Episodes</div>
          <div className="cfw-stabs">
            {d.seasons.filter(s => s.season_number > 0).map(s => <button key={s.id} className={`cfw-stab ${season===s.season_number?"on":""}`} onClick={() => setSeason(s.season_number)}>Season {s.season_number}</button>)}
          </div>
          <div className="cfw-eps">
            {eps.map(ep => (
              <div key={ep.id} className="cfw-ep" onClick={() => doPlay({season,episode:ep.episode_number})}>
                <div className="cfw-ep-info">
                  <div className="cfw-ep-n">EPISODE {ep.episode_number}</div>
                  <div className="cfw-ep-name">{ep.name}</div>
                </div>
                <div className="cfw-ep-play"><I.Play s={16}/></div>
              </div>
            ))}
          </div>
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
  const [hero, setHero] = useState(null);
  const [heroIdx, setHeroIdx] = useState(0);
  const [rows, setRows] = useState({});
  const [detail, setDetail] = useState(null);
  const [mob, setMob] = useState(false);
  const [cwKey, setCwKey] = useState(0);

  useEffect(() => { const fn = () => setScrolled(window.scrollY > 30); window.addEventListener("scroll", fn); return () => window.removeEventListener("scroll", fn); }, []);

  useEffect(() => {
    (async () => {
      const [tr, tm, tt, np, pop, air, up] = await Promise.all([
        tmdb("/trending/all/week"), tmdb("/movie/top_rated"), tmdb("/tv/top_rated"),
        tmdb("/movie/now_playing"), tmdb("/movie/popular"), tmdb("/tv/on_the_air"), tmdb("/movie/upcoming"),
      ]);
      setRows({ trending: tr?.results||[], topMovies: tm?.results||[], topTv: tt?.results||[], nowPlaying: np?.results||[], popular: pop?.results||[], airing: air?.results||[], upcoming: up?.results||[] });
      if (tr?.results?.length) { setHero(tr.results.slice(0, 6)); setHeroIdx(0); }
    })();
  }, []);

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      const r = await tmdb(`/search/multi?query=${encodeURIComponent(search)}`);
      setResults((r?.results||[]).filter(x => x.media_type !== "person"));
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const sel = useCallback((item, type) => setDetail({ item, type: type || item.media_type || (item.first_air_date ? "tv" : "movie") }), []);
  const h = hero?.[heroIdx];
  const showSearch = search.trim().length > 0;
  const rr = tab==="movies" ? {"Now Playing":rows.nowPlaying,"Popular":rows.popular,"Top Rated":rows.topMovies,"Upcoming":rows.upcoming}
    : tab==="tv" ? {"Airing Now":rows.airing,"Top Rated TV":rows.topTv}
    : {"Trending This Week":rows.trending,"Now Playing":rows.nowPlaying,"Top Rated Movies":rows.topMovies,"Popular TV":rows.airing,"Top Rated TV":rows.topTv,"Upcoming":rows.upcoming};

  const navTo = (t) => { setTab(t); setSearch(""); setDetail(null); setMob(false); };

  return (<>
    <style>{css}</style>
    <div>
      <nav className={`cfw-nav ${scrolled?"s":""}`}>
        <div className="cfw-brand" onClick={() => navTo("home")}><b>CFW</b> 4K</div>
        <div className="cfw-tabs">
          {[["home","Home",<I.Home/>],["movies","Movies",<I.Film/>],["tv","TV Shows",<I.Tv/>]].map(([k,l,ic]) =>
            <button key={k} className={`cfw-tab ${tab===k?"on":""}`} onClick={() => navTo(k)}>{ic}{l}</button>)}
        </div>
        <div className="cfw-search-w">
          <span className="cfw-search-i"><I.Search/></span>
          <input className="cfw-search" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <button className="cfw-mob-btn" onClick={() => setMob(true)}><I.Menu/></button>
      </nav>

      {mob && <div className="cfw-mob-drawer" onClick={() => setMob(false)}>
        {[["home","Home"],["movies","Movies"],["tv","TV Shows"]].map(([k,l]) =>
          <button key={k} className="cfw-tab" onClick={() => navTo(k)}>{l}</button>)}
      </div>}

      {detail && <Detail item={detail.item} type={detail.type} onClose={() => { setDetail(null); setCwKey(k => k+1); }}/>}

      {showSearch && !detail ? (
        <div className="cfw-res">
          <div className="cfw-res-grid">
            {results.map(it => (
              <div key={it.id} className="cfw-c" onClick={() => sel(it)} style={{width:"auto"}}>
                {it.poster_path ? <img src={img(it.poster_path,"w342")} alt=""/> : <div className="cfw-skel" style={{aspectRatio:"2/3"}}/>}
                <div className="cfw-c-n">{it.title||it.name}</div>
              </div>
            ))}
          </div>
        </div>
      ) : !detail ? (<>
        {h && <div className="cfw-hero">
          <div className="cfw-hero-bg" style={{backgroundImage:`url(${img(h.backdrop_path,"original")})`}}/>
          <div className="cfw-hero-grad"/>
          <div className="cfw-hero-body">
            <div className="cfw-hero-title">{h.title||h.name}</div>
            <div className="cfw-hero-meta">
              <span className="cfw-hero-rate"><I.Star/> {(h.vote_average||0).toFixed(1)}</span>
              <span>{(h.release_date||h.first_air_date||"").slice(0,4)}</span>
            </div>
            <div className="cfw-hero-desc">{h.overview}</div>
            <div className="cfw-hero-btns">
              <button className="cfw-btn cfw-btn-r" onClick={() => sel(h)}><I.Play/> Watch Now</button>
            </div>
          </div>
        </div>}
        <ContinueRow onPlay={(it) => setDetail({ item: { id: it.id, backdrop_path: it.backdrop, title: it.title, name: it.title }, type: it.type })} onRefresh={cwKey}/>
        {Object.entries(rr).map(([title, items]) => <Row key={title} title={title} items={items} onSelect={sel}/>)}
      </>) : null}

      <div className="cfw-footer">
        <div className="cfw-brand" style={{justifyContent:"center",fontSize:20,marginBottom:6}}><b>CFW</b> 4K</div>
        <div>© {new Date().getFullYear()} Clarksons Farm Watch 4K. Content metadata by TMDB.</div>
      </div>
    </div>
  </>);
}
