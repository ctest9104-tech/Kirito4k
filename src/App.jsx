import { useState, useEffect, useRef, useCallback } from "react";

const TMDB_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzMTVjYWYzNjkxNTc1OGIwMDFlOTYwMzg5OWJlOTY3MCIsIm5iZiI6MTc3NTcxMjQyNy44MTksInN1YiI6IjY5ZDczOGFiNTIzNzlkODZhY2Q3NzE4YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ID34IJ0N4KSVI4UIziKBwiPR2NQlLAnblAxZC48GWS8";
const TMDB = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

// =====================================================
// MULTI-SERVER CONFIG
// =====================================================
const SERVERS = [
  {
    id: "vidlink",
    name: "VidLink ★ Ad-Free",
    sandbox: true,
    movieUrl:   (id) => `https://vidlink.pro/movie/${id}`,
    tvUrl:      (id) => `https://vidlink.pro/tv/${id}`,
    episodeUrl: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
  },
  {
    id: "vidsrc",
    name: "VidSrc",
    sandbox: false,
    movieUrl:   (id) => `https://vsrc.su/embed/movie?tmdb=${id}`,
    tvUrl:      (id) => `https://vsrc.su/embed/tv?tmdb=${id}`,
    episodeUrl: (id, s, e) => `https://vsrc.su/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
  },
  {
    id: "embedsu",
    name: "Embed.su",
    sandbox: true,
    movieUrl:   (id) => `https://embed.su/embed/movie/${id}`,
    tvUrl:      (id) => `https://embed.su/embed/tv/${id}`,
    episodeUrl: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "autoembed",
    name: "AutoEmbed",
    sandbox: true,
    movieUrl:   (id) => `https://player.autoembed.cc/embed/movie/${id}`,
    tvUrl:      (id) => `https://player.autoembed.cc/embed/tv/${id}`,
    episodeUrl: (id, s, e) => `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}`,
  },
];

function getStoredServer() {
  try { return localStorage.getItem("k4k_server") || "vidlink"; } catch { return "vidlink"; }
}
function storeServer(id) {
  try { localStorage.setItem("k4k_server", id); } catch {}
}

// --- ICONS ---
const Icons = {
  Search: () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  Play: () => <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>,
  Star: () => <svg width="14" height="14" fill="#f5c518" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z"/></svg>,
  Back: () => <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  ChevL: () => <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  ChevR: () => <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Info: () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  Home: () => <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"/></svg>,
  Film: () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5" stroke="currentColor" strokeWidth="2"/></svg>,
  Tv: () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="15" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M17 2l-5 5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Close: () => <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  Menu: () => <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  Server: () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="2"/><rect x="2" y="14" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="2"/><circle cx="6" cy="6" r="1" fill="currentColor"/><circle cx="6" cy="18" r="1" fill="currentColor"/></svg>,
  Shield: () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>,
  External: () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

// --- CSS ---
const css = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap');
:root {
  --bg: #0a0a0f;
  --surface: #12121a;
  --surface2: #1a1a26;
  --accent: #e50914;
  --accent2: #b20710;
  --gold: #f5c518;
  --text: #e8e8ec;
  --text2: #8888a0;
  --text3: #55556a;
  --glass: rgba(10,10,15,0.85);
  --radius: 8px;
  --green: #22c55e;
}
* { margin:0; padding:0; box-sizing:border-box; }
body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; overflow-x: hidden; }
.k4k-app { min-height:100vh; background: var(--bg); }
.k4k-nav { position:fixed; top:0; left:0; right:0; z-index:100; padding:0 24px; height:64px; display:flex; align-items:center; gap:24px; transition: background 0.3s; }
.k4k-nav.scrolled { background: var(--glass); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.05); }
.k4k-logo { font-family:'Bebas Neue',sans-serif; font-size:32px; letter-spacing:2px; color: var(--accent); cursor:pointer; text-shadow: 0 0 30px rgba(229,9,20,0.4); }
.k4k-logo span { color: var(--text); font-size:20px; opacity:0.7; }
.k4k-nav-link { padding:8px 16px; border-radius:6px; font-size:14px; font-weight:500; color: var(--text2); cursor:pointer; border:none; background:none; display:flex; align-items:center; gap:6px; }
.k4k-nav-link.active { color: var(--text); background: rgba(255,255,255,0.06); }
.k4k-search-wrap { margin-left:auto; position:relative; }
.k4k-search { background: var(--surface2); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:8px 12px 8px 36px; color:var(--text); font-size:14px; width:240px; outline:none; transition: all 0.3s; }
.k4k-search:focus { width:320px; border-color: var(--accent); }
.k4k-search-icon { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--text3); }
.k4k-hero { position:relative; height:85vh; min-height:500px; overflow:hidden; }
.k4k-hero-bg { position:absolute; inset:0; background-size:cover; background-position:center top; }
.k4k-hero-overlay { position:absolute; inset:0; background: linear-gradient(to right, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.6) 50%, rgba(10,10,15,0.3) 100%), linear-gradient(to top, var(--bg) 0%, transparent 40%); }
.k4k-hero-content { position:absolute; bottom:15%; left:48px; max-width:580px; z-index:2; }
.k4k-hero-title { font-family:'Bebas Neue',sans-serif; font-size:clamp(36px,6vw,72px); line-height:0.95; margin-bottom:12px; }
.k4k-btn { padding:12px 28px; border-radius:8px; font-size:15px; font-weight:600; cursor:pointer; border:none; display:flex; align-items:center; gap:8px; }
.k4k-btn-primary { background:var(--accent); color:#fff; }
.k4k-section { padding:32px 0 0; }
.k4k-section-title { font-family:'Bebas Neue',sans-serif; font-size:24px; padding:0 48px; margin-bottom:14px; }
.k4k-row { display:flex; gap:12px; overflow-x:auto; padding:0 48px 16px; scrollbar-width:none; }
.k4k-row::-webkit-scrollbar { display:none; }
.k4k-card { flex:0 0 auto; width:185px; cursor:pointer; transition: transform 0.25s; position:relative; }
.k4k-card:hover { transform:scale(1.08); z-index:3; }
.k4k-card-img { width:100%; aspect-ratio:2/3; border-radius:var(--radius); object-fit:cover; background:var(--surface2); }
.k4k-detail { position:fixed; inset:0; z-index:200; background:var(--bg); overflow-y:auto; }
.k4k-detail-hero { position:relative; height:60vh; }
.k4k-detail-bg { position:absolute; inset:0; background-size:cover; background-position:center; }
.k4k-detail-grad { position:absolute; inset:0; background: linear-gradient(to top, var(--bg) 0%, rgba(10,10,15,0.4) 50%, rgba(10,10,15,0.6) 100%); }
.k4k-detail-body { position:relative; z-index:2; max-width:1100px; margin:-120px auto 0; padding:0 32px 60px; }
.k4k-player-iframe { width:100%; height:100%; border:none; }
.k4k-season-tabs { display:flex; gap:6px; overflow-x:auto; margin-bottom:16px; }
.k4k-season-tab { padding:8px 18px; border-radius:6px; background:var(--surface2); color:var(--text2); cursor:pointer; border:none; }
.k4k-season-tab.active { background:var(--accent); color:#fff; }
.k4k-episode { display:flex; gap:14px; padding:12px; border-radius:var(--radius); background:var(--surface); cursor:pointer; align-items:center; margin-bottom:10px; }
.k4k-ep-still { width:180px; aspect-ratio:16/9; border-radius:6px; object-fit:cover; }
.k4k-skeleton { background: linear-gradient(90deg, var(--surface2) 25%, var(--surface) 50%, var(--surface2) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* SERVER SELECTOR */
.k4k-server-btn { display:flex; align-items:center; gap:6px; padding:6px 14px; border-radius:20px; background:rgba(0,0,0,0.7); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.15); color:var(--text); font-size:12px; font-weight:600; cursor:pointer; }
.k4k-server-dropdown { position:absolute; top:100%; left:0; margin-top:6px; background:var(--surface); border:1px solid rgba(255,255,255,0.1); border-radius:10px; min-width:180px; box-shadow: 0 12px 40px rgba(0,0,0,0.6); }
.k4k-server-item { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; font-size:13px; cursor:pointer; color:var(--text2); }
.k4k-server-item.active { color:var(--green); }

/* ADBLOCKER MODAL */
.k4k-adblock-overlay { position:fixed; inset:0; z-index:500; background:rgba(0,0,0,0.8); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; }
.k4k-adblock-modal { background:var(--surface); border-radius:16px; max-width:440px; padding:32px; text-align:center; }
`;

// Aggressive CSS to kill common ad patterns
const AD_NUKE_CSS = `
  .k4k-player-wrap div[class*="overlay"],
  .k4k-player-wrap div[style*="z-index: 2147483647"],
  .k4k-player-wrap div[style*="z-index:2147483647"],
  .k4k-player-wrap div[style*="z-index: 999999"],
  .k4k-player-wrap a[target="_blank"],
  .k4k-player-wrap div[id*="ads"],
  .k4k-player-wrap div[class*="ads"],
  .k4k-player-wrap div[class*="click-layer"],
  .k4k-player-wrap div[class*="pop"],
  .k4k-player-wrap div[class*="banner"] {
    display: none !important;
    pointer-events: none !important;
    opacity: 0 !important;
    width: 0 !important;
    height: 0 !important;
    visibility: hidden !important;
  }
  .k4k-player-iframe { position: relative; z-index: 1; }
`;

// --- HELPERS ---
async function tmdbFetch(path, params = {}) {
  const url = new URL(`${TMDB}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  try {
    const r = await fetch(url, { headers: { "Authorization": `Bearer ${TMDB_TOKEN}` } });
    return await r.json();
  } catch { return null; }
}
function posterUrl(path, size = "w500") { return path ? `${IMG}/${size}${path}` : ""; }
function backdropUrl(path) { return path ? `${IMG}/original${path}` : ""; }

// --- ADBLOCKER RECOMMENDATION ---
function AdblockerAlert({ onDismiss }) {
  return (
    <div className="k4k-adblock-overlay" onClick={onDismiss}>
      <div className="k4k-adblock-modal" onClick={e => e.stopPropagation()}>
        <div style={{ color: "var(--accent)", marginBottom: 16 }}><Icons.Shield /></div>
        <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 24, marginBottom: 8 }}>Use an Ad Blocker</h2>
        <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 24 }}>
          Kirito4K is ad-free, but video servers may have popups. We recommend uBlock Origin for a clean experience.
        </p>
        <button className="k4k-btn k4k-btn-primary" style={{ width: '100%' }} onClick={onDismiss}>Got it</button>
      </div>
    </div>
  );
}

// --- ROW COMPONENT ---
function Row({ title, items, type, onSelect }) {
  const ref = useRef();
  if (!items?.length) return null;
  return (
    <div className="k4k-section">
      <div className="k4k-section-title">{title}</div>
      <div className="k4k-row" ref={ref}>
        {items.map((item) => (
          <div key={item.id} className="k4k-card" onClick={() => onSelect(item, type)}>
            {item.poster_path ? <img className="k4k-card-img" src={posterUrl(item.poster_path, "w342")} alt="" loading="lazy" /> : <div className="k4k-card-img k4k-skeleton" />}
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title || item.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{item.vote_average?.toFixed(1)} ★</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- UPDATED PLAYER COMPONENT ---
function Player({ playing, onClose }) {
  const [serverId, setServerId] = useState(getStoredServer);
  const [showDropdown, setShowDropdown] = useState(false);
  const [clickCount, setClickCount] = useState(0); 
  const [sandboxOff, setSandboxOff] = useState(false);
  const iframeRef = useRef(null);

  const server = SERVERS.find(s => s.id === serverId) || SERVERS[0];

  const handleShieldClick = (e) => {
    e.stopPropagation();
    setClickCount(prev => prev + 1);
    console.log(`[Kirito4K] Shield absorbed click #${clickCount + 1}`);
  };

  const switchServer = (id) => {
    setServerId(id);
    storeServer(id);
    setShowDropdown(false);
    setSandboxOff(false);
    setClickCount(0); 
  };

  useEffect(() => {
    if (!playing) return;
    const origOpen = window.open;
    window.open = () => null;

    const blockLinks = (e) => {
      const a = e.target.closest?.("a[target='_blank']");
      if (a) { e.preventDefault(); e.stopPropagation(); }
    };

    document.addEventListener("click", blockLinks, true);
    return () => {
      window.open = origOpen;
      document.removeEventListener("click", blockLinks, true);
    };
  }, [playing]);

  if (!playing) return null;

  let embedSrc;
  if (playing.type === "movie") embedSrc = server.movieUrl(playing.tmdbId);
  else if (playing.episode) embedSrc = server.episodeUrl(playing.tmdbId, playing.season, playing.episode);
  else embedSrc = server.tvUrl(playing.tmdbId);

  const useSandbox = server.sandbox && !sandboxOff;
  // allow-modals is critical to keep the player from breaking
  const sandboxValue = "allow-forms allow-scripts allow-same-origin allow-presentation allow-modals allow-orientation-lock allow-pointer-lock";

  return (
    <div style={{ position:"fixed", inset:0, zIndex:300, background:"#000" }} onClick={e => e.stopPropagation()}>
      <style>{AD_NUKE_CSS}</style>

      {/* Control Bar */}
      <div style={{ position:"absolute", top:0, left:0, right:0, zIndex:100, display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", background:"linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)", pointerEvents:"none" }}>
        <div style={{ display:"flex", gap:8, alignItems:"center", pointerEvents:"auto" }}>
          <button className="k4k-server-btn" onClick={() => setShowDropdown(!showDropdown)}>
            <Icons.Server /> {server.name} ▾
          </button>
          
          {useSandbox && (
            <div style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 10px", borderRadius:12, background:"rgba(34,197,94,0.15)", border:"1px solid rgba(34,197,94,0.3)", fontSize:10, fontWeight:700, color:"var(--green)" }}>
              <Icons.Shield /> Shield Active
            </div>
          )}

          {showDropdown && (
            <div className="k4k-server-dropdown">
              {SERVERS.map(s => (
                <div key={s.id} className={`k4k-server-item ${s.id === serverId ? "active" : ""}`} onClick={() => switchServer(s.id)}>
                  <span>{s.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <button className="k4k-player-close" style={{ background:'none', border:'none', color:'#fff', cursor:'pointer', pointerEvents:"auto" }} onClick={onClose}><Icons.Close /></button>
      </div>

      <div className="k4k-player-wrap" style={{ width:"100%", height:"100%", position: "relative" }}>
        {/* CLICK SHIELD: Absorbs first 2 clicks to "burn" invisible ads */}
        {clickCount < 2 && (
          <div onClick={handleShieldClick} style={{ position: "absolute", inset: 0, zIndex: 10, cursor: "pointer", background: "transparent" }} />
        )}

        <iframe
          ref={iframeRef}
          key={`${serverId}-${useSandbox}-${clickCount}`}
          className="k4k-player-iframe"
          src={embedSrc}
          allowFullScreen
          allow="autoplay; fullscreen; encrypted-media"
          referrerPolicy="origin"
          style={{ width:"100%", height:"100%", border:"none" }}
          {...(useSandbox ? { sandbox: sandboxValue } : {})}
        />
      </div>
    </div>
  );
}

// --- DETAIL PAGE ---
function DetailPage({ item, type, onClose }) {
  const [detail, setDetail] = useState(null);
  const [credits, setCredits] = useState(null);
  const [season, setSeason] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [playing, setPlaying] = useState(null);

  useEffect(() => {
    (async () => {
      const [d, c] = await Promise.all([tmdbFetch(`/${type}/${item.id}`), tmdbFetch(`/${type}/${item.id}/credits`)]);
      setDetail(d); setCredits(c);
      if (type === "tv" && d?.seasons?.length) setSeason(d.seasons[0].season_number || 1);
    })();
  }, [item, type]);

  useEffect(() => {
    if (type === "tv" && detail) {
      (async () => { const s = await tmdbFetch(`/tv/${item.id}/season/${season}`); setEpisodes(s?.episodes || []); })();
    }
  }, [season, detail, item, type]);

  const title = detail?.title || detail?.name || item.title || item.name;

  return (
    <div className="k4k-detail">
      <div className="k4k-detail-hero">
        <div className="k4k-detail-bg" style={{ backgroundImage: `url(${backdropUrl(item.backdrop_path || item.poster_path)})` }} />
        <div className="k4k-detail-grad" />
        <button className="k4k-nav-link" style={{ position:'absolute', top:20, left:20, zIndex:5, background:'var(--glass)' }} onClick={onClose}><Icons.Back /></button>
      </div>
      <div className="k4k-detail-body">
        <h1 className="k4k-hero-title">{title}</h1>
        <p style={{ color: 'var(--text2)', marginBottom: 20 }}>{detail?.overview}</p>
        <button className="k4k-btn k4k-btn-primary" onClick={() => setPlaying({ tmdbId: item.id, type, title })}>
          <Icons.Play /> Watch Now
        </button>

        {type === "tv" && (
          <div style={{ marginTop: 40 }}>
            <div className="k4k-season-tabs">
              {detail?.seasons?.map(s => (
                <button key={s.id} className={`k4k-season-tab ${season === s.season_number ? "active" : ""}`} onClick={() => setSeason(s.season_number)}>S{s.season_number}</button>
              ))}
            </div>
            {episodes.map(ep => (
              <div key={ep.id} className="k4k-episode" onClick={() => setPlaying({ tmdbId: item.id, type: "tv", season, episode: ep.episode_number })}>
                <img className="k4k-ep-still" src={posterUrl(ep.still_path, "w300")} alt="" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>E{ep.episode_number}: {ep.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{ep.overview}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Player playing={playing} onClose={() => setPlaying(null)} />
    </div>
  );
}

// --- MAIN APP ---
export default function Kirito4k() {
  const [tab, setTab] = useState("home");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [rows, setRows] = useState({});
  const [detail, setDetail] = useState(null);
  const [showAdblockAlert, setShowAdblockAlert] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("k4k_ad_warned")) setShowAdblockAlert(true);
    (async () => {
      const [trending, movies, tv] = await Promise.all([tmdbFetch("/trending/all/week"), tmdbFetch("/movie/popular"), tmdbFetch("/tv/popular")]);
      setRows({ trending: trending?.results, movies: movies?.results, tv: tv?.results });
    })();
  }, []);

  useEffect(() => {
    if (!search.trim()) return;
    const t = setTimeout(async () => {
      const r = await tmdbFetch("/search/multi", { query: search });
      setSearchResults(r?.results || []);
    }, 500);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <>
      <style>{css}</style>
      <div className="k4k-app">
        {showAdblockAlert && <AdblockerAlert onDismiss={() => { setShowAdblockAlert(false); localStorage.setItem("k4k_ad_warned", "1"); }} />}
        
        <nav className="k4k-nav scrolled">
          <div className="k4k-logo" onClick={() => setTab("home")}>KIRITO<span>4K</span></div>
          <div className="k4k-search-wrap">
            <span className="k4k-search-icon"><Icons.Search /></span>
            <input className="k4k-search" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </nav>

        <div style={{ paddingTop: 80 }}>
          {search ? (
            <Row title="Search Results" items={searchResults} onSelect={(item) => setDetail({ item, type: item.media_type })} />
          ) : (
            <>
              <Row title="Trending" items={rows.trending} type="movie" onSelect={(item) => setDetail({ item, type: item.media_type || "movie" })} />
              <Row title="Popular Movies" items={rows.movies} type="movie" onSelect={(item) => setDetail({ item, type: "movie" })} />
              <Row title="Popular Shows" items={rows.tv} type="tv" onSelect={(item) => setDetail({ item, type: "tv" })} />
            </>
          )}
        </div>

        {detail && <DetailPage item={detail.item} type={detail.type} onClose={() => setDetail(null)} />}
        
        <footer style={{ padding: 40, textAlign: 'center', opacity: 0.5, fontSize: 12 }}>
          Kirito4K © {new Date().getFullYear()}
        </footer>
      </div>
    </>
  );
}
