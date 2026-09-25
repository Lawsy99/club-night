// React hook: analysis of the current position, kept up to date as it changes.
import { useEffect, useState } from 'react'
import { analysePosition, type Analysis } from './analysis'

/**
 * Returns the analysis for `fen` once ready. While a new position is being
 * analysed, `latest` keeps the previous result so the evaluation bar doesn't
 * flicker; `current` is only the result for this exact position.
 */
export function useAnalysis(fen: string, enabled: boolean) {
  const [result, setResult] = useState<Analysis | null>(null)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    analysePosition(fen)
      .then((a) => {
        if (!cancelled && a) setResult(a)
      })
      .catch(() => {
        // Help features just stay hidden if the engine fails.
      })
    return () => {
      cancelled = true
    }
  }, [fen, enabled])

  return {
    latest: enabled ? result : null,
    current: enabled && result?.fen === fen ? result : null,
  }
}
