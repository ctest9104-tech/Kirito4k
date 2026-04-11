import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // WebTorrent and some other P2P libs expect 'global' to exist
    global: 'window',
  },
  resolve: {
    alias: {
      // This tells Vite to use the 'events' package you added to package.json
      events: 'events',
    },
  },
  build: {
    outDir: 'dist',
    // This helps handle large libraries like WebTorrent
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})
