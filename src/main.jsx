import { Buffer } from 'buffer';
import process from 'process';

// Immediate global assignment
window.Buffer = Buffer;
window.process = process;
window.global = window;

import React from 'react';
import ReactDOM from 'react-dom/client';
// IMPORTANT: This MUST match the exact filename on GitHub. 
// If your file is 'App.jsx', use 'App.jsx' here.
import App from './App.jsx'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
