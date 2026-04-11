import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    // Direct string replacement for better mobile compatibility
    'global': 'window',
    'process.env': {}
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
  }
})
