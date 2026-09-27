// "Add to Home Screen" (Sep 2026: friends and family testing). Shown in the
// browser only, never in the installed app, and it can be dismissed. On an
// iPhone the home-screen app keeps its own progress, separate from Safari,
// so it's best done before starting.
import { useState } from 'react'
import './InstallHint.css'

const HIDDEN_KEY = 'club-night-install-hint'

function platform(): 'ios' | 'android' | null {
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return null
}

function installed(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (navigator as { standalone?: boolean }).standalone === true
  )
}

function hidden(): boolean {
  try {
    return localStorage.getItem(HIDDEN_KEY) === 'hidden'
  } catch {
    return false
  }
}

export function InstallHint({ beforeStarting = false }: { beforeStarting?: boolean }) {
  const [dismissed, setDismissed] = useState(hidden)
  const where = platform()
  if (dismissed || installed() || !where) return null
  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(HIDDEN_KEY, 'hidden')
    } catch {
      // Storage blocked: it just comes back next time.
    }
  }
  return (
    <aside className="install-hint">
      <p>
        <strong>Put Club Night on your home screen.</strong>{' '}
        {where === 'ios'
          ? 'In Safari, tap the Share button, then “Add to Home Screen”. It opens full screen, like an app.'
          : 'Tap the ⋮ menu, then “Add to Home screen” or “Install app”.'}
        {beforeStarting && where === 'ios' && ' Do it before you start: the home-screen app keeps its own progress.'}
      </p>
      <button type="button" onClick={dismiss}>
        Not now
      </button>
    </aside>
  )
}
