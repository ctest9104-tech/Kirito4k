import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    // This is safer than the 'global' alias for some edge cases
    'process.env': {},
    global: 'globalThis', 
  },
  resolve: {
    alias: {
      'bittorrent-dht': 'identity-obj-proxy', 
      path: 'path-browserify',
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      buffer: 'buffer',
      process: 'process',
    },
  },
  optimizeDeps: {
    // Forces Vite to include these in the pre-bundle
    include: ['buffer', 'process', 'webtorrent']
  }
})
