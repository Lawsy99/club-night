// Plain-English explanations for review moments, built from engine facts
// (what the best move was, what the opponent's best reply would have been)
// and simple board checks. Templates, not guesswork: every sentence states
// something that is actually true on the board.
import { Chess, type PieceSymbol, type Square } from 'chess.js'
import { applyUci, type Colour } from './game'

const NAMES: Record<PieceSymbol, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
}

/** Engine scores beyond this (in centipawns) mean a forced mate. */
const MATE_THRESHOLD = 9000

export type MistakeFacts = {
  /** Position before the player's move. */
  fenBefore: string
  played: string
  bestMove: string | null
  /** The opponent's best reply to the move played, if known. */
  reply: string | null
  /** From the mover's point of view: best available, and after the move played. */
  cpBefore: number
  cpAfter: number
}

export function explainMistake(f: MistakeFacts): string {
  const before = new Chess(f.fenBefore)
  const mover = before.turn()
  const opponent: Colour = mover === 'w' ? 'b' : 'w'
  const bestSan = f.bestMove ? sanOf(f.fenBefore, f.bestMove) : null

  if (f.cpAfter <= -MATE_THRESHOLD && f.cpBefore > -MATE_THRESHOLD) {
    return 'This allowed a forced checkmate.'
  }
  if (f.cpBefore >= MATE_THRESHOLD && f.cpAfter < MATE_THRESHOLD && bestSan) {
    return `You had a forced checkmate, starting with ${bestSan}.`
  }

  // What the opponent could do next.
  const afterMove = new Chess(f.fenBefore)
  applyUci(afterMove, f.played)
  if (f.reply) {
    const afterReply = new Chess(afterMove.fen())
    const reply = applyUci(afterReply, f.reply)
    if (reply) {
      const forked = forkedPieces(afterReply, reply.to, mover, opponent)
      if (forked.length >= 2) {
        return `This allowed a fork: their ${NAMES[reply.piece]} on ${reply.to} attacks your ${listOf(forked)}.`
      }
      if (reply.captured) {
        const lost = NAMES[reply.captured]
        const defended = afterMove.attackers(reply.to, mover).length > 0
        if (!defended) {
          return reply.to === f.played.slice(2, 4)
            ? `Your ${lost} on ${reply.to} was left undefended.`
            : `This left your ${lost} on ${reply.to} undefended.`
        }
        return `This let them win material with ${reply.san}.`
      }
    }
  }

  // What the player could have done instead.
  if (f.bestMove && bestSan) {
    const target = before.get(f.bestMove.slice(2, 4) as Square)
    if (target && target.color === opponent) {
      const free = before.attackers(f.bestMove.slice(2, 4) as Square, opponent).length === 0
      return free
        ? `You missed ${bestSan}, which wins their ${NAMES[target.type]}.`
        : `You missed the chance to take on ${f.bestMove.slice(2, 4)} with ${bestSan}.`
    }
    return `${bestSan} was stronger.`
  }
  return 'There was a stronger move here.'
}

const VALUES: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 }

/**
 * Why the engine's move was the right one, in one line (Joseph, Sep 2026:
 * the coach should say why the best move is best, not just what it was).
 * Only states what the board shows: mate, winning material, a fork, saving
 * a piece, or a check. Otherwise it says what the move keeps, from the score.
 */
export function explainBestMove(fenBefore: string, best: string, bestCp: number, played?: string): string {
  const before = new Chess(fenBefore)
  const mover = before.turn()
  const opponent: Colour = mover === 'w' ? 'b' : 'w'
  const after = new Chess(fenBefore)
  const move = applyUci(after, best)
  if (!move) return ''
  const san = move.san

  if (after.isCheckmate()) return `${san} is checkmate.`
  if (bestCp >= MATE_THRESHOLD) return `${san} starts a forced checkmate.`

  if (move.captured) {
    const safe = after.attackers(move.to, opponent).length === 0
    if (safe) return `${san} wins their ${NAMES[move.captured]} for nothing: nothing can take back.`
    if (VALUES[move.captured] > VALUES[move.piece]) {
      return `${san} wins material: your ${NAMES[move.piece]} for their ${NAMES[move.captured]}.`
    }
  }

  // A fork: the piece that moved now attacks two or more of theirs, one of them big.
  const targets = forkedPieces(after, move.to, opponent, mover)
  if (targets.length >= 2 && targets.some((t) => t === 'king' || t === 'queen' || t === 'rook')) {
    return `${san} is a fork: your ${NAMES[move.piece]} attacks their ${listOf(targets)} at once.`
  }

  // Saving a piece that was in trouble (and the move played didn't).
  const from = best.slice(0, 2) as Square
  const threatened = before.attackers(from, opponent)
  if (move.piece !== 'p' && move.piece !== 'k' && threatened.length > 0 && played?.slice(0, 2) !== from) {
    const defended = before.attackers(from, mover).length > 0
    const cheaperAttacker = threatened.some((sq) => VALUES[before.get(sq)!.type] < VALUES[move.piece])
    if (!defended || cheaperAttacker) return `${san} gets your ${NAMES[move.piece]} out of danger.`
  }

  if (after.inCheck()) return `${san} is check, so they have to deal with that first.`

  if (bestCp >= 300) return `${san} keeps you well on top.`
  if (bestCp >= 80) return `${san} keeps your advantage.`
  if (bestCp > -80) return `${san} keeps the game level.`
  return `${san} was the best defence in a difficult spot.`
}

/** Why the best move of the game was good, in one line. */
export function explainGoodMove(fenBefore: string, uci: string, punished: boolean): string {
  const chess = new Chess(fenBefore)
  const move = applyUci(chess, uci)
  if (!move) return ''
  if (chess.isCheckmate()) return `${move.san}: checkmate.`
  if (punished) return `You punished their mistake with ${move.san}.`
  if (move.captured) return `${move.san} won their ${NAMES[move.captured]}.`
  return `${move.san} was the strongest move in the position.`
}

/** The mover's valuable pieces (not pawns) attacked by the piece on `from`. */
function forkedPieces(chess: Chess, from: Square, mover: Colour, attacker: Colour): string[] {
  const hits: { type: PieceSymbol }[] = []
  for (const row of chess.board()) {
    for (const cell of row) {
      if (!cell || cell.color !== mover || cell.type === 'p') continue
      if (chess.attackers(cell.square, attacker).includes(from)) hits.push(cell)
    }
  }
  // King first, then by value, so it reads naturally: "your king and rook".
  const order: PieceSymbol[] = ['k', 'q', 'r', 'b', 'n']
  return hits.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type)).map((p) => NAMES[p.type])
}

function listOf(items: string[]): string {
  return items.length <= 2 ? items.join(' and ') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`
}

function sanOf(fen: string, uci: string): string | null {
  return applyUci(new Chess(fen), uci)?.san ?? null
}
