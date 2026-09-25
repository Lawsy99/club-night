// The safety valve (design document, "The safety valve"): if the act
// baseline is clearly wrong, it quietly moves by 100, only between games.

export type RealGameResult = {
  won: boolean
  /** Strength suggested by the moves (null if the game wasn't analysed). */
  accuracyStrength: number | null
}

/** How often it may trigger: at most once every 5 real games. */
export const VALVE_WINDOW = 5
const MARGIN = 150
const STEP = 100

/**
 * The baseline change to make now (+100, −100 or 0). `recent` is the real
 * games since the valve last moved (or since the act began), newest last.
 * Never used while a gauntlet is running (bosses are fixed by then).
 */
export function valveAdjustment(recent: readonly RealGameResult[], baseline: number): number {
  if (recent.length < VALVE_WINDOW) return 0
  const last = recent.slice(-VALVE_WINDOW)
  const strengths = last.map((g) => g.accuracyStrength).filter((s): s is number => s !== null)
  // Needs the moves' evidence, not just results: at least 3 analysed games.
  if (strengths.length < 3) return 0
  const suggested = strengths.reduce((a, b) => a + b, 0) / strengths.length
  const wins = last.filter((g) => g.won).length
  if (wins >= 4 && suggested >= baseline + MARGIN) return STEP
  if (VALVE_WINDOW - wins >= 4 && suggested <= baseline - MARGIN) return -STEP
  return 0
}
