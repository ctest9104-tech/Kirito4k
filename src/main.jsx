import { Buffer } from 'buffer';
import process from 'process';

window.Buffer = Buffer;
window.process = process;
window.global = window;

import React from 'react';
import ReactDOM from 'react-dom/client';
// Using the exact name you confirmed is on GitHub
import App from './App.jsx'; 

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
