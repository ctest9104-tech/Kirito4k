import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', 
  define: {
    // WebTorrent needs 'global' defined to work in the browser
    global: 'window',
  },
  resolve: {
    alias: {
      // Directs Node modules to browser-friendly versions
      path: 'path-browserify',
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      buffer: 'buffer',
    },
  },
  optimizeDeps: {
    include: ['buffer', 'process'],
  },
})
