// Arrow colours for help on the board, and turning an engine line into a
// sequence of arrows: your moves blue, the opponent's orange. The move to play
// now is solid and dark; later moves are clearly paler, and every move gets a
// numbered badge so the order is never in doubt.
import type { Colour } from '../logic/game'
import type { BoardArrow, SquareBadge } from './Board'

const YOURS = [25, 95, 185]
const THEIRS = [215, 115, 25]
/** Move 1 stands out; the rest step down sharply. */
const STRENGTH = [1, 0.55, 0.4, 0.28]

const rgba = ([r, g, b]: number[], alpha: number) => `rgba(${r}, ${g}, ${b}, ${alpha})`

export const HINT_ARROW_COLOUR = rgba(YOURS, 0.9)

/**
 * The first few moves of `pv` (UCI) as arrows with numbered badges.
 * `sideToMove` is who plays the first move of the line.
 */
export function lineArrows(
  pv: readonly string[],
  sideToMove: Colour,
  playerColour: Colour,
): { arrows: BoardArrow[]; badges: SquareBadge[] } {
  const moves = pv.slice(0, STRENGTH.length).map((uci, i) => {
    const mover = (i % 2 === 0) === (sideToMove === 'w') ? 'w' : 'b'
    return { uci, i, base: mover === playerColour ? YOURS : THEIRS }
  })
  return {
    arrows: moves.map(({ uci, i, base }) => ({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      colour: rgba(base, STRENGTH[i]),
    })),
    badges: moves.map(({ uci, i, base }) => ({
      square: uci.slice(2, 4),
      label: String(i + 1),
      colour: rgba(base, 1),
      // Each step has its own corner, so badges never cover each other
      // when several moves land on the same square.
      corner: i,
    })),
  }
}
