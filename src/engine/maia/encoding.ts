// Turning positions into Maia-3's input, and its output back into moves.
// Adapted from the Maia Chess platform (CSSLab/maia-platform-frontend,
// src/lib/engine/tensor.ts, GPL-3.0), rewritten for chess.js.
//
// Maia always sees the board from White's side: when Black is to move, the
// board is flipped top-to-bottom and the colours swapped, and the chosen
// move is flipped back afterwards.
import { Chess } from 'chess.js'
import MOVE_INDEX from '../../data/maia3Moves.json'

const moveIndex = MOVE_INDEX as Record<string, number>
/** Index → move, the reverse of the table above. */
const MOVES_BY_INDEX: string[] = []
for (const [uci, i] of Object.entries(moveIndex)) MOVES_BY_INDEX[i] = uci

/** Number of moves in Maia-3's move vocabulary (4352). */
export const MOVE_VOCABULARY = MOVES_BY_INDEX.length

// Piece order the model was trained with: White P N B R Q K, then Black.
const PIECES = 'PNBRQKpnbrqk'

export function mirrorSquare(square: string): string {
  return square[0] + (9 - Number(square[1]))
}

export function mirrorMove(uci: string): string {
  return mirrorSquare(uci.slice(0, 2)) + mirrorSquare(uci.slice(2, 4)) + uci.slice(4)
}

/** Flips the board top-to-bottom and swaps colours, so Black-to-move looks like White-to-move. */
export function mirrorFen(fen: string): string {
  const [position, turn, castling, enPassant, halfmove, fullmove] = fen.split(' ')
  const swapCase = (s: string) =>
    [...s].map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join('')
  const ranks = position.split('/').reverse().map(swapCase).join('/')
  const rights =
    castling === '-'
      ? '-'
      : ['K', 'Q', 'k', 'q'].filter((r) => castling.includes(swapCase(r))).join('') || '-'
  return [
    ranks,
    turn === 'w' ? 'b' : 'w',
    rights,
    enPassant === '-' ? '-' : mirrorSquare(enPassant),
    halfmove,
    fullmove,
  ].join(' ')
}

/** 64 squares × 12 piece types, a1 first; 1 where a piece stands. */
export function boardTokens(whiteToMoveFen: string): Float32Array {
  const tokens = new Float32Array(64 * 12)
  const rows = whiteToMoveFen.split(' ')[0].split('/')
  for (let r = 0; r < 8; r++) {
    const rank = 7 - r // FEN lists rank 8 first
    let file = 0
    for (const c of rows[r]) {
      const piece = PIECES.indexOf(c)
      if (piece === -1) {
        file += Number(c)
      } else {
        tokens[(rank * 8 + file) * 12 + piece] = 1
        file++
      }
    }
  }
  return tokens
}

export type MaiaInput = {
  tokens: Float32Array
  /** Vocabulary indices of the legal moves, as seen by the model. */
  legalIndices: number[]
  /** True if the board was flipped (Black to move). */
  mirrored: boolean
}

export function encodePosition(fen: string): MaiaInput {
  const mirrored = fen.split(' ')[1] === 'b'
  const seen = mirrored ? mirrorFen(fen) : fen
  const legalIndices = new Chess(seen)
    .moves({ verbose: true })
    .map((m) => moveIndex[m.from + m.to + (m.promotion ?? '')])
    .filter((i): i is number => i !== undefined)
  return { tokens: boardTokens(seen), legalIndices, mirrored }
}

/**
 * Turns the model's raw scores into probabilities over the legal moves
 * (softmax), in real-board UCI, most likely first.
 */
export function decodePolicy(logits: Float32Array, input: MaiaInput): { move: string; p: number }[] {
  const scores = input.legalIndices.map((i) => logits[i])
  const max = Math.max(...scores)
  const exps = scores.map((s) => Math.exp(s - max))
  const total = exps.reduce((a, b) => a + b, 0)
  return input.legalIndices
    .map((i, k) => {
      const uci = MOVES_BY_INDEX[i]
      return { move: input.mirrored ? mirrorMove(uci) : uci, p: exps[k] / total }
    })
    .sort((a, b) => b.p - a.p)
}

/** The model's win chance for the side to move (0–1), from its loss/draw/win scores. */
export function decodeValue(ldw: Float32Array): number {
  const max = Math.max(ldw[0], ldw[1], ldw[2])
  const [l, d, w] = [ldw[0], ldw[1], ldw[2]].map((x) => Math.exp(x - max))
  return (w + 0.5 * d) / (l + d + w)
}
