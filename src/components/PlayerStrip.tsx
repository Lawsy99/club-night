// The name bar above (opponent) and below (player) the board: name, rating,
// the pieces they've captured and their material lead.
import type { PieceSymbol } from 'chess.js'
import { materialFor } from '../logic/material'
import type { Colour } from '../logic/game'
import './PlayerStrip.css'

// Chess piece symbols, drawn in the text colour (outline set = captured pieces).
const GLYPHS: Record<PieceSymbol, string> = { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' }

type Props = {
  name: string
  rating?: number | string
  fen: string
  side: Colour
  thinking?: boolean
}

export function PlayerStrip({ name, rating, fen, side, thinking = false }: Props) {
  const { captured, lead } = materialFor(fen, side)
  return (
    <div className="player-strip">
      <span className={`player-dot ${side === 'w' ? 'white' : 'black'}`} aria-hidden="true" />
      <span className="player-name">{name}</span>
      {rating !== undefined && <span className="player-rating">{rating}</span>}
      <span className="player-captured" aria-label={`Captured: ${captured.length} pieces`}>
        {/* Variation selector 15 keeps these as text symbols, not emoji, on iPhone */}
        {captured.map((p) => GLYPHS[p] + '︎').join('')}
        {lead > 0 && <span className="player-lead">+{lead}</span>}
      </span>
      {thinking && (
        // Moving dots, so a long think never looks like the app has frozen.
        <span className="player-thinking" role="status">
          thinking
          <span className="think-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </span>
      )}
    </div>
  )
}
