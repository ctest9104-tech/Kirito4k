import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // CRITICAL: Fixes the blank screen issue on Vercel
  define: {
    global: 'window', // Required for WebTorrent to work in the browser
  },
})
