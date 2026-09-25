// Arrow colours for help on the board, and turning an engine line into a
// fading sequence of arrows: your moves blue, the opponent's orange.
import type { Colour } from '../logic/game'
import type { BoardArrow } from './Board'

const YOURS = [40, 120, 200]
const THEIRS = [225, 130, 40]
/** Each later move is fainter, so the order reads at a glance. */
const FADE = [0.9, 0.7, 0.5, 0.35]

const rgba = ([r, g, b]: number[], alpha: number) => `rgba(${r}, ${g}, ${b}, ${alpha})`

export const HINT_ARROW_COLOUR = rgba(YOURS, 0.9)

/**
 * The first few moves of `pv` (UCI) as arrows. `sideToMove` is who plays the
 * first move of the line.
 */
export function lineArrows(pv: readonly string[], sideToMove: Colour, playerColour: Colour): BoardArrow[] {
  return pv.slice(0, FADE.length).map((uci, i) => {
    const mover = (i % 2 === 0) === (sideToMove === 'w') ? 'w' : 'b'
    return {
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      colour: rgba(mover === playerColour ? YOURS : THEIRS, FADE[i]),
    }
  })
}
