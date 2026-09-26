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
import { useBoardColours } from './boardTheme'
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
  /** Small numbered circles in a corner of a square (best-line order). */
  badges?: SquareBadge[]
}

export type BoardArrow = { from: string; to: string; colour: string }
/** corner: 0 top-left, 1 top-right, 2 bottom-left, 3 bottom-right. */
export type SquareBadge = { square: string; label: string; colour: string; corner: number }

const HINT_OUTLINE = 'rgba(40, 120, 200, 0.85)'

export function Board({
  fen,
  orientation,
  movableColour,
  lastMove,
  onMove,
  hintSquare = null,
  arrows = [],
  badges = [],
}: Props) {
  // Legal moves depend only on the current position, so a FEN is enough here.
  const chess = useMemo(() => new Chess(fen), [fen])
  const colours = useBoardColours()
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

  const squareStyles = buildSquareStyles(chess, selected, targets, lastMove, hintSquare, badges)
  const boardArrows = arrows.map((a) => ({ startSquare: a.from, endSquare: a.to, color: a.colour }))

  return (
    <div className="board-wrap" style={{ background: colours.frame }}>
      <Chessboard
        options={{
          position: fen,
          boardOrientation: orientation,
          lightSquareStyle: { backgroundColor: colours.light },
          darkSquareStyle: { backgroundColor: colours.dark },
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
  badges: SquareBadge[],
): Record<string, CSSProperties> {
  const styles: Record<string, CSSProperties> = {}
  const add = (sq: string, style: CSSProperties) => {
    styles[sq] = { ...styles[sq], ...style }
  }
  // Markers are background-image layers, collected per square so several can
  // stack (e.g. a badge on a legal-move dot). Tints use backgroundColor; never
  // the `background` shorthand, which React warns about mixing.
  const layers: Record<string, { image: string; position: string; size: string }[]> = {}
  const addLayer = (sq: string, image: string, position = 'center', size = '100% 100%') => {
    ;(layers[sq] ??= []).push({ image, position, size })
  }

  if (lastMove) {
    add(lastMove.from, { backgroundColor: 'rgba(222, 190, 70, 0.45)' })
    add(lastMove.to, { backgroundColor: 'rgba(222, 190, 70, 0.55)' })
  }
  for (const badge of badges) {
    addLayer(badge.square, badgeImage(badge), BADGE_CORNERS[badge.corner % 4], '34% 34%')
  }
  const checked = checkedKingSquare(chess)
  if (checked) {
    addLayer(checked, 'radial-gradient(circle, rgba(210, 40, 30, 0.85) 25%, rgba(210, 40, 30, 0) 75%)')
  }
  if (hintSquare) add(hintSquare, { boxShadow: `inset 0 0 0 4px ${HINT_OUTLINE}` })
  if (selected) add(selected, { backgroundColor: 'rgba(40, 90, 60, 0.55)' })
  for (const sq of targets) {
    const capture = chess.get(sq) !== undefined
    addLayer(
      sq,
      capture
        ? 'radial-gradient(circle, transparent 58%, rgba(20, 50, 30, 0.45) 60%)'
        : 'radial-gradient(circle, rgba(20, 50, 30, 0.45) 22%, transparent 24%)',
    )
  }

  for (const [sq, list] of Object.entries(layers)) {
    add(sq, {
      backgroundImage: list.map((l) => l.image).join(', '),
      backgroundPosition: list.map((l) => l.position).join(', '),
      backgroundSize: list.map((l) => l.size).join(', '),
      backgroundRepeat: 'no-repeat',
    })
  }
  return styles
}

const BADGE_CORNERS = ['3% 3%', '97% 3%', '3% 97%', '97% 97%']

/** A small filled circle with a number, as an inline SVG image. */
function badgeImage({ label, colour }: SquareBadge): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">` +
    `<circle cx="10" cy="10" r="9" fill="${colour}" stroke="white" stroke-width="1.5"/>` +
    `<text x="10" y="14.2" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="white">${label}</text>` +
    `</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}
