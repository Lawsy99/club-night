// Pemberton's notes after a game (Joseph, Sep 2026: "what the game meant",
// not just numbers). Two or three short observations, chosen from what
// actually happened: where it turned, the kind of mistake, chances let go, a
// win thrown away or a comeback, the best and worst phase, and anything you
// keep doing game after game. Every sentence rests on the engine's analysis
// and the board checks in explain.ts; none is guessed.
import { errorKind, type ErrorKind } from './explain'
import type { Colour } from './game'
import { isMissedChance } from './mistakeCards'
import { reviewMoves, type PositionEval, type ReviewedMove } from './review'
import { phaseOf, type Phase } from './stats'

export type NotesInput = {
  moves: readonly string[]
  evals: readonly PositionEval[]
  player: Colour
  /** true won, false lost, null drawn (or unfinished). */
  won: boolean | null
  /** The error kinds of your previous reviewed games, newest first (for patterns). */
  recent?: readonly (readonly ErrorKind[])[]
}

/** Winning, or losing, by this much (centipawns) counts as clearly so. */
const CLEAR = 300

const COUNT_WORDS = ['no', 'once', 'twice', 'three times', 'four times', 'five times']
const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five']
const ORDINALS = ['', 'first', 'second', 'third', 'fourth', 'fifth']
const moveNo = (ply: number) => Math.floor(ply / 2) + 1

/** The kinds of error in a game: one entry per mistake or blunder of yours. */
export function gameErrorKinds(moves: readonly string[], evals: readonly PositionEval[], player: Colour): ErrorKind[] {
  return playerErrors(reviewMoves(moves, evals), evals, player).map((e) => e.kind)
}

type PlayerError = { move: ReviewedMove; kind: ErrorKind; missedChance: boolean }

function playerErrors(reviewed: readonly ReviewedMove[], evals: readonly PositionEval[], player: Colour): PlayerError[] {
  const forPlayer = (cp: number) => (player === 'w' ? cp : -cp)
  return reviewed
    .filter((m) => m.mover === player && (m.rating === 'mistake' || m.rating === 'blunder'))
    .map((m) => {
      const cpBefore = forPlayer(evals[m.ply].cp)
      const cpAfter = forPlayer(evals[m.ply + 1].cp)
      const cpEarlier = m.ply > 0 ? forPlayer(evals[m.ply - 1].cp) : 0
      return {
        move: m,
        kind: errorKind({
          fenBefore: m.fenBefore,
          played: m.uci,
          bestMove: m.bestMove,
          reply: evals[m.ply + 1].bestMove,
          cpBefore,
          cpAfter,
          replyLine: evals[m.ply + 1].pv,
          bestLine: evals[m.ply].pv,
        }),
        missedChance: isMissedChance(cpEarlier, cpBefore),
      }
    })
}

/** What each kind of error is, and the habit that stops it. */
const KIND_NOTES: Record<ErrorKind, { what: (times: string) => string; single: string }> = {
  undefended: {
    what: (t) => `${cap(t)} you left a piece where it could be taken for nothing. Before every move: what’s defended?`,
    single: 'you left a piece undefended',
  },
  fork: {
    what: (t) => `${cap(t)} one of their pieces landed where it hit two of yours at once. Look where their knights can jump.`,
    single: 'you allowed a fork',
  },
  'lost-material': {
    what: (t) => `${cap(t)} an exchange cost you material. Count attackers and defenders before you start one.`,
    single: 'an exchange cost you material',
  },
  'allowed-mate': {
    what: () => 'You walked into mate. Once the queens are on, check your king’s escape squares every move.',
    single: 'you walked into mate',
  },
  'missed-mate': {
    what: () => 'There was a mate on the board you didn’t see. When their king is short of squares, look at every check.',
    single: 'you missed a mate',
  },
  'missed-win': {
    what: (t) => `${cap(t)} there was material to be won and you didn’t take it. Look at every capture first.`,
    single: 'you missed a chance to win material',
  },
  positional: {
    what: (t) => `${cap(t)} the position slipped without anything being taken. That’s about plans: ask what the position needs.`,
    single: 'the position slipped',
  },
  'king-weakened': {
    what: (t) => `${cap(t)} you pushed a pawn in front of your own castled king. Those pawns are its roof: leave them be unless you must.`,
    single: 'you weakened your king',
  },
  'doubled-pawns': {
    what: (t) => `${cap(t)} a capture left you with doubled pawns. Think about which way to take back.`,
    single: 'you took back the wrong way and doubled your pawns',
  },
  'isolated-pawn': {
    what: (t) => `${cap(t)} a capture left one of your pawns on its own. Isolated pawns are targets for the rest of the game.`,
    single: 'you left a pawn isolated',
  },
  'bishop-pair': {
    what: () => 'You gave up the bishop pair for a knight. Keep both bishops unless the swap wins something.',
    single: 'you gave up the bishop pair',
  },
  'traded-behind': {
    what: (t) => `${cap(t)} you swapped pieces while behind. When you have less, keep pieces on and make the game complicated.`,
    single: 'you swapped pieces while behind',
  },
  'early-queen': {
    what: () => 'Your queen came out early and got chased about. Knights and bishops first, the queen later.',
    single: 'your queen came out too early',
  },
  'lost-castling': {
    what: () => 'You moved your king and gave up the right to castle. A king in the middle is a target all game.',
    single: 'you gave up castling',
  },
  'same-piece-twice': {
    what: (t) => `${cap(t)} you moved the same piece again while others were still at home. In the opening, every move should bring out something new.`,
    single: 'you moved a piece twice in the opening',
  },
}

const KIND_PATTERNS: Record<ErrorKind, string> = {
  undefended: 'a piece left undefended',
  fork: 'a fork',
  'lost-material': 'an exchange that cost you material',
  'allowed-mate': 'a mate walked into',
  'missed-mate': 'a mate missed',
  'missed-win': 'material there for the taking and not taken',
  positional: 'a position that slipped',
  'king-weakened': 'your king’s pawns pushed',
  'doubled-pawns': 'doubled pawns',
  'isolated-pawn': 'an isolated pawn',
  'bishop-pair': 'the bishop pair given away',
  'traded-behind': 'pieces swapped while behind',
  'early-queen': 'the queen out too early',
  'lost-castling': 'castling given up',
  'same-piece-twice': 'a piece moved twice in the opening',
}

/** Pemberton's notes: at most three short observations, most useful first. */
export function coachNotes(input: NotesInput): string[] {
  const { moves, evals, player, won } = input
  if (moves.length < 16 || evals.length !== moves.length + 1) return []
  const reviewed = reviewMoves(moves, evals)
  const errors = playerErrors(reviewed, evals, player)
  const notes: { rank: number; text: string }[] = []
  const add = (rank: number, text: string) => notes.push({ rank, text })

  // Your score (centipawns) after each of your moves, for swings.
  const forPlayer = (cp: number) => (player === 'w' ? cp : -cp)
  const yours = reviewed.filter((m) => m.mover === player).map((m) => ({ ply: m.ply, cp: forPlayer(evals[m.ply + 1].cp) }))
  const firstWinning = yours.find((s) => s.cp >= CLEAR)
  const firstLosing = yours.find((s) => s.cp <= -CLEAR)

  // 1. A habit that keeps coming back, across games.
  const kinds = errors.map((e) => e.kind)
  const recent = input.recent ?? []
  for (const kind of new Set(kinds)) {
    if (kind === 'positional') continue
    const earlier = recent.slice(0, 4).filter((g) => g.includes(kind)).length
    if (earlier >= 2) {
      const games = earlier + 1
      const inARow = recent.slice(0, earlier).every((g) => g.includes(kind))
      add(
        0,
        inARow
          ? `That’s the ${ORDINALS[games] ?? `${games}th`} game in a row with ${KIND_PATTERNS[kind]}. It’s the one thing to fix this week.`
          : `That’s ${games} of your last ${Math.min(recent.length, 4) + 1} games with ${KIND_PATTERNS[kind]}. It’s the one thing to fix this week.`,
      )
      break
    }
  }

  // 2. A win thrown away, or a comeback.
  if (firstWinning && won !== true) {
    // ("Well ahead on the board", not "winning": a beginner reads that as the result.)
    add(1, `By move ${moveNo(firstWinning.ply)} you were well ahead on the board. Being ahead still has to be turned into a win: slow down and check their threats.`)
  } else if (firstLosing && won === true) {
    add(1, `By move ${moveNo(firstLosing.ply)} you were well behind on the board, and you kept going. That’s worth more than it sounds.`)
  }

  // 3. The kind of mistake, if one kind stands out; otherwise the turning point.
  const counts = new Map<ErrorKind, number>()
  for (const k of kinds) counts.set(k, (counts.get(k) ?? 0) + 1)
  const [topKind, topCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [null, 0]
  if (topKind && topCount >= 2) {
    add(2, KIND_NOTES[topKind].what(COUNT_WORDS[Math.min(topCount, 5)]))
  } else if (errors.length > 0) {
    // The biggest single error is where the game turned.
    const worst = [...errors].sort((a, b) => b.move.winBefore - b.move.winAfter - (a.move.winBefore - a.move.winAfter))[0]
    add(2, `The game turned on move ${moveNo(worst.move.ply)}, when ${KIND_NOTES[worst.kind].single}.`)
  }

  // 4. Chances they gave you that you let go (if not already the story).
  const letGo = errors.filter((e) => e.missedChance).length
  if (letGo > 0 && topKind !== 'missed-win') {
    add(3, letGo === 1 ? 'They gave you a chance and you let it go.' : `They gave you ${NUMBER_WORDS[Math.min(letGo, 5)]} chances and you let them go.`)
  }

  // 5. The best and worst phase of the game.
  const phase = phaseAccuracy(reviewed, player)
  const measured = (Object.entries(phase) as [Phase, number | null][]).filter((e): e is [Phase, number] => e[1] !== null)
  if (measured.length >= 2) {
    const sorted = [...measured].sort((a, b) => b[1] - a[1])
    const [best, worst] = [sorted[0], sorted[sorted.length - 1]]
    if (best[1] - worst[1] >= 12) add(4, `Your ${best[0]} was the best part. The ${worst[0]} is where it went.`)
  }

  // 6. A clean game is worth saying so.
  if (errors.length === 0 && moves.length >= 40) add(5, 'No mistakes, no blunders. That’s how games are won at any level.')

  return notes
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 3)
    .map((n) => n.text)
}

/** Your average accuracy in each phase of this game (null with fewer than four moves in it). */
function phaseAccuracy(reviewed: readonly ReviewedMove[], player: Colour): Record<Phase, number | null> {
  const sums: Record<Phase, number[]> = { opening: [], middlegame: [], endgame: [] }
  for (const m of reviewed) if (m.mover === player) sums[phaseOf(m)].push(m.accuracy)
  const avg = (xs: number[]) => (xs.length >= 4 ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
  return { opening: avg(sums.opening), middlegame: avg(sums.middlegame), endgame: avg(sums.endgame) }
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
