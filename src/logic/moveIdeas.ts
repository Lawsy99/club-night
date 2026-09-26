// What a move actually does, in words (Joseph, Sep 2026: the coach should
// say "opens this, puts pressure on that, defends that", not just "keeps the
// advantage"). Each idea is a plain board fact found with chess.js, so it's
// always true. The best one or two are used; the caller adds the move itself.
import { Chess, type Move, type PieceSymbol, type Square } from 'chess.js'
import { applyUci, type Colour } from './game'

const NAMES: Record<PieceSymbol, string> = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' }
const VALUES: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 }
const FILES = 'abcdefgh'

/** The ideas behind a move, most important first (phrases that follow the move, e.g. "pins their knight"). */
export function moveIdeas(fenBefore: string, uci: string, cpForMover = 0): string[] {
  const before = new Chess(fenBefore)
  const me = before.turn() as Colour
  const them: Colour = me === 'w' ? 'b' : 'w'
  const after = new Chess(fenBefore)
  const move = applyUci(after, uci) as Move | null
  if (!move) return []
  const ideas: { rank: number; text: string }[] = []
  const add = (rank: number, text: string) => ideas.push({ rank, text })

  // Their threats before (as if it were their move) and after.
  const threatsBefore = threats(passTurn(fenBefore), them)
  const threatsAfter = threats(after.fen(), them)
  if (threatsBefore.mate && !threatsAfter.mate) add(1, 'stops their mate threat')
  else {
    const stopped = threatsBefore.targets.filter((sq) => !threatsAfter.targets.includes(sq) && sq !== move.from)
    const target = stopped[0] ? before.get(stopped[0] as Square) : null
    if (target) add(1, `defends your ${NAMES[target.type]} on ${stopped[0]}`)
  }

  // Our threats now (as if it were our move again).
  const ours = threats(passTurn(after.fen()), me)
  const oursBefore = threats(fenBefore, me)
  if (ours.mate && !after.inCheck()) add(2, 'threatens mate')
  const newTargets = ours.targets.filter((sq) => !oursBefore.targets.includes(sq))
  if (newTargets[0]) {
    const piece = after.get(newTargets[0] as Square)
    if (piece) add(3, `attacks their ${NAMES[piece.type]} on ${newTargets[0]}`)
  }

  const pin = pinCreated(after, move, them)
  if (pin) add(3, `pins their ${NAMES[pin.pinned]} to their ${NAMES[pin.behind]}`)

  if (move.piece === 'p' && isPassed(after, move.to as Square, me)) {
    add(4, isPassed(before, move.from as Square, me) ? 'pushes your passed pawn' : 'creates a passed pawn')
  }

  const file = move.to[0]
  if (move.piece === 'r' && move.from[0] !== file) {
    const pawnsOnFile = filePawns(after, file)
    if (pawnsOnFile.length === 0) add(4, `puts your rook on the open ${file}-file`)
    else if (!pawnsOnFile.some((p) => p === me)) add(5, `puts your rook on the half-open ${file}-file`)
  }
  if (move.piece === 'p' && move.from[0] !== file) {
    // A pawn capture can clear its old file for a rook behind it.
    const old = move.from[0]
    if (!filePawns(after, old).some((p) => p === me) && rookOnFile(after, old, me)) add(4, `opens the ${old}-file for your rook`)
  }

  if (move.captured && Math.abs(VALUES[move.captured] - VALUES[move.piece]) <= 1 && cpForMover >= 200 && move.piece !== 'p') {
    add(4, 'trades pieces while you’re ahead, which makes the win simpler')
  }

  if (move.isKingsideCastle() || move.isQueensideCastle()) add(5, 'tucks your king away and brings a rook into play')

  const moveNo = Number(fenBefore.split(' ')[5] ?? 1)
  const backRank = me === 'w' ? '1' : '8'
  if (moveNo <= 12 && (move.piece === 'n' || move.piece === 'b') && move.from[1] === backRank) {
    add(6, `develops your ${NAMES[move.piece]}${isCentral(move.to) ? ' towards the centre' : ''}`)
  }
  if (move.piece === 'p' && ['d4', 'e4', 'd5', 'e5'].includes(move.to) && moveNo <= 15) add(6, 'takes space in the centre')

  const minorsAndMajors = after.board().flat().filter((c) => c && c.type !== 'k' && c.type !== 'p').length
  if (move.piece === 'k' && minorsAndMajors <= 4 && distanceToCentre(move.to) < distanceToCentre(move.from)) {
    add(5, 'brings your king into the game')
  }

  const theirKing = kingSquare(after, them)
  if (theirKing && move.piece !== 'p' && move.piece !== 'k' && distance(move.to, theirKing) <= 2 && distance(move.from, theirKing) > 2) {
    add(6, `brings your ${NAMES[move.piece]} closer to their king`)
  }

  if (move.piece !== 'p' && move.piece !== 'k' && ideas.length === 0) {
    const gain = mobility(after, move.to as Square, me) - mobility(before, move.from as Square, me)
    if (gain >= 3) add(7, `gives your ${NAMES[move.piece]} more room`)
  }

  return ideas.sort((a, b) => a.rank - b.rank).map((i) => i.text)
}

/** "A and B", for joining ideas into a sentence. */
export function joinIdeas(ideas: readonly string[], max = 2): string {
  const used = ideas.slice(0, max)
  return used.length <= 1 ? (used[0] ?? '') : `${used.slice(0, -1).join(', ')} and ${used.at(-1)}`
}

// --- Board facts --------------------------------------------------------------

/** The same position with the other side to move (a "pass"), for finding threats. */
function passTurn(fen: string): string {
  const parts = fen.split(' ')
  return [parts[0], parts[1] === 'w' ? 'b' : 'w', parts[2], '-', '0', parts[5] ?? '1'].join(' ')
}

/** Captures `side` could make that win material, and whether it has mate in one. */
function threats(fen: string, side: Colour): { targets: string[]; mate: boolean } {
  let chess: Chess
  try {
    chess = new Chess(fen)
  } catch {
    return { targets: [], mate: false }
  }
  if (chess.turn() !== side || chess.isGameOver()) return { targets: [], mate: false }
  const targets: string[] = []
  let mate = false
  for (const m of chess.moves({ verbose: true })) {
    if (m.captured && m.captured !== 'k') {
      const defended = chess.attackers(m.to as Square, side === 'w' ? 'b' : 'w').length > 0
      if (!defended || VALUES[m.captured] > VALUES[m.piece]) targets.push(m.to)
    }
    if (!mate && m.san.endsWith('#')) mate = true
  }
  return { targets: [...new Set(targets)], mate }
}

/** A pin made by the piece that just moved: their piece, and the bigger one behind it. */
function pinCreated(chess: Chess, move: Move, them: Colour): { pinned: PieceSymbol; behind: PieceSymbol } | null {
  if (!['b', 'r', 'q'].includes(move.piece)) return null
  const dirs =
    move.piece === 'b'
      ? [[1, 1], [1, -1], [-1, 1], [-1, -1]]
      : move.piece === 'r'
        ? [[1, 0], [-1, 0], [0, 1], [0, -1]]
        : [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]]
  const f0 = FILES.indexOf(move.to[0])
  const r0 = Number(move.to[1])
  for (const [df, dr] of dirs) {
    const hits: { type: PieceSymbol; color: string }[] = []
    for (let f = f0 + df, r = r0 + dr; f >= 0 && f < 8 && r >= 1 && r <= 8; f += df, r += dr) {
      const p = chess.get(`${FILES[f]}${r}` as Square)
      if (p) {
        hits.push(p)
        if (hits.length === 2) break
      }
    }
    const [first, second] = hits
    if (first && second && first.color === them && second.color === them && VALUES[second.type] > VALUES[first.type] && first.type !== 'p') {
      if (second.type === 'k' || second.type === 'q' || (second.type === 'r' && VALUES[first.type] < 5)) {
        return { pinned: first.type, behind: second.type }
      }
    }
  }
  return null
}

function isPassed(chess: Chess, square: Square, me: Colour): boolean {
  const f = FILES.indexOf(square[0])
  const r = Number(square[1])
  for (const row of chess.board()) {
    for (const c of row) {
      if (!c || c.type !== 'p' || c.color === me) continue
      const cf = FILES.indexOf(c.square[0])
      const cr = Number(c.square[1])
      if (Math.abs(cf - f) <= 1 && (me === 'w' ? cr > r : cr < r)) return false
    }
  }
  return true
}

function filePawns(chess: Chess, file: string): string[] {
  const colours: string[] = []
  for (let r = 1; r <= 8; r++) {
    const p = chess.get(`${file}${r}` as Square)
    if (p?.type === 'p') colours.push(p.color)
  }
  return colours
}

function rookOnFile(chess: Chess, file: string, me: Colour): boolean {
  for (let r = 1; r <= 8; r++) {
    const p = chess.get(`${file}${r}` as Square)
    if (p && p.color === me && (p.type === 'r' || p.type === 'q')) return true
  }
  return false
}

function kingSquare(chess: Chess, side: Colour): string | null {
  for (const row of chess.board()) for (const c of row) if (c && c.type === 'k' && c.color === side) return c.square
  return null
}

const isCentral = (sq: string) => 'cdef'.includes(sq[0]) && '3456'.includes(sq[1])
const distance = (a: string, b: string) =>
  Math.max(Math.abs(FILES.indexOf(a[0]) - FILES.indexOf(b[0])), Math.abs(Number(a[1]) - Number(b[1])))
const distanceToCentre = (sq: string) =>
  Math.max(Math.abs(FILES.indexOf(sq[0]) - 3.5), Math.abs(Number(sq[1]) - 4.5))

/** How many squares the piece on `square` could move to, if it were its side's turn. */
function mobility(chess: Chess, square: Square, me: Colour): number {
  const fen = chess.turn() === me ? chess.fen() : passTurn(chess.fen())
  try {
    return new Chess(fen).moves({ square, verbose: true }).length
  } catch {
    return 0
  }
}
