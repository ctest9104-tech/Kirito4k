import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', 
  define: {
    global: 'window', // Fixes "global is not defined" error
  },
  resolve: {
    alias: {
      path: 'path-browserify',
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      buffer: 'buffer',
      process: 'process',
    },
  },
})
