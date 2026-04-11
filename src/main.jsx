import { Buffer } from 'buffer';
import process from 'process';

// Force global assignment BEFORE any other imports
window.Buffer = Buffer;
window.process = process;
window.global = window;

// Use dynamic import to ensure the polyfills above are set 
// before App.jsx logic starts running
import('./App.jsx').then(({ default: App }) => {
  const React = import('react').then(({ default: React }) => {
    import('react-dom/client').then(({ default: ReactDOM }) => {
      ReactDOM.createRoot(document.getElementById('root')).render(
        <App />
      );
    });
  });
});
