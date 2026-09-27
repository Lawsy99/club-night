// Plain-English explanations for review moments, the coach's comments and
// warm-ups. Rebuilt Sep 2026 (Joseph: the coach sometimes said things that
// didn't match the board): every claim now comes from playing out the
// engine's own line (logic/lineFacts.ts). "You lose a knight" means the line
// really loses a knight once the exchanges are done; "a fork" means a forked
// piece really falls. A mistake is only blamed on material if the better move
// wouldn't have lost the same material anyway. Where the facts are thin, it
// says less rather than something untrue.
import { Chess, type PieceSymbol, type Square } from 'chess.js'
import { applyUci, type Colour } from './game'
import {
  describeGain,
  findTactic,
  followLine,
  lineSan,
  PIECE_NAMES as NAMES,
  PIECE_VALUES as VALUES,
  isSacrifice,
  type FoundTactic,
  type LineOutcome,
  type Tactic,
} from './lineFacts'
import { joinIdeas, moveIdeas } from './moveIdeas'
import { positionalHarm, type PositionalKind } from './positional'

/** Engine scores beyond this (in centipawns) mean a forced mate. */
const MATE_THRESHOLD = 9000
/** Mates this short (in single moves) are spelled out. */
const SHORT_MATE_PLIES = 7
/** A line has to win or lose at least this much (pawns) to be about material. */
const MATERIAL = 1
/** Clearly winning, for "the ending is winning" and sacrifices. */
const WINNING_CP = 250
/** No more pieces than this (rooks, bishops, knights, queens, both sides) and it's an ending. */
const ENDING_PIECES = 4
/** A drop this big (centipawns) is never "nothing terrible". */
const BIG_DROP = 150

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
  /** The engine's line after the move played, starting with their reply (when known). */
  replyLine?: readonly string[]
  /** The engine's line from the position before, starting with the best move (when known). */
  bestLine?: readonly string[]
  /** The opponent's move just before, and the position it was played in (to tell "take back" from "win"). */
  prev?: { fen: string; move: string }
}

/**
 * What kind of error a move was, for counting across a game and across games
 * (Pemberton's notes). Uses the same facts as explainMistake.
 */
export type ErrorKind =
  | 'allowed-mate'
  | 'missed-mate'
  | 'fork'
  | 'undefended'
  | 'lost-material'
  | 'missed-win'
  | PositionalKind
  | 'positional'

export function errorKind(f: MistakeFacts): ErrorKind {
  return analyseMistake(f).kind
}

export function explainMistake(f: MistakeFacts): string {
  return analyseMistake(f).text
}

function analyseMistake(f: MistakeFacts): { kind: ErrorKind; text: string } {
  const bestSan = f.bestMove ? sanOf(f.fenBefore, f.bestMove) : null
  const afterFen = fenAfter(f.fenBefore, f.played)
  const replyLine = f.replyLine?.length ? f.replyLine : f.reply ? [f.reply] : null
  // (Long enough to see a mate or a pawn run through.)
  const theirs = replyLine && afterFen ? followLine(afterFen, replyLine, 12) : null

  if ((f.cpAfter <= -MATE_THRESHOLD && f.cpBefore > -MATE_THRESHOLD) || (theirs?.mates && f.cpBefore > -MATE_THRESHOLD)) {
    const text =
      theirs?.mates && theirs.moves.length <= SHORT_MATE_PLIES
        ? theirs.moves.length === 1
          ? `This allowed ${lineSan(theirs)}, checkmate.`
          : `This allowed a forced checkmate: ${lineSan(theirs)}.`
        : 'This allowed a forced checkmate.'
    return { kind: 'allowed-mate', text }
  }
  if (f.cpBefore >= MATE_THRESHOLD && f.cpAfter < MATE_THRESHOLD && bestSan) {
    const ours = f.bestLine ? followLine(f.fenBefore, f.bestLine, 12) : null
    const text =
      ours?.mates && ours.moves.length <= SHORT_MATE_PLIES && ours.moves.length > 1
        ? `You had a forced checkmate: ${lineSan(ours)}.`
        : `You had a forced checkmate, starting with ${bestSan}.`
    return { kind: 'missed-mate', text }
  }

  // They had just taken something, and the move played didn't take back.
  const retake = f.bestMove && bestSan && recaptured(f.prev, f.bestMove) && f.played.slice(2, 4) !== f.bestMove.slice(2, 4)
  if (retake) return { kind: 'missed-win', text: `You needed to take back on ${f.bestMove!.slice(2, 4)} with ${bestSan}.` }

  // Material: what the move and their best line cost, against what the best line keeps.
  const bestOutcome = f.bestMove ? followLine(f.fenBefore, f.bestLine?.[0] === f.bestMove ? f.bestLine : [f.bestMove]) : null
  const keeps = bestOutcome ? bestOutcome.net : 0
  const played = replyLine ? followLine(f.fenBefore, [f.played, ...replyLine]) : null
  // (Their line is from their side: "us" there means them.)
  if (theirs?.promotes === 'us' && (!bestOutcome || bestOutcome.promotes !== 'them')) {
    return { kind: 'lost-material', text: `After ${theirs.moves[0].san}, nothing stops their pawn from queening.` }
  }
  if (played && replyLine && afterFen && played.net <= -MATERIAL && played.net < keeps - 0.9) {
    return lossSentence(f, played, followLine(afterFen, replyLine))
  }

  // What the player could have won instead.
  if (bestOutcome && bestSan && f.bestMove) {
    const playedNet = played ? played.net : 0
    if (bestOutcome.net >= MATERIAL && bestOutcome.net > playedNet + 0.9) {
      const gain = describeGain(bestOutcome.won, bestOutcome.lost, bestOutcome.mixedMinors) ?? 'material'
      const found = findTactic(bestOutcome)
      return { kind: 'missed-win', text: `You missed ${bestSan}. ${winsWith(bestOutcome, found, gain, 'their')}` }
    }
  }

  // Nothing tactical: what the move did to the position, if it's something to name.
  const harm = positionalHarm(f.fenBefore, f.played, f.cpBefore)
  if (harm) return { kind: harm.kind, text: harm.text }
  // Otherwise, what their best reply does to you (Sep 2026: "Nxd4 was
  // stronger" said nothing; "It allowed Qg5, which attacks your knight" does).
  const reply = theirs?.moves[0]
  // (Not when their reply is simply a trade: "Qxd1+ attacks your bishop"
  // would miss that it's the queens coming off.)
  const trade = reply?.captured && theirs?.moves[1]?.captured && theirs.moves[1].to === reply.to
  if (reply && afterFen && !trade) {
    const threat = moveIdeas(afterFen, reply.lan).filter((i) => /^(threatens mate|attacks their|pins their)/.test(i))
    if (threat.length) return { kind: 'positional', text: `It allowed ${reply.san}, which ${joinIdeas(threat.map(fromTheirSide))}.` }
  }
  // A big swing with nothing to point at in the first few moves: name their
  // best reply, so the player can see it in the step-through.
  if (reply && f.cpBefore - f.cpAfter >= BIG_DROP) {
    return { kind: 'positional', text: `That gave them ${reply.san}, and from there your position gets much harder.` }
  }
  return { kind: 'positional', text: bestSan ? `${bestSan} was stronger.` : 'There was a stronger move here.' }
}

/** Turns one of their ideas round to your side ("attacks their knight" → "attacks your knight"). */
function fromTheirSide(idea: string): string {
  return idea.replace(/\btheir\b/g, 'your')
}

/** Why the move played lost material, naming the tactic when the line proves one. */
function lossSentence(f: MistakeFacts, played: LineOutcome, theirs: LineOutcome): { kind: ErrorKind; text: string } {
  const loss = describeGain(played.lost, played.won, played.mixedMinors) ?? 'material'
  const reply = theirs.moves[0]
  // (Worded "costs you" and "gives away", never "you lose": Joseph, Sep 2026,
  // a beginner who'd won read "you lost material" as "you lost".)
  if (!reply) return { kind: 'lost-material', text: `That gives away ${loss}.` }
  const moved = f.played.slice(2, 4)
  // Taking something that turns out to be poisoned: say what the capture cost.
  const playedMove = played.moves[0]
  if (playedMove?.captured && reply.to === moved) {
    return { kind: 'lost-material', text: `Taking on ${moved} costs you ${loss}: ${reply.san} takes back.` }
  }
  const found = findTactic(theirs)
  if (found?.tactic.kind === 'undefended') {
    const { piece, square } = found.tactic
    const text =
      square === moved
        ? `Your ${NAMES[piece]} on ${moved} was left undefended: ${reply.san} just takes it.`
        : `This left your ${NAMES[piece]} on ${square} undefended: ${reply.san} takes it.`
    return { kind: 'undefended', text }
  }
  if (found) {
    const kind: ErrorKind = found.tactic.kind === 'fork' ? 'fork' : 'lost-material'
    if (found.index === 0) return { kind, text: `This allowed ${reply.san}, ${tacticNoun(found.tactic, 'your')}. It costs you ${loss}.` }
    return {
      kind,
      text: `After ${lineSan(theirs, 0, found.index)}, ${found.move.san} ${tacticVerb(found.tactic, 'your')}. It costs you ${loss}.`,
    }
  }
  const key = theirs.keyCapture
  if (key && key !== reply) return { kind: 'lost-material', text: `After ${reply.san}, ${key.san} is coming, and it costs you ${loss}.` }
  return {
    kind: 'lost-material',
    text: reply.captured ? `After ${reply.san} and the exchanges that follow, it costs you ${loss}.` : `After ${reply.san}, it costs you ${loss}.`,
  }
}

/**
 * Why the engine's move was the right one, in one line (Joseph, Sep 2026:
 * the coach should say why the best move is best, not just what it was).
 * With the engine's line it names what the move wins and how; without it,
 * only what the board shows at once.
 */
export function explainBestMove(
  fenBefore: string,
  best: string,
  bestCp: number,
  played?: string,
  bestLine?: readonly string[],
  prev?: { fen: string; move: string },
): string {
  const before = new Chess(fenBefore)
  const mover = before.turn()
  const opponent: Colour = mover === 'w' ? 'b' : 'w'
  const after = new Chess(fenBefore)
  const move = applyUci(after, best)
  if (!move) return ''
  const san = move.san

  if (after.isCheckmate()) return `${san} is checkmate.`
  const line = bestLine?.[0] === best ? bestLine : [best]
  const long = followLine(fenBefore, line, 12)
  if (long.mates && long.moves.length <= SHORT_MATE_PLIES) return `${san} starts a forced checkmate: ${lineSan(long)}.`
  if (bestCp >= MATE_THRESHOLD) return `${san} starts a forced checkmate.`

  const out = followLine(fenBefore, line)
  const recapture = recaptured(prev, best)
  if (recapture && out.net <= VALUES[recapture] + 0.5) return `${san} takes back on ${best.slice(2, 4)}.`

  // A pawn that gets through to queen, whatever it costs on the way.
  if (long.promotes === 'us') {
    if (isSacrifice(long, 0)) return `${san} is a sacrifice: after ${long.moves[1].san}, nothing stops a pawn from queening.`
    if (long.traded && !move.promotion) return `${san} forces a trade, and then nothing stops your pawn from queening.`
    return `${san}: now nothing stops the pawn from queening.`
  }

  if (out.net >= MATERIAL) {
    const gain = describeGain(out.won, out.lost, out.mixedMinors) ?? 'material'
    const found = findTactic(out)
    if (found?.tactic.kind === 'undefended' && found.index === 0) return `${san} wins their ${NAMES[found.tactic.piece]}: nothing can take it back.`
    if (found?.index === 0) return `${san} ${tacticVerb(found.tactic, 'their')}, and wins ${gain}.`
    if (found) return `${san} wins ${gain}: after ${lineSan(out, 1, found.index)}, ${found.move.san} ${tacticVerb(found.tactic, 'their')}.`
    if (isSacrifice(out, 0) && out.moves[2]) return `${san} is a sacrifice that wins ${gain}: after ${out.moves[1].san}, ${out.moves[2].san}.`
    if (move.captured) return `${san} wins ${gain}.`
    const key = out.keyCapture
    if (key && key !== out.moves[0]) return `${san} sets up ${key.san}, and wins ${gain}.`
    return `${san} wins ${gain}.`
  }

  // A sacrifice for an attack: taken at once, and the attack goes on with check.
  if (isSacrifice(out, 0) && bestCp >= WINNING_CP && out.moves[2]?.san.includes('+')) {
    return `${san} is a sacrifice to open up their king: after ${out.moves[1].san}, ${out.moves[2].san}.`
  }

  // Swapping into an ending that's won: a forcing move (capture or check),
  // and an ending is really what's left (a few pieces at most).
  if (out.traded && Math.abs(out.net) < MATERIAL && bestCp >= WINNING_CP && (move.captured || after.inCheck()) && out.piecesLeft <= ENDING_PIECES) {
    return `${san} forces a trade, and the ending that’s left is winning.`
  }

  // Saving a piece that was in trouble (and the move played didn't), if it really is safe after.
  const from = best.slice(0, 2) as Square
  const threatened = before.attackers(from, opponent)
  if (move.piece !== 'p' && move.piece !== 'k' && threatened.length > 0 && played?.slice(0, 2) !== from && !isSacrifice(out, 0)) {
    const defended = before.attackers(from, mover).length > 0
    const cheaperAttacker = threatened.some((sq) => VALUES[before.get(sq)!.type] < VALUES[move.piece])
    if (!defended || cheaperAttacker) return `${san} gets your ${NAMES[move.piece]} out of danger.`
  }

  // A capture that's simply a trade: say so, rather than listing what the
  // piece "attacks" for the one move before it's taken back.
  const reply = out.moves[1]
  if (move.captured && reply?.captured && reply.to === move.to && Math.abs(VALUES[move.captured] - VALUES[move.piece]) <= 0) {
    return `${san} swaps off their ${NAMES[move.captured]}.`
  }

  // What the move actually does: stops a threat, pins, opens a file… A check
  // comes before the minor ideas ("develops", "closer to their king").
  const ideas = moveIdeas(fenBefore, best, bestCp)
  const strong = ideas.filter((i) => /^(stops|defends your (knight|bishop|rook|queen)|threatens mate|attacks their (queen|rook|knight|bishop)|pins)/.test(i))
  if (after.inCheck() && strong.length === 0) return `${san} comes with check, so they have to deal with that first.`
  if (ideas.length) return `${san} ${joinIdeas(ideas)}.`

  if (after.inCheck()) return `${san} comes with check, so they have to deal with that first.`

  if (bestCp >= 300) return `${san} keeps you well on top.`
  if (bestCp >= 80) return `${san} keeps your advantage.`
  if (bestCp > -80) return `${san} keeps the game level.`
  return `${san} was the best defence in a difficult spot.`
}

/**
 * The coach's comment on a mistake during the coached game: what went wrong
 * (or what was missed), then what to play instead, unless the first part
 * already said it.
 */
export function coachComment(f: MistakeFacts): string {
  const why = explainMistake(f)
  if (!f.bestMove || /^You (missed|had|needed)/.test(why)) return why
  const instead = explainBestMove(f.fenBefore, f.bestMove, f.cpBefore, f.played, f.bestLine, f.prev)
  return why.endsWith('was stronger.') ? instead : `${why} Instead, ${instead}`
}

/** Why the best move of the game was good, in one line. */
export function explainGoodMove(fenBefore: string, uci: string, punished: boolean, line?: readonly string[]): string {
  const chess = new Chess(fenBefore)
  const move = applyUci(chess, uci)
  if (!move) return ''
  if (chess.isCheckmate()) return `${move.san}: checkmate.`
  const out = followLine(fenBefore, line?.[0] === uci ? line : [uci])
  const gain = out.net >= MATERIAL ? describeGain(out.won, out.lost, out.mixedMinors) : null
  if (punished) return gain ? `You punished their mistake with ${move.san}, winning ${gain}.` : `You punished their mistake with ${move.san}.`
  if (gain) {
    const found = findTactic(out)
    if (found?.tactic.kind === 'undefended' && found.index === 0) return `${move.san} won their ${NAMES[found.tactic.piece]}.`
    return found?.index === 0 ? `${move.san} ${tacticVerb(found.tactic, 'their')}, and won ${gain}.` : `${move.san} won ${gain}.`
  }
  const ideas = moveIdeas(fenBefore, uci)
  if (ideas.length) return `${move.san} ${joinIdeas(ideas)}. The strongest move on the board.`
  return `${move.san} was the strongest move in the position.`
}

// --- Wording --------------------------------------------------------------------

/** "It wins a rook: Qe8+ forks their king and rook." for a missed win. */
function winsWith(out: LineOutcome, found: FoundTactic | null, gain: string, whose: 'their'): string {
  if (!found) return `It wins ${gain}.`
  if (found.tactic.kind === 'undefended') return `It wins their ${NAMES[found.tactic.piece]}, which nothing defends.`
  if (found.index === 0) return `It ${tacticVerb(found.tactic, whose)}, and wins ${gain}.`
  return `It wins ${gain}: after ${lineSan(out, 1, found.index)}, ${found.move.san} ${tacticVerb(found.tactic, whose)}.`
}

/** The tactic as a phrase after the move ("forks their king and rook"). */
function tacticVerb(t: Tactic, whose: 'your' | 'their'): string {
  switch (t.kind) {
    case 'fork':
      return `forks ${whose} ${listOf(t.targets)}`
    case 'skewer':
      return `skewers ${whose} ${NAMES[t.front]} against the ${NAMES[t.behind]} behind it`
    case 'pin':
      return `pins ${whose} ${NAMES[t.pinned]} to ${whose} ${NAMES[t.behind]}`
    case 'discovered':
      return `uncovers an attack on ${whose} ${NAMES[t.target]}`
    case 'undefended':
      return `takes ${whose} undefended ${NAMES[t.piece]}`
    case 'defender':
      return `removes the defender of ${whose} ${NAMES[t.target]} on ${t.square}`
  }
}

/** The tactic as a noun phrase ("a fork of your queen and rook"). */
function tacticNoun(t: Tactic, whose: 'your' | 'their'): string {
  switch (t.kind) {
    case 'fork':
      return `a fork of ${whose} ${listOf(t.targets)}`
    case 'skewer':
      return `a skewer: ${whose} ${NAMES[t.front]} has to move, and the ${NAMES[t.behind]} behind it falls`
    case 'pin':
      return `pinning ${whose} ${NAMES[t.pinned]} to ${whose} ${NAMES[t.behind]}`
    case 'discovered':
      return `uncovering an attack on ${whose} ${NAMES[t.target]}`
    case 'undefended':
      return `taking ${whose} undefended ${NAMES[t.piece]}`
    case 'defender':
      return `which removes the defender of ${whose} ${NAMES[t.target]} on ${t.square}`
  }
}

/** What their last move took, when `uci` recaptures on that square. */
function recaptured(prev: { fen: string; move: string } | undefined, uci: string): PieceSymbol | null {
  if (!prev || prev.move.slice(2, 4) !== uci.slice(2, 4)) return null
  return applyUci(new Chess(prev.fen), prev.move)?.captured ?? null
}

function listOf(items: readonly PieceSymbol[]): string {
  const names = items.map((i) => NAMES[i])
  return names.length <= 2 ? names.join(' and ') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
}

function sanOf(fen: string, uci: string): string | null {
  return applyUci(new Chess(fen), uci)?.san ?? null
}

function fenAfter(fen: string, uci: string): string | null {
  const chess = new Chess(fen)
  return applyUci(chess, uci) ? chess.fen() : null
}
