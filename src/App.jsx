import { Buffer } from 'buffer';
window.Buffer = Buffer;
import process from 'process';
window.process = process;
import React, { useState, useEffect, useRef } from "react";
import WebTorrent from "webtorrent";

const TMDB_KEY = "315caf36915c58b001e9603899be9670"; 
const client = new WebTorrent();

function TorrentPlayer({ magnet, onClose }) {
  const videoRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    client.add(magnet, (torrent) => {
      // Find the largest file (usually the movie)
      const file = torrent.files.find(f => f.name.endsWith('.mp4') || f.name.endsWith('.mkv'));
      if (file) {
        file.renderTo(videoRef.current);
      }
      
      torrent.on('download', () => {
        setProgress(Math.round(torrent.progress * 100));
      });
    });

    return () => {
      // Clean up when closing
      const torrent = client.get(magnet);
      if (torrent) torrent.destroy();
    };
  }, [magnet]);

  return (
    <div style={{position:'fixed', inset:0, background:'#000', zIndex:1000, display:'flex', flexDirection:'column'}}>
      <div style={{padding:'10px 20px', background:'#111', color:'#fff', display:'flex', justifyContent:'space-between'}}>
        <span>⚡ STREAMING TORRENT: {progress}% BUFFED</span>
        <button onClick={onClose} style={{background:'#e50914', border:'none', color:'#fff', padding:'5px 15px', borderRadius:'4px', cursor:'pointer'}}>✕ CLOSE</button>
      </div>
      <video ref={videoRef} controls autoPlay style={{flex:1, width:'100%'}} />
    </div>
  );
}

export default function App() {
  const [movies, setMovies] = useState([]);
  const [play, setPlay] = useState(null);

  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/trending/all/week?api_key=${TMDB_KEY}`)
      .then(res => res.json()).then(data => setMovies(data.results || []));
  }, []);

  const startTorrent = (item) => {
    // For a real torrent app, you'd fetch a magnet link here.
    // This is a sample magnet (Big Buck Bunny) to test your player.
    const sampleMagnet = "magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Fzer0day.ch%3A1337&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337";
    setPlay(sampleMagnet);
  };

  return (
    <div style={{background:'#050505', color:'#fff', minHeight:'100vh', padding:'40px'}}>
      <h1 style={{color:'#e50914'}}>KIRITO4K <span style={{fontSize:'12px', color:'#555'}}>TORRENT BETA</span></h1>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:'20px'}}>
        {movies.map(m => (
          <div key={m.id} onClick={() => startTorrent(m)} style={{cursor:'pointer'}}>
            <img src={"https://image.tmdb.org/t/p/w500" + m.poster_path} style={{width:'100%', borderRadius:'8px'}} alt="" />
          </div>
        ))}
      </div>
      {play && <TorrentPlayer magnet={play} onClose={() => setPlay(null)} />}
    </div>
  );
}
