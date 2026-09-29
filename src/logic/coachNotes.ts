// Pemberton's notes after a game (Joseph, Sep 2026: "what the game meant",
// not just numbers). Two or three short observations, chosen from what
// actually happened: where it turned, the kind of mistake, chances let go, a
// win thrown away or a comeback, the best and worst phase, and anything you
// keep doing game after game. Every sentence rests on the engine's analysis
// and the board checks in explain.ts; none is guessed.
import { errorKind, type ErrorKind } from './explain'
import type { Colour } from './game'
import { isMissedChance } from './mistakeCards'
import { bestMoveOfGame, reviewMoves, type PositionEval, type ReviewedMove } from './review'
import { phaseOf, type Phase } from './stats'

export type NotesInput = {
  moves: readonly string[]
  evals: readonly PositionEval[]
  player: Colour
  /** true won, false lost, null drawn (or unfinished). */
  won: boolean | null
  /** The error kinds of your previous reviewed games, newest first (for patterns). */
  recent?: readonly (readonly ErrorKind[])[]
  /** This week's focus kinds: checked in their own note, so not repeated here. */
  focusKinds?: readonly ErrorKind[]
}

/** Winning, or losing, by this much (centipawns) counts as clearly so. */
const CLEAR = 300

const COUNT_WORDS = ['no', 'once', 'twice', 'three times', 'four times', 'five times']
const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five']
const ORDINALS = ['', 'first', 'second', 'third', 'fourth', 'fifth']
const moveNo = (ply: number) => Math.floor(ply / 2) + 1

/** The kinds of error in a game: one entry per mistake or blunder of yours. */
export function gameErrorKinds(moves: readonly string[], evals: readonly PositionEval[], player: Colour): ErrorKind[] {
  return gameErrors(moves, evals, player).map((e) => e.kind)
}

/** Each mistake or blunder of yours: where (ply) and what kind. */
export function gameErrors(moves: readonly string[], evals: readonly PositionEval[], player: Colour): { ply: number; kind: ErrorKind }[] {
  return playerErrors(reviewMoves(moves, evals), evals, player).map((e) => ({ ply: e.move.ply, kind: e.kind }))
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
  // (Worded as what the move allowed, not what happened: they may have missed
  // it. Joseph, Sep 2026: never say something happened that didn't.)
  fork: {
    what: (t) => `${cap(t)} you allowed a fork: one of their pieces could hit two of yours at once. Look where their knights can jump.`,
    single: 'you allowed a fork',
  },
  'lost-material': {
    what: (t) => `${cap(t)} you gave them a way to win material. Before every move, look at their captures and checks.`,
    single: 'you gave them a way to win material',
  },
  'allowed-mate': {
    what: () => 'You allowed a forced mate. Once the queens are on, check your king’s escape squares every move.',
    single: 'you allowed a forced mate',
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
    what: () => 'Your queen came out early, where their pieces can chase it about. Knights and bishops first, the queen later.',
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
  fork: 'a fork allowed',
  'lost-material': 'a way to win material handed to them',
  'allowed-mate': 'a forced mate allowed',
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
  const focus = input.focusKinds ?? []
  for (const kind of new Set(kinds)) {
    if (kind === 'positional' || focus.includes(kind)) continue
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
  if (topKind && focus.includes(topKind)) {
    // (Already the focus note.)
  } else if (topKind && topCount >= 2) {
    add(2, KIND_NOTES[topKind].what(COUNT_WORDS[Math.min(topCount, 5)]))
  } else if (errors.length > 0) {
    // The biggest single error is where the game turned.
    const worst = [...errors].sort((a, b) => b.move.winBefore - b.move.winAfter - (a.move.winBefore - a.move.winAfter))[0]
    // ("Your biggest mistake", not "the game turned": they may not have taken advantage.)
    if (!focus.includes(worst.kind)) add(2, `Your biggest mistake was on move ${moveNo(worst.move.ply)}, when ${KIND_NOTES[worst.kind].single}.`)
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

  // 6. Something you did well, to keep doing (Joseph, Sep 2026). Always from
  // this game, always last, so the notes end on what to repeat.
  const good = somethingGood(reviewed, errors, player, won, firstWinning?.ply ?? null, phaseAccuracy(reviewed, player).opening)
  const keep = good ? 2 : 3

  return [
    ...notes
      .sort((a, b) => a.rank - b.rank)
      .slice(0, keep)
      .map((n) => n.text),
    ...(good ? [good] : []),
  ]
}

/**
 * One thing that went well, the most valuable first. Each is measured from
 * the game: the engine's grades, material really won in the game (bestMoveOfGame),
 * and the moves played. Nothing is said if nothing qualifies.
 */
function somethingGood(
  reviewed: readonly ReviewedMove[],
  errors: readonly PlayerError[],
  player: Colour,
  won: boolean | null,
  aheadFrom: number | null,
  openingAccuracy: number | null,
): string | null {
  const mine = reviewed.filter((m) => m.mover === player)
  if (errors.length === 0 && reviewed.length >= 40) return 'No mistakes, no blunders. That’s how games are won at any level.'
  if (won === true && aheadFrom !== null && !errors.some((e) => e.move.ply >= aheadFrom)) {
    return `From move ${moveNo(aheadFrom)} you were ahead, and you didn’t give it back. Turning an advantage into a win is a skill in itself.`
  }
  const best = bestMoveOfGame(reviewed, player)
  if (best?.punished) {
    return `On move ${moveNo(best.move.ply)} they slipped, and you made them pay for it. That’s the habit: after every move of theirs, ask what it left loose.`
  }
  if (mine.length >= 15 && !mine.some((m) => m.rating === 'blunder')) {
    return 'No blunders: you never gave anything away for nothing. Whatever you’re checking before you move, keep checking it.'
  }
  const openingErrors = errors.some((e) => e.move.ply < 20)
  if (!openingErrors && openingAccuracy !== null && openingAccuracy >= 80) {
    return 'A clean opening: your first ten moves gave nothing away. Keep starting games the same way.'
  }
  const castled = mine.find((m) => m.ply < 20 && m.san.startsWith('O-O'))
  if (castled) return `You castled by move ${moveNo(castled.ply)}, so your king was safe before the fighting started. Keep doing that.`
  return null
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
