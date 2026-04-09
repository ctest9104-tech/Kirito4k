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
    sandbox: true, // Switched to true to test the new shield
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
  Info: () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  Home: () => <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"/></svg>,
  Film: () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5" stroke="currentColor" strokeWidth="2"/></svg>,
  Tv: () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="15" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M17 2l-5 5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Close: () => <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  Server: () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="2"/><rect x="2" y="14" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="2"/><circle cx="6" cy="6" r="1" fill="currentColor"/><circle cx="6" cy="18" r="1" fill="currentColor"/></svg>,
  Shield: () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>,
};

// --- CSS ---
const css = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap');
:root {
  --bg: #0a0a0f;
  --surface: #12121a;
  --surface2: #1a1a26;
  --accent: #e50914;
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
.k4k-nav { position:fixed; top:0; left:0; right:0; z-index:100; padding:0 24px; height:64px; display:flex; align-items:center; gap:24px; background: var(--glass); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.05); }
.k4k-logo { font-family:'Bebas Neue',sans-serif; font-size:32px; color: var(--accent); cursor:pointer; }
.k4k-logo span { color: var(--text); font-size:20px; opacity:0.7; }
.k4k-nav-link { padding:8px 16px; border-radius:6px; font-size:14px; font-weight:500; color: var(--text2); cursor:pointer; border:none; background:none; display:flex; align-items:center; gap:6px; }
.k4k-nav-link.active { color: var(--text); background: rgba(255,255,255,0.06); }
.k4k-search-wrap { margin-left:auto; position:relative; }
.k4k-search { background: var(--surface2); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:8px 12px 8px 36px; color:var(--text); font-size:14px; width:240px; outline:none; }
.k4k-search-icon { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--text3); }
.k4k-section { padding:32px 0 0; }
.k4k-section-title { font-family:'Bebas Neue',sans-serif; font-size:24px; padding:0 48px; margin-bottom:14px; }
.k4k-row { display:flex; gap:12px; overflow-x:auto; padding:0 48px 16px; scrollbar-width:none; }
.k4k-row::-webkit-scrollbar { display:none; }
.k4k-card { flex:0 0 auto; width:185px; cursor:pointer; transition: transform 0.25s; position:relative; }
.k4k-card:hover { transform:scale(1.08); z-index:3; }
.k4k-card-img { width:100%; aspect-ratio:2/3; border-radius:var(--radius); object-fit:cover; background:var(--surface2); }
.k4k-detail { position:fixed; inset:0; z-index:200; background:var(--bg); overflow-y:auto; }
.k4k-detail-hero { position:relative; height:50vh; background-size:cover; background-position:center; }
.k4k-detail-grad { position:absolute; inset:0; background: linear-gradient(to top, var(--bg) 0%, transparent 100%); }
.k4k-detail-body { position:relative; z-index:2; max-width:1100px; margin:-60px auto 0; padding:0 32px 60px; }
.k4k-player-wrap { width:100%; height:100%; position: relative; background: #000; overflow: hidden; }
.k4k-click-burner { position: absolute; inset: 0; z-index: 1000; cursor: pointer; background: rgba(0,0,0,0.01); }

/* AGGRESSIVE AD REMOVAL */
.k4k-player-wrap [id*="ads"], .k4k-player-wrap [class*="ads"], 
.k4k-player-wrap [class*="overlay"], .k4k-player-wrap [class*="popup"],
.k4k-player-wrap iframe[src*="vsrc"], .k4k-player-wrap div[style*="z-index: 2147483647"] {
    display: none !important;
    pointer-events: none !important;
}
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
function posterUrl(path) { return path ? `${IMG}/w500${path}` : ""; }
function backdropUrl(path) { return path ? `${IMG}/original${path}` : ""; }

// --- UPDATED PLAYER COMPONENT ---
function Player({ playing, onClose }) {
  const [serverId, setServerId] = useState(getStoredServer);
  const [showDropdown, setShowDropdown] = useState(false);
  const [clickBurner, setClickBurner] = useState(3); // Captures the first 3 clicks
  const [sandboxOff, setSandboxOff] = useState(false);
  
  const server = SERVERS.find(s => s.id === serverId) || SERVERS[0];

  const handleBurnerClick = (e) => {
    e.stopPropagation();
    setClickBurner(prev => prev - 1);
    console.log(`[Kirito4K] Burner active. Clicks remaining: ${clickBurner - 1}`);
  };

  const switchServer = (id) => {
    setServerId(id);
    storeServer(id);
    setShowDropdown(false);
    setSandboxOff(false);
    setClickBurner(3); // Reset shield for new server
  };

  if (!playing) return null;

  let embedSrc;
  if (playing.type === "movie") embedSrc = server.movieUrl(playing.tmdbId);
  else if (playing.episode) embedSrc = server.episodeUrl(playing.tmdbId, playing.season, playing.episode);
  else embedSrc = server.tvUrl(playing.tmdbId);

  const useSandbox = server.sandbox && !sandboxOff;
  // allow-modals prevents scripts from being "angry" about blocked popups
  const sandboxValue = "allow-forms allow-scripts allow-same-origin allow-presentation allow-modals allow-pointer-lock";

  return (
    <div style={{ position:"fixed", inset:0, zIndex:300, background:"#000" }}>
      {/* Top Controls */}
      <div style={{ position:"absolute", top:0, left:0, right:0, zIndex:2000, display:"flex", justifyContent:"space-between", padding:"12px 16px", background:"linear-gradient(to bottom, #000, transparent)" }}>
        <div style={{ display:"flex", gap:8, position: "relative" }}>
          <button className="k4k-nav-link active" style={{ background:"rgba(0,0,0,0.6)", backdropFilter:"blur(10px)" }} onClick={() => setShowDropdown(!showDropdown)}>
            <Icons.Server /> {server.name}
          </button>
          {showDropdown && (
            <div style={{ position:"absolute", top:"100%", left:0, background:"var(--surface)", borderRadius:8, marginTop:4, overflow:"hidden", width:200, border:"1px solid rgba(255,255,255,0.1)" }}>
              {SERVERS.map(s => (
                <div key={s.id} onClick={() => switchServer(s.id)} style={{ padding:12, fontSize:13, cursor:"pointer", color: s.id === serverId ? "var(--accent)" : "#fff", background: s.id === serverId ? "rgba(255,255,255,0.05)" : "transparent" }}>
                  {s.name}
                </div>
              ))}
              <div onClick={() => setSandboxOff(!sandboxOff)} style={{ padding:12, fontSize:11, borderTop:"1px solid rgba(255,255,255,0.1)", color:"var(--text3)", cursor:"pointer" }}>
                {sandboxOff ? "⚠️ Sandbox: Disabled (High risk)" : "🛡️ Sandbox: Active (Safer)"}
              </div>
            </div>
          )}
          {clickBurner > 0 && (
            <div style={{ background: "var(--accent)", color: "#fff", padding: "4px 12px", borderRadius: 20, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
              <Icons.Shield /> SHIELD ACTIVE: CLICK PLAYER {clickBurner} TIMES
            </div>
          )}
        </div>
        <button onClick={onClose} style={{ background:"none", border:"none", color:"#fff", cursor:"pointer" }}><Icons.Close /></button>
      </div>

      <div className="k4k-player-wrap">
        {/* CLICK BURNER: This div sits on top to catch the popup triggers */}
        {clickBurner > 0 && <div className="k4k-click-burner" onClick={handleBurnerClick} />}
        
        <iframe
          key={`${serverId}-${sandboxOff}-${clickBurner}`}
          src={embedSrc}
          style={{ width:"100%", height:"100%", border:"none" }}
          allowFullScreen
          allow="autoplay; encrypted-media"
          {...(useSandbox ? { sandbox: sandboxValue } : {})}
        />
      </div>
    </div>
  );
}

// --- DETAIL & ROW COMPONENTS ---
function Row({ title, items, onSelect }) {
  if (!items?.length) return null;
  return (
    <div className="k4k-section">
      <div className="k4k-section-title">{title}</div>
      <div className="k4k-row">
        {items.map((item) => (
          <div key={item.id} className="k4k-card" onClick={() => onSelect(item)}>
            <img className="k4k-card-img" src={posterUrl(item.poster_path)} alt="" />
            <div style={{ marginTop:8, fontSize:13, fontWeight:600 }}>{item.title || item.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailPage({ item, onClose }) {
  const [detail, setDetail] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [playing, setPlaying] = useState(null);
  const type = item.first_air_date ? "tv" : "movie";

  useEffect(() => {
    (async () => {
      const d = await tmdbFetch(`/${type}/${item.id}`);
      setDetail(d);
      if (type === "tv") {
        const s = await tmdbFetch(`/tv/${item.id}/season/1`);
        setEpisodes(s?.episodes || []);
      }
    })();
  }, [item, type]);

  return (
    <div className="k4k-detail">
      <div className="k4k-detail-hero" style={{ backgroundImage: `url(${backdropUrl(item.backdrop_path)})` }}>
        <div className="k4k-detail-grad" />
        <button onClick={onClose} style={{ position:'absolute', top:80, left:20, background:'none', border:'none', color:'#fff', cursor:'pointer' }}><Icons.Back /></button>
      </div>
      <div className="k4k-detail-body">
        <h1 style={{ fontSize:48, fontFamily:'Bebas Neue', marginBottom:16 }}>{detail?.title || detail?.name}</h1>
        <p style={{ color:'var(--text2)', marginBottom:24, maxWidth:700 }}>{detail?.overview}</p>
        <button className="k4k-btn-primary" style={{ padding:'12px 32px', borderRadius:8, border:'none', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }} onClick={() => setPlaying({ tmdbId: item.id, type })}>
          <Icons.Play /> Watch Now
        </button>

        {type === "tv" && (
          <div style={{ marginTop:40 }}>
            <h3 style={{ marginBottom:20 }}>Episodes</h3>
            {episodes.map(ep => (
              <div key={ep.id} className="k4k-episode" onClick={() => setPlaying({ tmdbId: item.id, type:"tv", season:1, episode:ep.episode_number })}>
                <img className="k4k-ep-still" src={posterUrl(ep.still_path)} alt="" />
                <div>
                  <div style={{ fontWeight:600 }}>E{ep.episode_number}: {ep.name}</div>
                  <div style={{ fontSize:12, color:'var(--text3)' }}>{ep.overview}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {playing && <Player playing={playing} onClose={() => setPlaying(null)} />}
    </div>
  );
}

// --- MAIN APP ---
export default function Kirito4k() {
  const [rows, setRows] = useState({});
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    (async () => {
      const [trend, movies, tv] = await Promise.all([tmdbFetch("/trending/all/week"), tmdbFetch("/movie/popular"), tmdbFetch("/tv/popular")]);
      setRows({ trend: trend?.results, movies: movies?.results, tv: tv?.results });
    })();
  }, []);

  useEffect(() => {
    if (!search.trim()) return;
    const t = setTimeout(async () => {
      const r = await tmdbFetch("/search/multi", { query: search });
      setResults(r?.results || []);
    }, 500);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <>
      <style>{css}</style>
      <div className="k4k-app">
        <nav className="k4k-nav">
          <div className="k4k-logo" onClick={() => {setDetail(null); setSearch("")}}>KIRITO<span>4K</span></div>
          <div className="k4k-search-wrap">
            <span className="k4k-search-icon"><Icons.Search /></span>
            <input className="k4k-search" placeholder="Search movies..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </nav>

        <div style={{ paddingTop:80 }}>
          {search ? (
            <Row title="Search Results" items={results} onSelect={setDetail} />
          ) : (
            <>
              <Row title="Trending Now" items={rows.trend} onSelect={setDetail} />
              <Row title="Popular Movies" items={rows.movies} onSelect={setDetail} />
              <Row title="TV Shows" items={rows.tv} onSelect={setDetail} />
            </>
          )}
        </div>

        {detail && <DetailPage item={detail} onClose={() => setDetail(null)} />}
      </div>
    </>
  );
}
