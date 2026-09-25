// Shown over the board when a pawn reaches the last rank: pick the new piece.
import { defaultPieces } from 'react-chessboard'
import type { Colour, PromotionPiece } from '../logic/game'

type Props = {
  colour: Colour
  onChoose: (piece: PromotionPiece | null) => void
}

const CHOICES: { piece: PromotionPiece; label: string }[] = [
  { piece: 'q', label: 'Queen' },
  { piece: 'r', label: 'Rook' },
  { piece: 'b', label: 'Bishop' },
  { piece: 'n', label: 'Knight' },
]

export function PromotionPicker({ colour, onChoose }: Props) {
  return (
    <div className="promotion-backdrop" onClick={() => onChoose(null)}>
      <div className="promotion-picker" onClick={(e) => e.stopPropagation()}>
        <p>Promote to</p>
        <div className="promotion-choices">
          {CHOICES.map(({ piece, label }) => {
            const Piece = defaultPieces[colour + piece.toUpperCase()]
            return (
              <button key={piece} type="button" aria-label={label} onClick={() => onChoose(piece)}>
                <Piece />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
