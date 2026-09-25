// The mistake model for low-rated bots (below 800), which Maia doesn't cover.
// Stockfish lists its top candidate moves; this picks among them the way a
// weak human would: often not the best, sometimes something careless.
//
// What each level should feel like (design document, "Which engine plays"):
//   200–400: often leaves pieces undefended, misses the player's threats
//   600:     defends pieces, but walks into forks
//   near 800: sees one-move tactics, misses two-move ones
// The search depth (see botDepth) limits how far ahead the bot can see; the
// numbers below add the carelessness.

export type Candidate = { move: string; cp: number } // cp from the bot's point of view

export type MistakeProfile = {
  /** Chance of a careless move: any legal move, ignoring the position. */
  carelessness: number
  /** How loosely it chooses among the candidates, in centipawns (bigger = sloppier). */
  looseness: number
}

/** Interpolated between anchor ratings, so any rating gets a sensible profile. */
const ANCHORS: [rating: number, profile: MistakeProfile][] = [
  [200, { carelessness: 0.35, looseness: 250 }],
  [400, { carelessness: 0.22, looseness: 160 }],
  [600, { carelessness: 0.1, looseness: 90 }],
  [800, { carelessness: 0.04, looseness: 50 }],
]

export function mistakeProfile(rating: number): MistakeProfile {
  if (rating <= ANCHORS[0][0]) return ANCHORS[0][1]
  for (let i = 1; i < ANCHORS.length; i++) {
    const [r1, p1] = ANCHORS[i]
    const [r0, p0] = ANCHORS[i - 1]
    if (rating <= r1) {
      const t = (rating - r0) / (r1 - r0)
      return {
        carelessness: p0.carelessness + t * (p1.carelessness - p0.carelessness),
        looseness: p0.looseness + t * (p1.looseness - p0.looseness),
      }
    }
  }
  return ANCHORS[ANCHORS.length - 1][1]
}

/** How many moves ahead (plies) the bot looks: 1 at the bottom, 4 near 800. */
export function botDepth(rating: number): number {
  if (rating < 350) return 1
  if (rating < 550) return 2
  if (rating < 700) return 3
  return 4
}

/**
 * Picks a move. `candidates` are the engine's top moves; `legalMoves` all
 * legal moves (for careless picks). `random` is injectable for tests.
 */
export function pickBotMove(
  candidates: readonly Candidate[],
  legalMoves: readonly string[],
  rating: number,
  random: () => number = Math.random,
  /** Optional style nudges, one per candidate (1 = no change). */
  styleWeights?: readonly number[],
): string | null {
  if (legalMoves.length === 0) return null
  const { carelessness, looseness } = mistakeProfile(rating)
  if (random() < carelessness || candidates.length === 0) {
    return legalMoves[Math.floor(random() * legalMoves.length)]
  }
  // Softmax over the candidates: better moves are likelier, but a move only
  // `looseness` worse is still picked about a third as often.
  const best = Math.max(...candidates.map((c) => c.cp))
  const weights = candidates.map((c, i) => Math.exp((c.cp - best) / looseness) * (styleWeights?.[i] ?? 1))
  let roll = random() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i]
    if (roll <= 0) return candidates[i].move
  }
  return candidates[0].move
}
