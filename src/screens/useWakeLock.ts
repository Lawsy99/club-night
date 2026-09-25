// Keeps the phone's screen on while a game is being played, so it doesn't
// dim and lock while the player is thinking. Supported on iPhone from
// iOS 16.4; elsewhere it quietly does nothing.
import { useEffect } from 'react'

export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let released = false

    const request = () => {
      navigator.wakeLock
        .request('screen')
        .then((l) => {
          if (released) l.release()
          else lock = l
        })
        .catch(() => undefined) // e.g. low battery mode: not important
    }
    // The lock drops when the app goes into the background; take it again on return.
    const onVisible = () => document.visibilityState === 'visible' && request()

    request()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      released = true
      document.removeEventListener('visibilitychange', onVisible)
      lock?.release().catch(() => undefined)
    }
  }, [active])
}
