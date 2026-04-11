import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    global: 'window',
  },
  resolve: {
    alias: {
      // This line is the fix for the DHT "Client" error:
      'bittorrent-dht': 'identity-obj-proxy', 
      path: 'path-browserify',
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      buffer: 'buffer',
      process: 'process',
    },
  },
})
