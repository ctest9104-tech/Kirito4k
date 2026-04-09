import { useState, useEffect, useRef } from "react";

// --- CONFIG ---
const TMDB_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzMTVjYWYzNjkxNTc1OGIwMDFlOTYwMzg5OWJlOTY3MCIsIm5iZiI6MTc3NTcxMjQyNy44MTksInN1YiI6IjY5ZDczOGFiNTIzNzlkODZhY2Q3NzE4YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ID34IJ0N4KSVI4UIziKBwiPR2NQlLAnblAxZC48GWS8";
const TMDB = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

const SERVERS = [
  { id: "vidlink", name: "VidLink (Recommended)", movieUrl: (id) => `https://vidlink.pro/movie/${id}`, tvUrl: (id) => `https://vidlink.pro/tv/${id}`, episodeUrl: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}` },
  { id: "vidsrc", name: "VidSrc", movieUrl: (id) => `https://vsrc.su/embed/movie?tmdb=${id}`, tvUrl: (id) => `https://vsrc.su/embed/tv?tmdb=${id}`, episodeUrl: (id, s, e) => `https://vsrc.su/embed/tv?tmdb=${id}&season=${s}&episode=${e}` },
  { id: "embedsu", name: "Embed.su", movieUrl: (id) => `https://embed.su/embed/movie/${id}`, tvUrl: (id) => `https://embed.su/embed/tv/${id}`, episodeUrl: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}` },
];

// --- ICONS ---
const Icons = {
  Search: () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>,
  Play: () => <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>,
  Back: () => <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M15 19l-7-7 7-7"/></svg>,
  Close: () => <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  Shield: () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
};

// --- STYLES ---
const css = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700&display=swap');
:root { --bg: #08080c; --surface: #12121a; --accent: #e50914; --text: #f0f0f5; --text2: #9494b8; --green: #22c55e; }
* { margin:0; padding:0; box-sizing:border-box; }
body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; }
.app { min-height: 100vh; }
.nav { position: fixed; top:0; width:100%; height:70px; display:flex; align-items:center; padding:0 40px; background: rgba(8,8,12,0.8); backdrop-filter: blur(12px); z-index:100; border-bottom: 1px solid rgba(255,255,255,0.05); }
.logo { font-family: 'Bebas Neue', cursive; font-size:32px; color: var(--accent); cursor: pointer; letter-spacing: 1px; }
.search-box { margin-left: auto; position: relative; }
.search-input { background: var(--surface); border: 1px solid rgba(255,255,255,0.1); padding: 10px 15px 10px 40px; border-radius: 8px; color: #fff; width: 280px; outline: none; }
.row { padding: 20px 40px; }
.row-title { font-family: 'Bebas Neue'; font-size: 24px; margin-bottom: 15px; opacity: 0.9; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 20px; }
.card { cursor: pointer; transition: transform 0.3s; }
.card:hover { transform: scale(1.05); }
.card img { width: 100%; border-radius: 10px; aspect-ratio: 2/3; object-fit: cover; background: var(--surface); }
.detail-view { position: fixed; inset: 0; background: var(--bg); z-index: 200; overflow-y: auto; }
.hero { height: 60vh; background-size: cover; background-position: center; position: relative; }
.hero-overlay { position: absolute; inset: 0; background: linear-gradient(to top, var(--bg), transparent); }
.content { padding: 0 40px 60px; margin-top: -100px; position: relative; z-index: 5; }
.ep-list { margin-top: 30px; display: grid; gap: 10px; }
.ep-item { background: var(--surface); padding: 15px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 15px; }
.ep-item:hover { background: #1a1a26; }
.player-container { position: fixed; inset: 0; background: #000; z-index: 500; }
.click-shield { position: absolute; inset: 0; z-index: 1000; background: rgba(0,0,0,0.01); cursor: pointer; }
`;

// --- COMPONENTS ---
function Player({ media, onClose }) {
  const [serverId, setServerId] = useState("vidlink");
  const [clicksRemaining, setClicksRemaining] = useState(3);
  const server = SERVERS.find(s => s.id === serverId);

  // The "Stealth Sandbox": allow-same-origin makes the browser think the frame isn't sandboxed
  // but we still omit 'allow-popups' to kill the ads.
  const sandbox = "allow-forms allow-scripts allow-same-origin allow-pointer-lock allow-presentation";

  const url = media.episode 
    ? server.episodeUrl(media.tmdbId, media.season, media.episode)
    : (media.type === "movie" ? server.movieUrl(media.tmdbId) : server.tvUrl(media.tmdbId));

  return (
    <div className="player-container">
      <div style={{ position: "absolute", top: 20, left: 20, right: 20, zIndex: 2000, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 10 }}>
          <select value={serverId} onChange={(e) => {setServerId(e.target.value); setClicksRemaining(3);}} style={{ background: "rgba(0,0,0,0.7)", color: "#fff", border: "1px solid #444", padding: "5px 10px", borderRadius: 5 }}>
            {SERVERS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {clicksRemaining > 0 && (
            <div style={{ background: "var(--green)", color: "#000", padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: "bold", display: "flex", alignItems: "center", gap: 5 }}>
              <Icons.Shield /> SHIELD ACTIVE: CLICK {clicksRemaining}x TO UNLOCK PLAYER
            </div>
          )}
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><Icons.Close /></button>
      </div>

      <div style={{ width: "100%", height: "100%", position: "relative" }}>
        {clicksRemaining > 0 && (
          <div className="click-shield" onClick={() => setClicksRemaining(c => c - 1)} />
        )}
        <iframe
          key={`${url}-${clicksRemaining === 0}`}
          src={url}
          style={{ width: "100%", height: "100%", border: "none" }}
          allowFullScreen
          sandbox={sandbox}
        />
      </div>
    </div>
  );
}

export default function Kirito4K() {
  const [trending, setTrending] = useState([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [play, setPlay] = useState(null);

  useEffect(() => {
    fetch(`${TMDB}/trending/all/week`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } })
      .then(r => r.json()).then(data => setTrending(data.results || []));
  }, []);

  useEffect(() => {
    if (!search) return setResults([]);
    const timeout = setTimeout(() => {
      fetch(`${TMDB}/search/multi?query=${search}`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } })
        .then(r => r.json()).then(data => setResults(data.results || []));
    }, 500);
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div className="app">
      <style>{css}</style>
      <nav className="nav">
        <div className="logo" onClick={() => {setSelected(null); setSearch("");}}>KIRITO4K</div>
        <div className="search-box">
          <div style={{ position: "absolute", left: 12, top: 12, opacity: 0.5 }}><Icons.Search /></div>
          <input className="search-input" placeholder="Search movies or shows..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </nav>

      <div style={{ paddingTop: 90 }}>
        <div className="row">
          <div className="row-title">{search ? "Search Results" : "Trending This Week"}</div>
          <div className="grid">
            {(search ? results : trending).map(item => (
              <div key={item.id} className="card" onClick={() => setSelected(item)}>
                <img src={item.poster_path ? `${IMG}/w500${item.poster_path}` : ""} alt="" />
                <div style={{ marginTop: 10, fontSize: 14, fontWeight: "bold" }}>{item.title || item.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selected && (
        <div className="detail-view">
          <div className="hero" style={{ backgroundImage: `url(${IMG}/original${selected.backdrop_path})` }}>
            <div className="hero-overlay" />
            <button onClick={() => setSelected(null)} style={{ position: "absolute", top: 30, left: 30, background: "none", border: "none", color: "#fff", cursor: "pointer" }}><Icons.Back /></button>
          </div>
          <div className="content">
            <h1 style={{ fontFamily: "Bebas Neue", fontSize: 50, marginBottom: 10 }}>{selected.title || selected.name}</h1>
            <p style={{ color: "var(--text2)", maxWidth: 700, lineHeight: 1.6 }}>{selected.overview}</p>
            
            <button onClick={() => setPlay({ tmdbId: selected.id, type: selected.media_type || (selected.title ? "movie" : "tv") })} style={{ marginTop: 25, background: "var(--accent)", color: "#fff", border: "none", padding: "12px 30px", borderRadius: 8, fontWeight: "bold", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <Icons.Play /> WATCH NOW
            </button>

            {/* Simple Episode List (S1) for TV */}
            {(selected.media_type === "tv" || !selected.title) && (
              <div className="ep-list">
                <h3 style={{ margin: "20px 0" }}>Season 1</h3>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(ep => (
                  <div key={ep} className="ep-item" onClick={() => setPlay({ tmdbId: selected.id, type: "tv", season: 1, episode: ep })}>
                    <div style={{ background: "var(--accent)", width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: "bold" }}>{ep}</div>
                    <div>Episode {ep}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {play && <Player media={play} onClose={() => setPlay(null)} />}
    </div>
  );
}
