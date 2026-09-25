import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves the app from /club-night/ (the repository name),
  // so every built file path must start with that.
  base: '/club-night/',
  // Workers as ES modules, so the Maia worker can load its runtime.
  worker: { format: 'es' },
  define: {
    // Shown on screen so it's obvious whether the phone has the latest version.
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
})
