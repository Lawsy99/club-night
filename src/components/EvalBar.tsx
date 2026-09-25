// The evaluation bar beside the board: how much of it is white shows White's
// winning chances. The player's colour is always at the bottom.
import type { Analysis } from '../engine/analysis'
import { formatScore, scoreFor, winChance } from '../logic/evaluation'
import type { Colour } from '../logic/game'
import './EvalBar.css'

type Props = {
  analysis: Analysis | null
  playerColour: Colour
}

export function EvalBar({ analysis, playerColour }: Props) {
  const whiteScore = analysis ? scoreFor('w', analysis.sideToMove, analysis.score) : null
  const whiteShare = whiteScore ? winChance(whiteScore) : 0.5
  const playerScore = analysis ? scoreFor(playerColour, analysis.sideToMove, analysis.score) : null
  // The bar grows from the player's end.
  const playerShare = playerColour === 'w' ? whiteShare : 1 - whiteShare

  return (
    <div
      className={`eval-bar ${playerColour === 'w' ? 'player-white' : 'player-black'}`}
      role="img"
      aria-label={playerScore ? `Evaluation ${formatScore(playerScore)} for you` : 'Evaluation loading'}
    >
      <div className="eval-fill" style={{ height: `${playerShare * 100}%` }} />
      <span className={`eval-label ${playerShare >= 0.5 ? 'at-bottom' : 'at-top'}`}>
        {/* Shown without a sign, at the end of whoever is ahead, as Lichess does */}
        {whiteScore ? formatScore(whiteScore).replace(/^[+−]/, '') : ''}
      </span>
    </div>
  )
}
