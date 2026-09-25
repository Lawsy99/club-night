import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves the app from /club-night/ (the repository name),
  // so every built file path must start with that.
  base: '/club-night/',
})
