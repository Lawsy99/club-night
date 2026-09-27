// What an engine line actually does (Sep 2026, honing the coach: his
// explanations sometimes didn't match the board, because they only looked one
// move ahead). Given a position and the engine's continuation, this plays the
// line out and reports the facts: the material it wins or loses once the
// exchanges are over, whether it ends in mate or a pawn queening, and the
// tactic behind it, but only a tactic the line itself proves (a "fork" only
// if a forked piece then falls). The coach's words are built on these facts,
// so they're always true.
import { Chess, type Move, type PieceSymbol, type Square } from 'chess.js'
import { applyUci, type Colour } from './game'

export const PIECE_NAMES: Record<PieceSymbol, string> = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' }
export const PIECE_VALUES: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 }

/** How far into a line to look (the engine's later moves are guesswork at review depth). */
export const LINE_PLIES = 8
/** Extra plies allowed to finish an exchange that's under way at the cut-off. */
const SETTLE_PLIES = 3
/** A tactic must pay off within this many plies of the move that makes it. */
const TACTIC_PLIES = 5
/** Tactics are looked for on the starting side's first three moves of the line. */
const TACTIC_START_PLIES = 4

export type LineOutcome = {
  /** The moves played along the line (legal ones only). */
  moves: Move[]
  /** The position before each move (fens[i] is before moves[i]). */
  fens: string[]
  /** Material gained by the side to move at the start, in pawns (negative: lost). */
  net: number
  /** Their pieces taken, and ours, after cancelling like for like. */
  won: PieceSymbol[]
  lost: PieceSymbol[]
  /** Knights and bishops were swapped for each other along the way: call them "pieces". */
  mixedMinors: boolean
  /** Every piece of the starting side that was taken, before any trades are cancelled out. */
  takenFromUs: PieceSymbol[]
  /** The line ends in checkmate: by the side that starts (mates), or against it (mated). */
  mates: boolean
  mated: boolean
  /** Who gets a new queen in the line, if anyone. */
  promotes: 'us' | 'them' | null
  /** The starting side's biggest capture in the line: the point of it. */
  keyCapture: Move | null
  /** Both sides took something of equal value (a trade happened). */
  traded: boolean
  /** Rooks, bishops, knights and queens left on the board at the end (both sides): few means an ending. */
  piecesLeft: number
}

/** Plays a line out from `fen` and totals the material, from the side to move's point of view. */
export function followLine(fen: string, line: readonly string[], maxPlies = LINE_PLIES): LineOutcome {
  const chess = new Chess(fen)
  const me = chess.turn()
  const moves: Move[] = []
  const fens: string[] = []
  for (const uci of line) {
    // Stop at the cut-off unless an exchange is still going on.
    if (moves.length >= maxPlies && !(moves.at(-1)?.captured && moves.length < maxPlies + SETTLE_PLIES)) break
    const before = chess.fen()
    const move = applyUci(chess, uci)
    if (!move) break
    fens.push(before)
    moves.push(move)
    if (chess.isGameOver()) break
  }
  const takenByMe: PieceSymbol[] = []
  const takenFromMe: PieceSymbol[] = []
  for (const m of moves) {
    if (!m.captured) continue
    if (m.color === me) takenByMe.push(m.captured)
    else takenFromMe.push(m.captured)
  }
  let net = sum(takenByMe) - sum(takenFromMe)
  let promotes: LineOutcome['promotes'] = null
  for (const m of moves) {
    if (!m.promotion) continue
    net += (m.color === me ? 1 : -1) * (PIECE_VALUES[m.promotion] - 1)
    promotes ??= m.color === me ? 'us' : 'them'
  }
  // A line that stops on a capture: assume the obvious recapture, if it pays
  // (the piece is loose, or the recapturer is worth no more), and the retake.
  const last = moves.at(-1)
  if (last?.captured && !chess.isGameOver()) {
    const square = last.to as Square
    const recapture = cheapestAttacker(chess, square, chess.turn())
    const lostPiece = last.promotion ?? last.piece
    const defended = chess.attackers(square, last.color).length > 0
    if (recapture && (!defended || PIECE_VALUES[recapture] <= PIECE_VALUES[lostPiece])) {
      const retake = defended && recapture !== 'k' ? recapture : null
      const sign = last.color === me ? -1 : 1
      net += sign * PIECE_VALUES[lostPiece]
      ;(last.color === me ? takenFromMe : takenByMe).push(lostPiece)
      if (retake) {
        net -= sign * PIECE_VALUES[retake]
        ;(last.color === me ? takenByMe : takenFromMe).push(retake)
      }
    }
  }
  const all = [...takenByMe, ...takenFromMe]
  const { won, lost } = cancel(takenByMe, takenFromMe)
  const mateHappened = chess.isCheckmate()
  // The capture that's the point: one whose piece is still won at the end
  // (not a queen that's simply traded back), the biggest of those.
  const captures = moves.filter((m) => m.color === me && m.captured).sort((a, b) => PIECE_VALUES[b.captured!] - PIECE_VALUES[a.captured!])
  const keyCapture = captures.find((m) => won.includes(m.captured!)) ?? null
  return {
    moves,
    fens,
    net,
    won,
    lost,
    mixedMinors: all.includes('n') && all.includes('b'),
    takenFromUs: order(takenFromMe),
    mates: mateHappened && chess.turn() !== me,
    mated: mateHappened && chess.turn() === me,
    promotes,
    keyCapture,
    traded: takenByMe.some((p) => p !== 'p' && takenFromMe.some((q) => PIECE_VALUES[q] === PIECE_VALUES[p])),
    piecesLeft: chess.board().flat().filter((c) => c && c.type !== 'k' && c.type !== 'p').length,
  }
}

/**
 * What a move itself can be credited with winning, from how the game (or a
 * line) went on (Sep 2026: "Ke1 won two pieces and a pawn" when later moves
 * did the winning). A check or capture gets the next couple of moves; a quiet
 * move only its own follow-up, unless it set up a tactic that paid off.
 */
export function creditFor(fen: string, line: readonly string[]): LineOutcome {
  const probe = followLine(fen, line, 1)
  const first = probe.moves[0]
  const forcing = !!first && (!!first.captured || first.san.includes('+'))
  const window = forcing ? 5 : 3
  const out = followLine(fen, line, window)
  if (forcing || out.net < 1) return out
  // A quiet move: only if its own tactic won it.
  const tactic = findTactic(followLine(fen, line))
  return tactic?.index === 0 ? followLine(fen, line) : out
}

/** "a knight", "the exchange", "a rook for a bishop", "two pawns": what a line wins (null if nothing). */
export function describeGain(won: readonly PieceSymbol[], lost: readonly PieceSymbol[], mixedMinors = false): string | null {
  const name = (p: PieceSymbol) => (mixedMinors && (p === 'n' || p === 'b') ? 'piece' : PIECE_NAMES[p])
  if (won.length === 0) return null
  if (lost.length === 0) return nounList(won, name)
  if (won.length === 1 && lost.length === 1) {
    if (won[0] === 'r' && (lost[0] === 'n' || lost[0] === 'b')) return 'the exchange'
    return `${withArticle(won[0], name)} for ${withArticle(lost[0], name)}`
  }
  if (sum(won) - sum(lost) <= 0) return null
  return `${nounList(won, name)} for ${nounList(lost, name)}`
}

export type Tactic =
  | { kind: 'fork'; attacker: PieceSymbol; targets: PieceSymbol[]; falls: PieceSymbol }
  | { kind: 'skewer'; front: PieceSymbol; behind: PieceSymbol }
  | { kind: 'pin'; pinned: PieceSymbol; behind: PieceSymbol }
  | { kind: 'discovered'; target: PieceSymbol }
  | { kind: 'undefended'; piece: PieceSymbol; square: string }
  | { kind: 'defender'; target: PieceSymbol; square: string }

/** A tactic, and where in the line it comes (index into outcome.moves; 0 is the first move). */
export type FoundTactic = { tactic: Tactic; index: number; move: Move }

/**
 * The tactic behind a line, if the line proves it: on the starting side's
 * first few moves, a fork, skewer, pin or discovered attack whose target
 * really is taken soon after. Otherwise null (better to say less than
 * something untrue).
 */
export function findTactic(outcome: LineOutcome): FoundTactic | null {
  for (let i = 0; i <= TACTIC_START_PLIES && i < outcome.moves.length; i += 2) {
    const tactic = tacticAt(outcome, i)
    // The piece the tactic wins has to be part of what's won in the end: a
    // "skewered" queen that's simply traded back isn't a skewer worth naming.
    if (tactic && outcome.won.includes(prize(tactic))) return { tactic, index: i, move: outcome.moves[i] }
  }
  return null
}

/** The piece a tactic wins. */
function prize(t: Tactic): PieceSymbol {
  switch (t.kind) {
    case 'fork':
      return t.falls
    case 'skewer':
      return t.behind
    case 'pin':
      return t.pinned
    case 'discovered':
    case 'defender':
      return t.target
    case 'undefended':
      return t.piece
  }
}

/** The line in move notation ("Qh7+ Kf8 Qh8#"). */
export function lineSan(outcome: LineOutcome, from = 0, to = outcome.moves.length): string {
  return outcome.moves.slice(from, to).map((m) => m.san).join(' ')
}

/**
 * A sacrifice: the piece that made move `index` is taken straight back, and
 * it had taken less than itself (or nothing). A queen taking a queen isn't one.
 */
export function isSacrifice(outcome: LineOutcome, index: number): boolean {
  const m = outcome.moves[index]
  const reply = outcome.moves[index + 1]
  if (!m || !reply || !reply.captured || reply.to !== m.to) return false
  return !m.captured || PIECE_VALUES[m.captured] < PIECE_VALUES[m.piece]
}

// --- Tactics -------------------------------------------------------------------

function tacticAt(outcome: LineOutcome, i: number): Tactic | null {
  const move = outcome.moves[i]
  const fenBefore = outcome.fens[i]
  if (!move || !fenBefore) return null
  const me = move.color as Colour
  const them: Colour = me === 'w' ? 'b' : 'w'
  const before = new Chess(fenBefore)
  const after = new Chess(fenBefore)
  applyUci(after, move.lan)
  const end = i + TACTIC_PLIES
  const falls = (square: string) => pieceFalls(outcome.moves, square, i + 1, end, me)

  // Taking something nothing can take back (the first move only).
  if (i === 0 && move.captured && move.captured !== 'p' && after.attackers(move.to as Square, them).length === 0) {
    return { kind: 'undefended', piece: move.captured, square: move.to }
  }

  // A fork: the moved piece attacks two of theirs that matter, and one of them falls.
  const targets = attackedFrom(after, move.to as Square, them, me).filter(
    (t) => t.type === 'k' || PIECE_VALUES[t.type] > PIECE_VALUES[move.piece] || after.attackers(t.square as Square, them).length === 0,
  )
  // (Not if the forking piece is simply taken on the next move: then it wasn't a fork that worked.)
  const forkerTaken = outcome.moves[i + 1]?.captured && outcome.moves[i + 1].to === move.to
  if (targets.length >= 2 && !forkerTaken) {
    const fallen = targets.find((t) => t.type !== 'k' && falls(t.square))
    if (fallen) return { kind: 'fork', attacker: move.piece, targets: order(targets.map((t) => t.type)), falls: fallen.type }
  }

  // A skewer or a pin along the moved piece's lines.
  for (const [front, back] of linesFrom(after, move)) {
    if (front.color !== them || back.color !== them) continue
    if ((front.type === 'k' || front.type === 'q') && back.type !== 'p' && PIECE_VALUES[front.type] > PIECE_VALUES[back.type] && falls(back.square)) {
      return { kind: 'skewer', front: front.type, behind: back.type }
    }
    if (front.type !== 'p' && PIECE_VALUES[back.type] > PIECE_VALUES[front.type] && (falls(front.square) || falls(back.square))) {
      return { kind: 'pin', pinned: front.type, behind: back.type }
    }
  }

  // Removing the defender: the capture takes the piece that was guarding
  // something else, and that something falls.
  if (move.captured) {
    for (const row of before.board()) {
      for (const cell of row) {
        if (!cell || cell.color !== them || cell.type === 'p' || cell.square === move.to) continue
        if (before.attackers(cell.square, them).includes(move.to as Square) && falls(cell.square)) {
          return { kind: 'defender', target: cell.type, square: cell.square }
        }
      }
    }
  }

  // A discovered attack: a piece that didn't move now hits something that falls.
  for (const row of after.board()) {
    for (const cell of row) {
      if (!cell || cell.color !== them || cell.type === 'p') continue
      const nowBy = after.attackers(cell.square, me).filter((sq) => sq !== move.to)
      const wasBy = before.attackers(cell.square, me)
      if (nowBy.some((sq) => !wasBy.includes(sq)) && PIECE_VALUES[cell.type] >= 3 && falls(cell.square)) {
        return { kind: 'discovered', target: cell.type }
      }
    }
  }
  return null
}

/** Follows the piece on `square` through the line: is it taken by `taker` before `to`? */
function pieceFalls(moves: readonly Move[], square: string, from: number, to: number, taker: string): boolean {
  let sq = square
  for (let j = from; j < to && j < moves.length; j++) {
    const m = moves[j]
    if (m.color === taker && m.captured && m.to === sq) return true
    if (m.color !== taker && m.from === sq) sq = m.to
  }
  return false
}

// --- Helpers ------------------------------------------------------------------

function sum(pieces: readonly PieceSymbol[]): number {
  return pieces.reduce((s, p) => s + (p === 'k' ? 0 : PIECE_VALUES[p]), 0)
}

/** Takes out like-for-like trades: a knight each way cancels, and so does a knight for a bishop. */
function cancel(mine: readonly PieceSymbol[], theirs: readonly PieceSymbol[]): { won: PieceSymbol[]; lost: PieceSymbol[] } {
  const won = [...mine]
  const lost: PieceSymbol[] = []
  for (const p of theirs) {
    const i = won.indexOf(p)
    if (i >= 0) won.splice(i, 1)
    else lost.push(p)
  }
  for (const minor of ['n', 'b'] as const) {
    const other = minor === 'n' ? 'b' : 'n'
    while (won.includes(minor) && lost.includes(other)) {
      won.splice(won.indexOf(minor), 1)
      lost.splice(lost.indexOf(other), 1)
    }
  }
  return { won: order(won), lost: order(lost) }
}

const ORDER: PieceSymbol[] = ['k', 'q', 'r', 'b', 'n', 'p']
function order(pieces: readonly PieceSymbol[]): PieceSymbol[] {
  return [...pieces].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))
}

const NUMBERS = ['', 'a', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight']
function withArticle(p: PieceSymbol, name: (p: PieceSymbol) => string): string {
  return p === 'q' ? 'the queen' : `a ${name(p)}`
}
function nounList(pieces: readonly PieceSymbol[], name: (p: PieceSymbol) => string): string {
  const counts = new Map<string, { p: PieceSymbol; n: number }>()
  for (const p of pieces) {
    const key = name(p)
    const c = counts.get(key) ?? { p, n: 0 }
    c.n++
    counts.set(key, c)
  }
  const parts = [...counts.entries()].map(([key, { p, n }]) => (n === 1 ? withArticle(p, name) : `${NUMBERS[n] ?? n} ${key}s`))
  return parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`
}

function cheapestAttacker(chess: Chess, square: Square, side: Colour): PieceSymbol | null {
  const attackers = chess.attackers(square, side).map((sq) => chess.get(sq)!.type)
  return attackers.sort((a, b) => PIECE_VALUES[a] - PIECE_VALUES[b])[0] ?? null
}

type Placed = { type: PieceSymbol; color: string; square: string }

/** `victim`'s pieces (not pawns) attacked by the piece on `from`. */
function attackedFrom(chess: Chess, from: Square, victim: Colour, attacker: Colour): Placed[] {
  const hits: Placed[] = []
  for (const row of chess.board()) {
    for (const cell of row) {
      if (cell && cell.color === victim && cell.type !== 'p' && chess.attackers(cell.square, attacker).includes(from)) {
        hits.push({ type: cell.type, color: cell.color, square: cell.square })
      }
    }
  }
  return hits
}

const FILES = 'abcdefgh'
const DIRECTIONS: Partial<Record<PieceSymbol, number[][]>> = {
  b: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
  r: [[1, 0], [-1, 0], [0, 1], [0, -1]],
  q: [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]],
}

/** The first two pieces along each line from a moved slider. */
function linesFrom(chess: Chess, move: Move): [Placed, Placed][] {
  const dirs = DIRECTIONS[move.piece]
  if (!dirs) return []
  const result: [Placed, Placed][] = []
  for (const [df, dr] of dirs) {
    const hits: Placed[] = []
    for (let f = FILES.indexOf(move.to[0]) + df, r = Number(move.to[1]) + dr; f >= 0 && f < 8 && r >= 1 && r <= 8; f += df, r += dr) {
      const square = `${FILES[f]}${r}`
      const p = chess.get(square as Square)
      if (p) {
        hits.push({ type: p.type, color: p.color, square })
        if (hits.length === 2) break
      }
    }
    if (hits.length === 2) result.push([hits[0], hits[1]])
  }
  return result
}
