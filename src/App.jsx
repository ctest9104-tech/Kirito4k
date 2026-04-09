import { useState, useEffect, useRef, useCallback } from "react";

const TMDB_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzMTVjYWYzNjkxNTc1OGIwMDFlOTYwMzg5OWJlOTY3MCIsIm5iZiI6MTc3NTcxMjQyNy44MTksInN1YiI6IjY5ZDczOGFiNTIzNzlkODZhY2Q3NzE4YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ID34IJ0N4KSVI4UIziKBwiPR2NQlLAnblAxZC48GWS8";
const TMDB = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

// =====================================================
// MULTI-SERVER CONFIG
// Each server has its own URL pattern for movies/TV/episodes
// If one server is down, users can switch to another
// =====================================================
const SERVERS = [
  {
    id: "vidsrc",
    name: "VidSrc",
    movieUrl:   (id) => `https://vsrc.su/embed/movie?tmdb=${id}`,
    tvUrl:      (id) => `https://vsrc.su/embed/tv?tmdb=${id}`,
    episodeUrl: (id, s, e) => `https://vsrc.su/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
  },
  {
    id: "superembed",
    name: "SuperEmbed",
    movieUrl:   (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    tvUrl:      (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    episodeUrl: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
  {
    id: "autoembed",
    name: "AutoEmbed",
    movieUrl:   (id) => `https://player.autoembed.cc/embed/movie/${id}`,
    tvUrl:      (id) => `https://player.autoembed.cc/embed/tv/${id}`,
    episodeUrl: (id, s, e) => `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "111movies",
    name: "111Movies",
    movieUrl:   (id) => `https://111movies.com/movie/${id}`,
    tvUrl:      (id) => `https://111movies.com/tv/${id}`,
    episodeUrl: (id, s, e) => `https://111movies.com/tv/${id}/${s}/${e}`,
  },
  {
    id: "vidnest",
    name: "VidNest",
    movieUrl:   (id) => `https://vidnest.fun/movie/${id}`,
    tvUrl:      (id) => `https://vidnest.fun/tv/${id}`,
    episodeUrl: (id, s, e) => `https://vidnest.fun/tv/${id}/${s}/${e}`,
  },
];

function getStoredServer() {
  try { return localStorage.getItem("k4k_server") || "vidsrc"; } catch { return "vidsrc"; }
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
  Check: () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  External: () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

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
::-webkit-scrollbar { width:6px; height:6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--text3); border-radius:3px; }
.k4k-app { min-height:100vh; background: var(--bg); }
.k4k-nav { position:fixed; top:0; left:0; right:0; z-index:100; padding:0 24px; height:64px; display:flex; align-items:center; gap:24px; transition: background 0.3s; }
.k4k-nav.scrolled { background: var(--glass); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.05); }
.k4k-logo { font-family:'Bebas Neue',sans-serif; font-size:32px; letter-spacing:2px; color: var(--accent); cursor:pointer; user-select:none; text-shadow: 0 0 30px rgba(229,9,20,0.4); }
.k4k-logo span { color: var(--text); font-size:20px; opacity:0.7; }
.k4k-nav-links { display:flex; gap:4px; margin-left:16px; }
.k4k-nav-link { padding:8px 16px; border-radius:6px; font-size:14px; font-weight:500; color: var(--text2); cursor:pointer; transition: all 0.2s; border:none; background:none; display:flex; align-items:center; gap:6px; }
.k4k-nav-link:hover, .k4k-nav-link.active { color: var(--text); background: rgba(255,255,255,0.06); }
.k4k-search-wrap { margin-left:auto; position:relative; }
.k4k-search { background: var(--surface2); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:8px 12px 8px 36px; color:var(--text); font-size:14px; width:240px; outline:none; transition: all 0.3s; font-family:'DM Sans',sans-serif; }
.k4k-search:focus { width:320px; border-color: var(--accent); background: var(--surface); }
.k4k-search-icon { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--text3); }
.k4k-mobile-menu { display:none; background:none; border:none; color:var(--text); cursor:pointer; }
.k4k-hero { position:relative; height:85vh; min-height:500px; overflow:hidden; }
.k4k-hero-bg { position:absolute; inset:0; background-size:cover; background-position:center top; transition: background-image 0.6s ease; }
.k4k-hero-overlay { position:absolute; inset:0; background: linear-gradient(to right, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.6) 50%, rgba(10,10,15,0.3) 100%), linear-gradient(to top, var(--bg) 0%, transparent 40%); }
.k4k-hero-content { position:absolute; bottom:15%; left:48px; max-width:580px; z-index:2; }
.k4k-hero-title { font-family:'Bebas Neue',sans-serif; font-size:clamp(36px,6vw,72px); line-height:0.95; letter-spacing:1px; margin-bottom:12px; text-shadow: 0 4px 30px rgba(0,0,0,0.5); }
.k4k-hero-meta { display:flex; align-items:center; gap:12px; margin-bottom:16px; font-size:14px; color:var(--text2); }
.k4k-hero-rating { display:flex; align-items:center; gap:4px; color:var(--gold); font-weight:600; }
.k4k-hero-desc { font-size:15px; line-height:1.6; color:var(--text2); margin-bottom:24px; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
.k4k-hero-btns { display:flex; gap:12px; }
.k4k-btn { padding:12px 28px; border-radius:8px; font-size:15px; font-weight:600; cursor:pointer; border:none; display:flex; align-items:center; gap:8px; transition: all 0.2s; font-family:'DM Sans',sans-serif; }
.k4k-btn-primary { background:var(--accent); color:#fff; }
.k4k-btn-primary:hover { background:var(--accent2); transform:scale(1.03); }
.k4k-btn-secondary { background:rgba(255,255,255,0.1); color:var(--text); backdrop-filter:blur(10px); }
.k4k-btn-secondary:hover { background:rgba(255,255,255,0.18); }
.k4k-section { padding:32px 0 0; }
.k4k-section-header { display:flex; justify-content:space-between; align-items:center; padding:0 48px; margin-bottom:14px; }
.k4k-section-title { font-family:'Bebas Neue',sans-serif; font-size:24px; letter-spacing:1px; }
.k4k-row-wrap { position:relative; }
.k4k-row { display:flex; gap:12px; overflow-x:auto; padding:0 48px 16px; scroll-behavior:smooth; scrollbar-width:none; }
.k4k-row::-webkit-scrollbar { display:none; }
.k4k-row-btn { position:absolute; top:50%; transform:translateY(-60%); z-index:5; width:44px; height:44px; border-radius:50%; background:var(--glass); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.1); color:var(--text); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s; opacity:0; }
.k4k-row-wrap:hover .k4k-row-btn { opacity:1; }
.k4k-row-btn:hover { background:var(--accent); border-color:var(--accent); }
.k4k-row-btn.left { left:8px; }
.k4k-row-btn.right { right:8px; }
.k4k-card { flex:0 0 auto; width:185px; cursor:pointer; transition: transform 0.25s; position:relative; }
.k4k-card:hover { transform:scale(1.08); z-index:3; }
.k4k-card-img { width:100%; aspect-ratio:2/3; border-radius:var(--radius); object-fit:cover; background:var(--surface2); }
.k4k-card-info { padding:8px 2px 0; }
.k4k-card-name { font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.k4k-card-sub { font-size:11px; color:var(--text3); display:flex; align-items:center; gap:4px; margin-top:2px; }
.k4k-card-badge { position:absolute; top:8px; right:8px; background:var(--accent); color:#fff; font-size:10px; font-weight:700; padding:2px 8px; border-radius:4px; letter-spacing:0.5px; }
.k4k-detail { position:fixed; inset:0; z-index:200; background:var(--bg); overflow-y:auto; animation: fadeUp 0.35s ease; }
@keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
.k4k-detail-hero { position:relative; height:60vh; min-height:400px; }
.k4k-detail-bg { position:absolute; inset:0; background-size:cover; background-position:center; }
.k4k-detail-grad { position:absolute; inset:0; background: linear-gradient(to top, var(--bg) 0%, rgba(10,10,15,0.4) 50%, rgba(10,10,15,0.6) 100%); }
.k4k-detail-back { position:absolute; top:20px; left:20px; z-index:5; width:44px; height:44px; border-radius:50%; background:var(--glass); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.1); color:var(--text); cursor:pointer; display:flex; align-items:center; justify-content:center; }
.k4k-detail-body { position:relative; z-index:2; max-width:1100px; margin:-120px auto 0; padding:0 32px 60px; }
.k4k-detail-title { font-family:'Bebas Neue',sans-serif; font-size:clamp(32px,5vw,56px); letter-spacing:1px; line-height:1; margin-bottom:12px; }
.k4k-detail-meta { display:flex; flex-wrap:wrap; align-items:center; gap:12px; margin-bottom:20px; font-size:14px; color:var(--text2); }
.k4k-detail-overview { font-size:15px; line-height:1.7; color:var(--text2); max-width:700px; margin-bottom:28px; }
.k4k-detail-genres { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:28px; }
.k4k-detail-genre { padding:6px 16px; border-radius:20px; background:var(--surface2); font-size:12px; font-weight:600; color:var(--text2); border:1px solid rgba(255,255,255,0.06); }
.k4k-detail-cast-title { font-family:'Bebas Neue',sans-serif; font-size:20px; letter-spacing:1px; margin-bottom:12px; }
.k4k-detail-cast { display:flex; gap:14px; overflow-x:auto; padding-bottom:12px; }
.k4k-cast-card { flex:0 0 auto; text-align:center; width:90px; }
.k4k-cast-img { width:72px; height:72px; border-radius:50%; object-fit:cover; background:var(--surface2); margin-bottom:6px; }
.k4k-cast-name { font-size:11px; font-weight:600; }
.k4k-cast-char { font-size:10px; color:var(--text3); }
.k4k-player-modal { position:fixed; inset:0; z-index:300; background:rgba(0,0,0,0.95); display:flex; align-items:center; justify-content:center; animation: fadeUp 0.2s ease; }
.k4k-player-box { width:92vw; max-width:1100px; aspect-ratio:16/9; background:#000; border-radius:12px; position:relative; overflow:hidden; border:1px solid rgba(255,255,255,0.06); }
.k4k-player-close { position:absolute; top:12px; right:12px; z-index:10; background:rgba(0,0,0,0.6); backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,0.1); border-radius:50%; width:40px; height:40px; color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s; }
.k4k-player-close:hover { background:var(--accent); }
.k4k-player-iframe { width:100%; height:100%; border:none; border-radius:12px; }
.k4k-player-placeholder { width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; color:var(--text2); }
.k4k-seasons { margin-top:28px; }
.k4k-season-tabs { display:flex; gap:6px; overflow-x:auto; margin-bottom:16px; padding-bottom:4px; }
.k4k-season-tab { padding:8px 18px; border-radius:6px; background:var(--surface2); border:1px solid rgba(255,255,255,0.06); color:var(--text2); font-size:13px; font-weight:600; cursor:pointer; white-space:nowrap; transition:all 0.2s; }
.k4k-season-tab.active { background:var(--accent); color:#fff; border-color:var(--accent); }
.k4k-episodes { display:flex; flex-direction:column; gap:10px; }
.k4k-episode { display:flex; gap:14px; padding:12px; border-radius:var(--radius); background:var(--surface); border:1px solid rgba(255,255,255,0.04); cursor:pointer; transition:all 0.2s; align-items:center; }
.k4k-episode:hover { background:var(--surface2); border-color:rgba(255,255,255,0.08); }
.k4k-ep-still { width:180px; aspect-ratio:16/9; border-radius:6px; object-fit:cover; background:var(--surface2); flex-shrink:0; }
.k4k-ep-info { flex:1; min-width:0; }
.k4k-ep-num { font-size:11px; color:var(--accent); font-weight:700; margin-bottom:2px; }
.k4k-ep-name { font-size:14px; font-weight:600; margin-bottom:4px; }
.k4k-ep-overview { font-size:12px; color:var(--text3); line-height:1.5; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.k4k-ep-play { width:40px; height:40px; border-radius:50%; background:var(--accent); color:#fff; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.k4k-results { padding:80px 48px 40px; min-height:80vh; }
.k4k-results-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(170px,1fr)); gap:20px; }
.k4k-results-title { font-family:'Bebas Neue',sans-serif; font-size:28px; margin-bottom:20px; }
.k4k-no-results { text-align:center; padding:80px 0; color:var(--text3); font-size:18px; }
.k4k-footer { margin-top:60px; padding:40px 48px; border-top:1px solid rgba(255,255,255,0.05); text-align:center; color:var(--text3); font-size:12px; }
.k4k-skeleton { background: linear-gradient(90deg, var(--surface2) 25%, var(--surface) 50%, var(--surface2) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: var(--radius); }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* SERVER SELECTOR */
.k4k-server-bar { position:absolute; top:12px; left:12px; z-index:10; display:flex; gap:6px; align-items:center; }
.k4k-server-btn { display:flex; align-items:center; gap:6px; padding:6px 14px; border-radius:20px; background:rgba(0,0,0,0.7); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.15); color:var(--text); font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s; font-family:'DM Sans',sans-serif; }
.k4k-server-btn:hover { border-color:rgba(255,255,255,0.3); background:rgba(0,0,0,0.85); }
.k4k-server-dropdown { position:absolute; top:100%; left:0; margin-top:6px; background:var(--surface); border:1px solid rgba(255,255,255,0.1); border-radius:10px; overflow:hidden; min-width:180px; box-shadow: 0 12px 40px rgba(0,0,0,0.6); animation: fadeUp 0.15s ease; }
.k4k-server-item { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; font-size:13px; font-weight:500; cursor:pointer; transition: background 0.15s; color:var(--text2); }
.k4k-server-item:hover { background:var(--surface2); color:var(--text); }
.k4k-server-item.active { color:var(--green); }
.k4k-server-dot { width:6px; height:6px; border-radius:50%; background:var(--green); }

/* ADBLOCKER MODAL */
.k4k-adblock-overlay { position:fixed; inset:0; z-index:500; background:rgba(0,0,0,0.8); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; animation:fadeUp 0.3s ease; }
.k4k-adblock-modal { background:var(--surface); border:1px solid rgba(255,255,255,0.1); border-radius:16px; max-width:440px; width:90vw; padding:32px; text-align:center; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
.k4k-adblock-icon { width:56px; height:56px; margin:0 auto 16px; border-radius:50%; background:rgba(229,9,20,0.15); display:flex; align-items:center; justify-content:center; color:var(--accent); }
.k4k-adblock-title { font-family:'Bebas Neue',sans-serif; font-size:24px; letter-spacing:1px; margin-bottom:8px; }
.k4k-adblock-desc { font-size:14px; color:var(--text2); line-height:1.6; margin-bottom:24px; }
.k4k-adblock-links { display:flex; flex-direction:column; gap:10px; margin-bottom:20px; }
.k4k-adblock-link { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-radius:10px; background:var(--surface2); border:1px solid rgba(255,255,255,0.06); text-decoration:none; color:var(--text); font-size:13px; font-weight:600; transition:all 0.2s; }
.k4k-adblock-link:hover { border-color:var(--accent); background:rgba(229,9,20,0.08); }
.k4k-adblock-link span { color:var(--text3); font-weight:400; font-size:11px; }
.k4k-adblock-skip { background:none; border:1px solid rgba(255,255,255,0.1); color:var(--text2); padding:10px 24px; border-radius:8px; font-size:13px; cursor:pointer; transition:all 0.2s; font-family:'DM Sans',sans-serif; width:100%; }
.k4k-adblock-skip:hover { border-color:rgba(255,255,255,0.2); color:var(--text); }

@media(max-width:768px) {
  .k4k-nav-links { display:none; }
  .k4k-mobile-menu { display:block; }
  .k4k-search { width:140px; }
  .k4k-search:focus { width:180px; }
  .k4k-hero-content { left:20px; right:20px; bottom:10%; }
  .k4k-section-header, .k4k-row { padding-left:20px; padding-right:20px; }
  .k4k-card { width:140px; }
  .k4k-results { padding:80px 20px 40px; }
  .k4k-ep-still { width:120px; }
  .k4k-footer { padding:40px 20px; }
  .k4k-detail-body { padding:0 20px 40px; }
  .k4k-hero-btns { flex-direction:column; }
  .k4k-btn { justify-content:center; }
}
.k4k-mobile-drawer { position:fixed; inset:0; z-index:150; background:var(--glass); backdrop-filter:blur(20px); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:20px; animation:fadeUp 0.2s ease; }
.k4k-mobile-drawer button { font-size:20px; }
`;

// --- HELPERS ---
async function tmdbFetch(path, params = {}) {
  const url = new URL(`${TMDB}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  try {
    const r = await fetch(url, {
      headers: { "Authorization": `Bearer ${TMDB_TOKEN}`, "Content-Type": "application/json" }
    });
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
        <div className="k4k-adblock-icon"><Icons.Shield /></div>
        <div className="k4k-adblock-title">We Recommend an Ad Blocker</div>
        <div className="k4k-adblock-desc">
          <strong style={{ color: "var(--accent)" }}>Kirito4K</strong> itself is completely ad-free.
          However, the video servers we aggregate from may inject popups or ads within their players.
          An ad blocker will give you a clean viewing experience.
        </div>
        <div className="k4k-adblock-links">
          <a className="k4k-adblock-link" href="https://ublockorigin.com" target="_blank" rel="noopener noreferrer">
            <div>uBlock Origin <span>— Chrome / Firefox / Edge</span></div>
            <Icons.External />
          </a>
          <a className="k4k-adblock-link" href="https://adguard.com/en/adguard-browser-extension/overview.html" target="_blank" rel="noopener noreferrer">
            <div>AdGuard <span>— All browsers + mobile</span></div>
            <Icons.External />
          </a>
          <a className="k4k-adblock-link" href="https://brave.com" target="_blank" rel="noopener noreferrer">
            <div>Brave Browser <span>— Built-in ad blocker</span></div>
            <Icons.External />
          </a>
        </div>
        <button className="k4k-adblock-skip" onClick={onDismiss}>
          No thanks, I'm fine with popups
        </button>
      </div>
    </div>
  );
}

// --- ROW COMPONENT ---
function Row({ title, items, type, onSelect }) {
  const ref = useRef();
  const scroll = (dir) => { if (ref.current) ref.current.scrollBy({ left: dir * 600, behavior: "smooth" }); };
  if (!items?.length) return null;
  return (
    <div className="k4k-section">
      <div className="k4k-section-header"><div className="k4k-section-title">{title}</div></div>
      <div className="k4k-row-wrap">
        <button className="k4k-row-btn left" onClick={() => scroll(-1)}><Icons.ChevL /></button>
        <div className="k4k-row" ref={ref}>
          {items.map((item) => (
            <div key={item.id} className="k4k-card" onClick={() => onSelect(item, type)}>
              {item.poster_path ? <img className="k4k-card-img" src={posterUrl(item.poster_path, "w342")} alt="" loading="lazy" /> : <div className="k4k-card-img k4k-skeleton" />}
              <div className="k4k-card-info">
                <div className="k4k-card-name">{item.title || item.name}</div>
                <div className="k4k-card-sub"><Icons.Star /> {(item.vote_average || 0).toFixed(1)}<span style={{ marginLeft: 6 }}>{(item.release_date || item.first_air_date || "").slice(0, 4)}</span></div>
              </div>
              {item.vote_average >= 8 && <div className="k4k-card-badge">TOP</div>}
            </div>
          ))}
        </div>
        <button className="k4k-row-btn right" onClick={() => scroll(1)}><Icons.ChevR /></button>
      </div>
    </div>
  );
}

// --- PLAYER WITH MULTI-SERVER ---
function Player({ playing, onClose }) {
  const [serverId, setServerId] = useState(getStoredServer);
  const [showDropdown, setShowDropdown] = useState(false);
  const shieldRef = useRef(null);

  const server = SERVERS.find(s => s.id === serverId) || SERVERS[0];

  // Popup mitigation
  useEffect(() => {
    if (!playing) return;
    const origOpen = window.open;
    window.open = () => null;
    const onBlur = () => { setTimeout(() => { try { window.focus(); } catch(e){} }, 50); };
    window.addEventListener("blur", onBlur);
    const blockLinks = (e) => {
      const a = e.target.closest?.("a[target='_blank']");
      if (a) { e.preventDefault(); e.stopPropagation(); }
    };
    document.addEventListener("click", blockLinks, true);
    const blockUnload = (e) => { e.stopImmediatePropagation(); };
    window.addEventListener("beforeunload", blockUnload, true);
    return () => {
      window.open = origOpen;
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("click", blockLinks, true);
      window.removeEventListener("beforeunload", blockUnload, true);
    };
  }, [playing]);

  // Click shield pass-through
  const handleShieldClick = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    if (shieldRef.current) {
      shieldRef.current.style.pointerEvents = "none";
      setTimeout(() => {
        if (shieldRef.current) shieldRef.current.style.pointerEvents = "auto";
      }, 300);
    }
  }, []);

  const switchServer = (id) => {
    setServerId(id);
    storeServer(id);
    setShowDropdown(false);
  };

  if (!playing) return null;

  let embedSrc;
  if (playing.type === "movie") embedSrc = server.movieUrl(playing.tmdbId);
  else if (playing.episode) embedSrc = server.episodeUrl(playing.tmdbId, playing.season, playing.episode);
  else embedSrc = server.tvUrl(playing.tmdbId);

  return (
    <div className="k4k-player-modal" onClick={onClose}>
      <div className="k4k-player-box" onClick={e => e.stopPropagation()}>
        <button className="k4k-player-close" onClick={onClose}><Icons.Close /></button>

        {/* Server selector */}
        <div className="k4k-server-bar" onClick={e => e.stopPropagation()}>
          <button className="k4k-server-btn" onClick={() => setShowDropdown(!showDropdown)}>
            <Icons.Server /> {server.name} ▾
          </button>
          {showDropdown && (
            <div className="k4k-server-dropdown">
              {SERVERS.map(s => (
                <div
                  key={s.id}
                  className={`k4k-server-item ${s.id === serverId ? "active" : ""}`}
                  onClick={() => switchServer(s.id)}
                >
                  {s.name}
                  {s.id === serverId && <div className="k4k-server-dot" />}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <iframe
            key={serverId}
            className="k4k-player-iframe"
            src={embedSrc}
            allowFullScreen
            allow="autoplay; fullscreen; encrypted-media"
            referrerPolicy="origin"
          />
          <div
            ref={shieldRef}
            onClick={handleShieldClick}
            style={{ position: "absolute", inset: 0, zIndex: 5, cursor: "pointer", background: "transparent" }}
          />
        </div>
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
      if (type === "tv" && d?.seasons?.length) {
        const s = d.seasons.find(s => s.season_number === 1) || d.seasons[0];
        setSeason(s.season_number);
      }
    })();
  }, [item, type]);

  useEffect(() => {
    if (type === "tv" && detail) {
      (async () => { const s = await tmdbFetch(`/tv/${item.id}/season/${season}`); setEpisodes(s?.episodes || []); })();
    }
  }, [season, detail, item, type]);

  const cast = credits?.cast?.slice(0, 12) || [];
  const title = detail?.title || detail?.name || item.title || item.name;

  return (
    <div className="k4k-detail">
      <div className="k4k-detail-hero">
        <div className="k4k-detail-bg" style={{ backgroundImage: `url(${backdropUrl(item.backdrop_path || item.poster_path)})` }} />
        <div className="k4k-detail-grad" />
        <button className="k4k-detail-back" onClick={onClose}><Icons.Back /></button>
      </div>
      <div className="k4k-detail-body">
        <div className="k4k-detail-title">{title}</div>
        <div className="k4k-detail-meta">
          <span className="k4k-hero-rating"><Icons.Star /> {(detail?.vote_average || 0).toFixed(1)}</span>
          <span>{(detail?.release_date || detail?.first_air_date || "").slice(0, 4)}</span>
          {detail?.runtime && <span>{detail.runtime} min</span>}
          {detail?.number_of_seasons && <span>{detail.number_of_seasons} Season{detail.number_of_seasons > 1 ? "s" : ""}</span>}
          <span style={{ textTransform: "uppercase", fontSize: 11, background: "var(--surface2)", padding: "2px 8px", borderRadius: 4 }}>{type === "movie" ? "Movie" : "Series"}</span>
        </div>
        <div className="k4k-detail-genres">{(detail?.genres || []).map(g => <span key={g.id} className="k4k-detail-genre">{g.name}</span>)}</div>
        <div className="k4k-detail-overview">{detail?.overview}</div>
        <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
          <button className="k4k-btn k4k-btn-primary" onClick={() => setPlaying({ tmdbId: item.id, type, title, season: type === "tv" ? season : undefined, episode: type === "tv" && episodes[0] ? episodes[0].episode_number : undefined })}>
            <Icons.Play /> {type === "movie" ? "Watch Now" : "Play S1:E1"}
          </button>
        </div>
        {cast.length > 0 && (<>
          <div className="k4k-detail-cast-title">Cast</div>
          <div className="k4k-detail-cast">
            {cast.map(c => (
              <div key={c.id} className="k4k-cast-card">
                {c.profile_path ? <img className="k4k-cast-img" src={posterUrl(c.profile_path, "w185")} alt="" /> : <div className="k4k-cast-img k4k-skeleton" />}
                <div className="k4k-cast-name">{c.name}</div>
                <div className="k4k-cast-char">{c.character}</div>
              </div>
            ))}
          </div>
        </>)}
        {type === "tv" && detail?.seasons?.length > 0 && (
          <div className="k4k-seasons">
            <div className="k4k-detail-cast-title">Episodes</div>
            <div className="k4k-season-tabs">
              {detail.seasons.filter(s => s.season_number > 0).map(s => (
                <button key={s.id} className={`k4k-season-tab ${season === s.season_number ? "active" : ""}`} onClick={() => setSeason(s.season_number)}>Season {s.season_number}</button>
              ))}
            </div>
            <div className="k4k-episodes">
              {episodes.map(ep => (
                <div key={ep.id} className="k4k-episode" onClick={() => setPlaying({ tmdbId: item.id, type: "tv", title: `${detail.name} S${season}:E${ep.episode_number}`, season, episode: ep.episode_number })}>
                  {ep.still_path ? <img className="k4k-ep-still" src={posterUrl(ep.still_path, "w300")} alt="" loading="lazy" /> : <div className="k4k-ep-still k4k-skeleton" />}
                  <div className="k4k-ep-info">
                    <div className="k4k-ep-num">EPISODE {ep.episode_number}</div>
                    <div className="k4k-ep-name">{ep.name}</div>
                    <div className="k4k-ep-overview">{ep.overview}</div>
                  </div>
                  <div className="k4k-ep-play"><Icons.Play /></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Player playing={playing} onClose={() => setPlaying(null)} />
    </div>
  );
}

// --- MAIN APP ---
export default function Kirito4k() {
  const [scrolled, setScrolled] = useState(false);
  const [tab, setTab] = useState("home");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hero, setHero] = useState(null);
  const [heroIdx, setHeroIdx] = useState(0);
  const [rows, setRows] = useState({});
  const [detail, setDetail] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showAdblockAlert, setShowAdblockAlert] = useState(false);

  // Show adblocker recommendation on first visit
  useEffect(() => {
    try {
      if (!localStorage.getItem("k4k_adblock_dismissed")) {
        setShowAdblockAlert(true);
      }
    } catch {}
  }, []);

  const dismissAdblock = () => {
    setShowAdblockAlert(false);
    try { localStorage.setItem("k4k_adblock_dismissed", "1"); } catch {}
  };

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    (async () => {
      const [trending, topMovies, topTv, nowPlaying, popular, airingTv, upcomingMovies] = await Promise.all([
        tmdbFetch("/trending/all/week"), tmdbFetch("/movie/top_rated"), tmdbFetch("/tv/top_rated"),
        tmdbFetch("/movie/now_playing"), tmdbFetch("/movie/popular"), tmdbFetch("/tv/on_the_air"), tmdbFetch("/movie/upcoming"),
      ]);
      setRows({ trending: trending?.results || [], topMovies: topMovies?.results || [], topTv: topTv?.results || [], nowPlaying: nowPlaying?.results || [], popular: popular?.results || [], airingTv: airingTv?.results || [], upcoming: upcomingMovies?.results || [] });
      if (trending?.results?.length) { setHero(trending.results.slice(0, 5)); setHeroIdx(0); }
    })();
  }, []);

  useEffect(() => {
    if (!hero?.length) return;
    const t = setInterval(() => setHeroIdx(i => (i + 1) % hero.length), 8000);
    return () => clearInterval(t);
  }, [hero]);

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const timeout = setTimeout(async () => {
      setSearching(true);
      const r = await tmdbFetch("/search/multi", { query: search });
      setSearchResults((r?.results || []).filter(x => x.media_type !== "person"));
      setSearching(false);
    }, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleSelect = useCallback((item, type) => {
    setDetail({ item, type: type || item.media_type || (item.first_air_date ? "tv" : "movie") });
  }, []);

  const currentHero = hero?.[heroIdx];
  const showSearch = search.trim().length > 0;
  const filteredRows = tab === "movies"
    ? { "Now Playing": rows.nowPlaying, "Popular Movies": rows.popular, "Top Rated Movies": rows.topMovies, "Upcoming": rows.upcoming }
    : tab === "tv"
    ? { "Airing Now": rows.airingTv, "Top Rated TV": rows.topTv }
    : { "Trending This Week": rows.trending, "Now Playing": rows.nowPlaying, "Top Rated Movies": rows.topMovies, "Popular TV Shows": rows.airingTv, "Top Rated TV": rows.topTv, "Upcoming": rows.upcoming };

  return (
    <>
      <style>{css}</style>
      <div className="k4k-app">
        {showAdblockAlert && <AdblockerAlert onDismiss={dismissAdblock} />}
        <nav className={`k4k-nav ${scrolled ? "scrolled" : ""}`}>
          <div className="k4k-logo" onClick={() => { setTab("home"); setSearch(""); setDetail(null); }}>KIRITO<span>4K</span></div>
          <div className="k4k-nav-links">
            {[["home", "Home", Icons.Home], ["movies", "Movies", Icons.Film], ["tv", "TV Shows", Icons.Tv]].map(([key, label, Icon]) => (
              <button key={key} className={`k4k-nav-link ${tab === key ? "active" : ""}`} onClick={() => { setTab(key); setSearch(""); setDetail(null); }}><Icon /> {label}</button>
            ))}
          </div>
          <div className="k4k-search-wrap">
            <span className="k4k-search-icon"><Icons.Search /></span>
            <input className="k4k-search" placeholder="Search movies & TV..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="k4k-mobile-menu" onClick={() => setMobileMenu(true)}><Icons.Menu /></button>
        </nav>
        {mobileMenu && (
          <div className="k4k-mobile-drawer" onClick={() => setMobileMenu(false)}>
            {[["home", "Home"], ["movies", "Movies"], ["tv", "TV Shows"]].map(([key, label]) => (
              <button key={key} className="k4k-nav-link" style={{ fontSize: 22, color: tab === key ? "var(--accent)" : "var(--text)" }}
                onClick={() => { setTab(key); setSearch(""); setDetail(null); setMobileMenu(false); }}>{label}</button>
            ))}
          </div>
        )}
        {detail && <DetailPage item={detail.item} type={detail.type} onClose={() => setDetail(null)} />}
        {showSearch && !detail ? (
          <div className="k4k-results">
            <div className="k4k-results-title">Results for "{search}"</div>
            {searching ? (
              <div className="k4k-results-grid">{Array.from({ length: 8 }).map((_, i) => <div key={i}><div className="k4k-card-img k4k-skeleton" style={{ width: "100%", aspectRatio: "2/3" }} /></div>)}</div>
            ) : searchResults.length ? (
              <div className="k4k-results-grid">
                {searchResults.map(item => (
                  <div key={item.id} className="k4k-card" onClick={() => handleSelect(item)}>
                    {item.poster_path ? <img className="k4k-card-img" src={posterUrl(item.poster_path, "w342")} alt="" loading="lazy" style={{ width: "100%" }} /> : <div className="k4k-card-img k4k-skeleton" style={{ width: "100%" }} />}
                    <div className="k4k-card-info">
                      <div className="k4k-card-name">{item.title || item.name}</div>
                      <div className="k4k-card-sub"><Icons.Star /> {(item.vote_average || 0).toFixed(1)}<span style={{ marginLeft: 6 }}>{(item.release_date || item.first_air_date || "").slice(0, 4)}</span><span style={{ marginLeft: 6, textTransform: "uppercase", fontSize: 10 }}>{item.media_type}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="k4k-no-results">No results found</div>}
          </div>
        ) : !detail ? (
          <>
            {currentHero && (
              <div className="k4k-hero">
                <div className="k4k-hero-bg" style={{ backgroundImage: `url(${backdropUrl(currentHero.backdrop_path)})` }} />
                <div className="k4k-hero-overlay" />
                <div className="k4k-hero-content">
                  <div className="k4k-hero-title">{currentHero.title || currentHero.name}</div>
                  <div className="k4k-hero-meta">
                    <span className="k4k-hero-rating"><Icons.Star /> {(currentHero.vote_average || 0).toFixed(1)}</span>
                    <span>{(currentHero.release_date || currentHero.first_air_date || "").slice(0, 4)}</span>
                    <span style={{ textTransform: "uppercase", fontSize: 11, background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: 4 }}>{currentHero.media_type === "movie" ? "Movie" : "Series"}</span>
                  </div>
                  <div className="k4k-hero-desc">{currentHero.overview}</div>
                  <div className="k4k-hero-btns">
                    <button className="k4k-btn k4k-btn-primary" onClick={() => handleSelect(currentHero)}><Icons.Play /> Watch Now</button>
                    <button className="k4k-btn k4k-btn-secondary" onClick={() => handleSelect(currentHero)}><Icons.Info /> More Info</button>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
                    {hero.map((_, i) => <div key={i} onClick={() => setHeroIdx(i)} style={{ width: i === heroIdx ? 24 : 8, height: 4, borderRadius: 2, cursor: "pointer", background: i === heroIdx ? "var(--accent)" : "rgba(255,255,255,0.2)", transition: "all 0.3s" }} />)}
                  </div>
                </div>
              </div>
            )}
            {Object.entries(filteredRows).map(([title, items]) => (
              <Row key={title} title={title} items={items} type={tab === "tv" ? "tv" : tab === "movies" ? "movie" : undefined} onSelect={handleSelect} />
            ))}
          </>
        ) : null}
        <div className="k4k-footer">
          <div className="k4k-logo" style={{ fontSize: 24, marginBottom: 8 }}>KIRITO<span>4K</span></div>
          <div>© {new Date().getFullYear()} Kirito4k. All content metadata provided by TMDB.</div>
        </div>
      </div>
    </>
  );
}
