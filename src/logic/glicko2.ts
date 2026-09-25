// The player's rating: Glicko-2 (Mark Glickman, 2012), the system Lichess
// uses. Besides the rating it tracks how certain it is (the "deviation"), so
// it moves quickly early on and settles once there are plenty of games.
// Each real game is treated as its own rating period.

export type PlayerRating = {
  rating: number
  /** Rating deviation: how uncertain the rating is (lower = surer). */
  deviation: number
  volatility: number
}

/** A brand-new player (Glicko-2's recommended defaults). */
export const NEW_PLAYER: PlayerRating = { rating: 1500, deviation: 350, volatility: 0.06 }

/**
 * Opponents are bots playing at a set strength, so their rating is treated
 * as well known.
 */
export const OPPONENT_DEVIATION = 50

/** Constrains how fast volatility changes (Glickman suggests 0.3–1.2). */
const TAU = 0.5
const SCALE = 173.7178
const EPSILON = 0.000001

const g = (phi: number) => 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI))
const expected = (mu: number, muJ: number, phiJ: number) => 1 / (1 + Math.exp(-g(phiJ) * (mu - muJ)))

/**
 * The player's rating after one game. `score` is 1 for a win, 0 for a loss
 * (draws are replayed in this app, but 0.5 works too).
 */
export function rateGame(
  player: PlayerRating,
  opponentRating: number,
  score: number,
  opponentDeviation = OPPONENT_DEVIATION,
): PlayerRating {
  // Step 2: convert to the Glicko-2 scale.
  const mu = (player.rating - 1500) / SCALE
  const phi = player.deviation / SCALE
  const muJ = (opponentRating - 1500) / SCALE
  const phiJ = opponentDeviation / SCALE

  // Steps 3–4: estimated variance and improvement.
  const gJ = g(phiJ)
  const e = expected(mu, muJ, phiJ)
  const v = 1 / (gJ * gJ * e * (1 - e))
  const delta = v * gJ * (score - e)

  // Step 5: new volatility (Illinois algorithm).
  const a = Math.log(player.volatility * player.volatility)
  const f = (x: number) => {
    const ex = Math.exp(x)
    return (ex * (delta * delta - phi * phi - v - ex)) / (2 * (phi * phi + v + ex) ** 2) - (x - a) / (TAU * TAU)
  }
  let A = a
  let B: number
  if (delta * delta > phi * phi + v) {
    B = Math.log(delta * delta - phi * phi - v)
  } else {
    let k = 1
    while (f(a - k * TAU) < 0) k++
    B = a - k * TAU
  }
  let fA = f(A)
  let fB = f(B)
  while (Math.abs(B - A) > EPSILON) {
    const C = A + ((A - B) * fA) / (fB - fA)
    const fC = f(C)
    if (fC * fB <= 0) {
      A = B
      fA = fB
    } else {
      fA /= 2
    }
    B = C
    fB = fC
  }
  const volatility = Math.exp(A / 2)

  // Steps 6–7: new deviation and rating.
  const phiStar = Math.sqrt(phi * phi + volatility * volatility)
  const newPhi = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v)
  const newMu = mu + newPhi * newPhi * gJ * (score - e)

  return {
    rating: SCALE * newMu + 1500,
    deviation: Math.min(350, SCALE * newPhi),
    volatility,
  }
}

/** Ratings are shown as whole numbers. */
export const shownRating = (r: PlayerRating) => Math.round(r.rating)
