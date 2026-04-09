import { useState, useEffect, useRef } from "react";

// --- CONFIG ---
const TMDB_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzMTVjYWYzNjkxNTc1OGIwMDFlOTYwMzg5OWJlOTY3MCIsIm5iZiI6MTc3NTcxMjQyNy44MTksInN1YiI6IjY5ZDczOGFiNTIzNzlkODZhY2Q3NzE4YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ID34IJ0N4KSVI4UIziKBwiPR2NQlLAnblAxZC48GWS8";
const TMDB = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

const SERVERS = [
  { id: "vidsrc", name: "VidSrc (Best)", movieUrl: (id) => `https://vsrc.su/embed/movie?tmdb=${id}`, tvUrl: (id) => `https://vsrc.su/embed/tv?tmdb=${id}`, episodeUrl: (id, s, e) => `https://vsrc.su/embed/tv?tmdb=${id}&season=${s}&episode=${e}` },
  { id: "vidlink", name: "VidLink", movieUrl: (id) => `https://vidlink.pro/movie/${id}`, tvUrl: (id) => `https://vidlink.pro/tv/${id}`, episodeUrl: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}` },
];

// --- ICONS ---
const Icons = {
  Search: () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>,
  Play: () => <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>,
  Back: () => <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M15 19l-7-7 7-7"/></svg>,
};

// --- STYLES ---
const css = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700&display=swap');
:root { --bg: #06060a; --surface: #12121a; --accent: #e50914; --text: #f0f0f5; --text2: #9494b8; }
body { margin:0; background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; overflow-x: hidden; }
.nav { height: 75px; display: flex; align-items: center; padding: 0 50px; background: linear-gradient(to bottom, rgba(0,0,0,0.9), transparent); position: fixed; width: 100%; z-index: 100; transition: 0.3s; }
.logo { font-family: 'Bebas Neue'; font-size: 34px; color: var(--accent); cursor: pointer; letter-spacing: 1px; }
.search-container { margin-left: auto; position: relative; }
.search-bar { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.1); padding: 10px 15px 10px 45px; border-radius: 8px; color: #fff; width: 300px; outline: none; backdrop-filter: blur(10px); }
.row { padding: 30px 50px 0; }
.row-title { font-family: 'Bebas Neue'; font-size: 26px; margin-bottom: 20px; opacity: 0.9; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 25px; }
.card { cursor: pointer; transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1); }
.card:hover { transform: scale(1.08); z-index: 10; }
.card img { width: 100%; border-radius: 12px; aspect-ratio: 2/3; object-fit: cover; box-shadow: 0 10px 20px rgba(0,0,0,0.5); }
.detail-view { position: fixed; inset: 0; background: var(--bg); z-index: 200; overflow-y: auto; }
.hero { height: 60vh; background-size: cover; background-position: center; position: relative; }
.hero-grad { position: absolute; inset: 0; background: linear-gradient(to top, var(--bg) 10%, transparent 90%); }
.content { padding: 0 50px 80px; margin-top: -120px; position: relative; z-index: 5; }
.ep-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin-top: 30px; }
.ep-card { background: var(--surface); border-radius: 12px; overflow: hidden; cursor: pointer; border: 1px solid rgba(255,255,255,0.05); transition: 0.3s; }
.ep-card:hover { border-color: var(--accent); transform: translateY(-5px); }
.player-screen { position: fixed; inset: 0; background: #000; z-index: 3000; }
.focus-revert-ui { position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); background: #22c55e; color: #000; padding: 10px 25px; border-radius: 30px; font-weight: 800; font-size: 12px; z-index: 4000; pointer-events: none; }
`;

function Player({ media, onClose }) {
  const [serverId, setServerId] = useState("vidsrc");
  const [fighting, setFighting] = useState(false);
  const server = SERVERS.find(s => s.id === serverId);

  const url = media.episode 
    ? server.episodeUrl(media.tmdbId, media.season, media.episode)
    : (media.type === "movie" ? server.movieUrl(media.tmdbId) : server.tvUrl(media.tmdbId));

  const runAdFight = () => {
    setFighting(true);
    const interval = setInterval(() => window.focus(), 600);
    setTimeout(() => { clearInterval(interval); setFighting(false); }, 12000);
  };

  useEffect(() => {
    const handleAction = () => { window.open = () => null; runAdFight(); };
    window.addEventListener("click", handleAction);
    return () => window.removeEventListener("click", handleAction);
  }, []);

  return (
    <div className="player-screen">
      <div style={{ position: "absolute", top: 20, left: 20, right: 20, zIndex: 4000, display: "flex", justifyContent: "space-between" }}>
        <select value={serverId} onChange={e => setServerId(e.target.value)} style={{ background: "rgba(0,0,0,0.7)", color: "#fff", border: "1px solid #444", padding: "8px 15px", borderRadius: "5px" }}>
          {SERVERS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button onClick={onClose} style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "10px 25px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>EXIT</button>
      </div>

      {fighting && <div className="focus-revert-ui">🛡️ REVERT SHIELD ACTIVE</div>}
      <iframe key={serverId} src={url} style={{ width: "100%", height: "100%", border: "none" }} allowFullScreen />
    </div>
  );
}

export default function Kirito4K() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [play, setPlay] = useState(null);

  useEffect(() => {
    fetch(`${TMDB}/trending/all/day`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } })
      .then(r => r.json()).then(d => setItems(d.results || []));
  }, []);

  useEffect(() => {
    if (!search) return setResults([]);
    const t = setTimeout(() => {
      fetch(`${TMDB}/search/multi?query=${search}`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } })
        .then(r => r.json()).then(d => setResults(d.results || []));
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (selected && (selected.media_type === "tv" || !selected.title)) {
      fetch(`${TMDB}/tv/${selected.id}/season/1`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } })
        .then(r => r.json()).then(d => setEpisodes(d.episodes || []));
    }
  }, [selected]);

  return (
    <div>
      <style>{css}</style>
      <nav className="nav">
        <div className="logo" onClick={() => { setSelected(null); setSearch(""); }}>KIRITO4K</div>
        <div className="search-container">
          <div style={{ position: "absolute", left: 15, top: 12, opacity: 0.5 }}><Icons.Search /></div>
          <input className="search-bar" placeholder="Search movies, shows..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </nav>

      <div style={{ paddingTop: 20 }}>
        <div className="row">
          <div className="row-title">{search ? "Search Results" : "Trending Now"}</div>
          <div className="grid">
            {(search ? results : items).map(item => (
              <div key={item.id} className="card" onClick={() => setSelected(item)}>
                <img src={item.poster_path ? `${IMG}/w500${item.poster_path}` : ""} alt="" />
                <div style={{ marginTop: 12, fontSize: 14, fontWeight: "700" }}>{item.title || item.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selected && (
        <div className="detail-view">
          <div className="hero" style={{ backgroundImage: `url(${IMG}/original${selected.backdrop_path})` }}>
            <div className="hero-grad" />
            <button onClick={() => setSelected(null)} style={{ position: "absolute", top: 30, left: 30, background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", padding: "12px", borderRadius: "50%", cursor: "pointer" }}><Icons.Back /></button>
          </div>
          <div className="content">
            <h1 style={{ fontFamily: "Bebas Neue", fontSize: 60, marginBottom: 15 }}>{selected.title || selected.name}</h1>
            <p style={{ color: "var(--text2)", maxWidth: 750, lineHeight: 1.7, fontSize: 16 }}>{selected.overview}</p>
            
            {selected.title ? (
              <button onClick={() => setPlay({ tmdbId: selected.id, type: "movie" })} style={{ marginTop: 30, background: "var(--accent)", color: "#fff", border: "none", padding: "16px 45px", borderRadius: 8, fontWeight: "800", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <Icons.Play /> WATCH MOVIE
              </button>
            ) : (
              <div className="ep-grid">
                {episodes.map(ep => (
                  <div key={ep.id} className="ep-card" onClick={() => setPlay({ tmdbId: selected.id, type: "tv", season: 1, episode: ep.episode_number })}>
                    <img src={`${IMG}/w500${ep.still_path}`} style={{ width: "100%", aspectRation: '16/9' }} alt="" />
                    <div style={{ padding: 15 }}>
                      <div style={{ fontWeight: "bold", fontSize: 15 }}>E{ep.episode_number}: {ep.name}</div>
                    </div>
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
