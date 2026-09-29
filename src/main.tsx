import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// The fonts (Caslon for headings and figures, a typewriter for notices), bundled so they work offline.
import '@fontsource/libre-caslon-text/400.css'
import '@fontsource/libre-caslon-text/400-italic.css'
import '@fontsource/libre-caslon-text/700.css'
import '@fontsource/courier-prime/400.css'
import './index.css'
import App from './App.tsx'
import { CrashScreen } from './components/CrashScreen'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CrashScreen>
      <App />
    </CrashScreen>
  </StrictMode>,
)
