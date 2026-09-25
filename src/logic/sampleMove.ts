// Picking a move from human-move likelihoods (Maia's output). The bot plays
// each move about as often as a real player at that rating would.

/** Moves rarer than this are ignored: "a move a player of that rating would rarely consider". */
export const MIN_LIKELIHOOD = 0.01

export function sampleMove(
  policy: readonly { move: string; p: number }[],
  random: () => number = Math.random,
): string | null {
  const candidates = policy.filter((m) => m.p >= MIN_LIKELIHOOD)
  const pool = candidates.length ? candidates : policy.slice(0, 1)
  const total = pool.reduce((sum, m) => sum + m.p, 0)
  let roll = random() * total
  for (const m of pool) {
    roll -= m.p
    if (roll <= 0) return m.move
  }
  return pool.at(-1)?.move ?? null
}
