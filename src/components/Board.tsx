// The interactive chessboard. Knows how to show a position and collect a
// legal move from the player (by dragging, or tapping piece then square).
// It never changes the game itself: it hands the chosen move to `onMove`.
import { Chess, type Square } from 'chess.js'
import { useMemo, useState, type CSSProperties } from 'react'
import { Chessboard } from 'react-chessboard'
import {
  checkedKingSquare,
  isPromotion,
  legalTargets,
  type Colour,
  type PromotionPiece,
} from '../logic/game'
import { PromotionPicker } from './PromotionPicker'
import './Board.css'

type Props = {
  fen: string
  orientation: 'white' | 'black'
  /** Which colour the player may move right now; null locks the board. */
  movableColour: Colour | null
  lastMove: { from: string; to: string } | null
  onMove: (uci: string) => void
  /** Hint step 1: the square of the piece to move. */
  hintSquare?: string | null
  /** Arrows to draw (hints, the best line). */
  arrows?: BoardArrow[]
}

export type BoardArrow = { from: string; to: string; colour: string }

const LIGHT = '#ece4cf'
const DARK = '#86a07a'
const HINT_OUTLINE = 'rgba(40, 120, 200, 0.85)'

export function Board({
  fen,
  orientation,
  movableColour,
  lastMove,
  onMove,
  hintSquare = null,
  arrows = [],
}: Props) {
  // Legal moves depend only on the current position, so a FEN is enough here.
  const chess = useMemo(() => new Chess(fen), [fen])
  const [selected, setSelected] = useState<Square | null>(null)
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null)

  // Forget any half-made move when the position changes (e.g. the opponent moved).
  const [seenFen, setSeenFen] = useState(fen)
  if (seenFen !== fen) {
    setSeenFen(fen)
    setSelected(null)
    setPendingPromotion(null)
  }

  const targets = selected ? legalTargets(chess, selected) : []
  const canMove = movableColour !== null && movableColour === chess.turn()

  function ownsPiece(square: Square) {
    const piece = chess.get(square)
    return canMove && piece?.color === movableColour
  }

  /** Returns true if the move was accepted (or is waiting on a promotion choice). */
  function tryMove(from: Square, to: Square): boolean {
    if (!legalTargets(chess, from).includes(to)) return false
    setSelected(null)
    if (isPromotion(chess, from, to)) {
      setPendingPromotion({ from, to })
      return false // snap the pawn back until a piece is chosen
    }
    onMove(from + to)
    return true
  }

  function handleSquareClick(square: Square) {
    if (pendingPromotion || !canMove) return
    if (selected && targets.includes(square)) {
      tryMove(selected, square)
    } else if (ownsPiece(square) && square !== selected) {
      setSelected(square)
    } else {
      setSelected(null)
    }
  }

  function handlePromotion(piece: PromotionPiece | null) {
    if (pendingPromotion && piece) onMove(pendingPromotion.from + pendingPromotion.to + piece)
    setPendingPromotion(null)
  }

  const squareStyles = buildSquareStyles(chess, selected, targets, lastMove, hintSquare)
  const boardArrows = arrows.map((a) => ({ startSquare: a.from, endSquare: a.to, color: a.colour }))

  return (
    <div className="board-wrap">
      <Chessboard
        options={{
          position: fen,
          boardOrientation: orientation,
          lightSquareStyle: { backgroundColor: LIGHT },
          darkSquareStyle: { backgroundColor: DARK },
          squareStyles,
          arrows: boardArrows,
          allowDrawingArrows: false,
          allowDragOffBoard: false,
          allowAutoScroll: false,
          // A small movement threshold so a tap counts as a tap, not a drag.
          dragActivationDistance: 6,
          animationDurationInMs: 200,
          canDragPiece: ({ square }) => square !== null && ownsPiece(square as Square),
          onPieceDrag: ({ square }) => setSelected(square as Square),
          onPieceDrop: ({ sourceSquare, targetSquare }) =>
            targetSquare !== null && tryMove(sourceSquare as Square, targetSquare as Square),
          onSquareClick: ({ square }) => handleSquareClick(square as Square),
        }}
      />
      {pendingPromotion && (
        <PromotionPicker colour={chess.turn()} onChoose={handlePromotion} />
      )}
    </div>
  )
}

function buildSquareStyles(
  chess: Chess,
  selected: Square | null,
  targets: Square[],
  lastMove: { from: string; to: string } | null,
  hintSquare: string | null,
): Record<string, CSSProperties> {
  const styles: Record<string, CSSProperties> = {}
  const add = (sq: string, style: CSSProperties) => {
    styles[sq] = { ...styles[sq], ...style }
  }

  if (lastMove) {
    add(lastMove.from, { backgroundColor: 'rgba(222, 190, 70, 0.45)' })
    add(lastMove.to, { backgroundColor: 'rgba(222, 190, 70, 0.55)' })
  }
  // Tints use backgroundColor and markers use backgroundImage, so they layer
  // (never the `background` shorthand, which React warns about mixing).
  const checked = checkedKingSquare(chess)
  if (checked) {
    add(checked, {
      backgroundImage: 'radial-gradient(circle, rgba(210, 40, 30, 0.85) 25%, rgba(210, 40, 30, 0) 75%)',
    })
  }
  if (hintSquare) add(hintSquare, { boxShadow: `inset 0 0 0 4px ${HINT_OUTLINE}` })
  if (selected) add(selected, { backgroundColor: 'rgba(40, 90, 60, 0.55)' })
  for (const sq of targets) {
    const capture = chess.get(sq) !== undefined
    add(sq, {
      backgroundImage: capture
        ? 'radial-gradient(circle, transparent 58%, rgba(20, 50, 30, 0.45) 60%)'
        : 'radial-gradient(circle, rgba(20, 50, 30, 0.45) 22%, transparent 24%)',
    })
  }
  return styles
}
