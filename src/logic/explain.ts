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
  creditFor,
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
/**
 * How far a material claim may run ahead of the engine's own verdict before
 * it isn't believed (centipawns): two pawns, for positions where the material
 * comes back or there's compensation the short line doesn't show.
 */
const TRUST_MARGIN_CP = 200
/**
 * And how far it may fall short: the material must be at least this share of
 * the swing, less a pawn. Below that, it isn't why the move was bad.
 */
const UNDER_SHARE = 0.6
const UNDER_MARGIN_CP = 100
/** Not taking back is a plainer story: it only has to be this share of the swing. */
const RETAKE_SHARE = 0.45
/** Positional reasons ("you gave up castling") only for slips smaller than this. */
const POSITIONAL_MAX_CP = 200
/**
 * A best move's material win is believed if the engine's score after it is
 * no more than this far below the win (centipawns): four pawns, since you may
 * have been behind before it.
 */
const BEST_TRUST_CP = 400

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
  /**
   * What really happened next in the game, from the reply on (after the game;
   * missing during a game, when nobody knows yet). Joseph, Sep 2026: the
   * coach must never say something happened that didn't. With this, "it cost
   * you a rook" is only said if it did; otherwise "it would have… they missed it".
   */
  actual?: readonly string[]
}

/**
 * Whether the harm the engine saw really happened: 'happened' (the game went
 * that way), 'missed' (they didn't take the chance), or 'live' (during a game,
 * or the game stopped there: nobody knows yet).
 */
type Tense = 'happened' | 'missed' | 'avoided' | 'live'

/**
 * 'missed': they didn't play the key reply. 'avoided': they did, but the game
 * then went another way (you found a defence the engine's line didn't).
 */
function tenseOf(f: MistakeFacts, predictedNet: number, isMate: boolean, predictedLost: readonly PieceSymbol[] = []): Tense {
  if (!f.actual || f.actual.length === 0) return 'live'
  const real = followLine(f.fenBefore, [f.played, ...f.actual], 12)
  const sameReply = f.replyLine?.length ? f.actual[0] === f.replyLine[0] : f.actual[0] === f.reply
  if (isMate) return real.mated ? 'happened' : sameReply ? 'avoided' : 'missed'
  // A piece named as lost: did it really go? (Counted before trades cancel
  // out: "Qxc5 took your bishop" is true even if you'd taken one first.)
  const piece = predictedLost.find((p) => p !== 'p')
  if (piece) {
    if (real.takenFromUs.includes(piece)) return 'happened'
    return sameReply ? 'avoided' : 'missed'
  }
  // Only pawns: the same reply, and it really cost about that much.
  if (sameReply && real.net <= -MATERIAL && real.net <= predictedNet + 0.9) return 'happened'
  return sameReply ? 'avoided' : 'missed'
}

/** "It cost you a rook." / "…would have cost you a rook, but they missed it." / "It would cost you a rook." */
function costs(tense: Tense, loss: string): string {
  if (tense === 'happened') return `It cost you ${loss}.`
  if (tense === 'missed') return `It would have cost you ${loss}, but they missed it.`
  if (tense === 'avoided') return `That line would have cost you ${loss}. In the game it went another way.`
  return `It would cost you ${loss}.`
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
    const tense = tenseOf(f, 0, true)
    // If it happened, the mate shown is the one in the game (it may not be the engine's).
    const real = tense === 'happened' && afterFen && f.actual ? followLine(afterFen, f.actual, 12) : null
    const shown = real?.mates ? real : theirs
    const text =
      shown?.mates && shown.moves.length <= SHORT_MATE_PLIES
        ? shown.moves.length === 1
          ? `This allowed ${lineSan(shown)}, checkmate.`
          : `This allowed a forced checkmate: ${lineSan(shown)}.`
        : 'This allowed a forced checkmate.'
    const after = tense === 'missed' ? ' They missed it.' : tense === 'avoided' ? ' In the game it went another way.' : ''
    return { kind: 'allowed-mate', text: `${text}${after}` }
  }
  if (f.cpBefore >= MATE_THRESHOLD && f.cpAfter < MATE_THRESHOLD && bestSan) {
    const ours = f.bestLine ? followLine(f.fenBefore, f.bestLine, 12) : null
    const text =
      ours?.mates && ours.moves.length <= SHORT_MATE_PLIES && ours.moves.length > 1
        ? `You had a forced checkmate: ${lineSan(ours)}.`
        : `You had a forced checkmate, starting with ${bestSan}.`
    return { kind: 'missed-mate', text }
  }

  // The engine's verdict is the judge (Joseph, Sep 2026: a "fork" that didn't
  // work, because taking would have run into the queen behind; "punished their
  // mistake" for castling). A material story must roughly match how much the
  // move actually cost by the evaluation: not much bigger (the short line
  // isn't the real story; there's a catch it doesn't show), and not much
  // smaller (then it isn't why the move was bad, even if it's true).
  const drop = Math.max(0, f.cpBefore - f.cpAfter)
  const matesAround = f.cpAfter <= -MATE_THRESHOLD || f.cpBefore >= MATE_THRESHOLD
  // (Not much smaller: the material has to be a good part of the swing; a big
  // swing also carries position, so this scales with it.)
  const accounts = (pawns: number, share = UNDER_SHARE) =>
    matesAround || (pawns * 100 <= drop + TRUST_MARGIN_CP && pawns * 100 >= drop * share - UNDER_MARGIN_CP)

  // Taking back, but with the wrong piece: both moves take on the same square,
  // so neither "missed" anything (Sep 2026: "You missed Bxf6. It wins their
  // bishop" when gxf6 had taken it too).
  const playedMove = applyUci(new Chess(f.fenBefore), f.played)
  const sameSquare = !!f.bestMove && !!playedMove?.captured && f.played.slice(2, 4) === f.bestMove.slice(2, 4) && f.played !== f.bestMove

  // They had just taken something, and the move played didn't take back
  // (only if that's really the size of it: not the story of a much bigger blunder).
  const retaken = f.bestMove ? recaptured(f.prev, f.bestMove) : null
  const couldRetake = !!f.bestMove && !!bestSan && !!retaken && f.played.slice(2, 4) !== f.bestMove.slice(2, 4)
  const needed = couldRetake ? `You needed to take back on ${f.bestMove!.slice(2, 4)} with ${bestSan}.` : ''
  if (couldRetake && accounts(VALUES[retaken!], RETAKE_SHARE)) return { kind: 'missed-win', text: needed }

  // Material: what the move and their best line cost, against what the best line keeps.
  const bestOutcome = f.bestMove ? followLine(f.fenBefore, f.bestLine?.[0] === f.bestMove ? f.bestLine : [f.bestMove]) : null
  const keeps = bestOutcome ? bestOutcome.net : 0
  const played = replyLine ? followLine(f.fenBefore, [f.played, ...replyLine]) : null
  // (Their line is from their side: "us" there means them.)
  if (theirs?.promotes === 'us' && (!bestOutcome || bestOutcome.promotes !== 'them')) {
    const real = f.actual?.length && afterFen ? followLine(afterFen, f.actual, 12) : null
    const text = !real
      ? `It allows ${theirs.moves[0].san}, and then nothing stops their pawn from queening.`
      : real.promotes === 'us'
        ? `After ${theirs.moves[0].san}, nothing could stop their pawn from queening.`
        : `It allowed ${theirs.moves[0].san}, and a pawn of theirs that couldn’t be stopped. In the game it went another way.`
    return { kind: 'lost-material', text }
  }
  // A missed win comes first when it's the bigger part of the story (Sep 2026:
  // "it would have cost you a pawn" when the real point was a rook there for the taking).
  const missedWin = (): { kind: ErrorKind; text: string } | null => {
    if (!bestOutcome || !bestSan || !f.bestMove) return null
    const playedNet = played ? played.net : 0
    if (bestOutcome.net < MATERIAL || bestOutcome.net <= playedNet + 0.9 || !accounts(bestOutcome.net - playedNet)) return null
    const gain = describeGain(bestOutcome.won, bestOutcome.lost, bestOutcome.mixedMinors) ?? 'material'
    return { kind: 'missed-win', text: `You missed ${bestSan}. ${winsWith(bestOutcome, findTactic(bestOutcome), gain, 'their')}` }
  }
  const lossBig = played ? -played.net : 0
  if (bestOutcome && bestOutcome.net > lossBig && !sameSquare) {
    const first = missedWin()
    if (first) return first
  }
  if (played && replyLine && afterFen && played.net <= -MATERIAL && played.net < keeps - 0.9 && accounts(keeps - played.net)) {
    return lossSentence(f, played, followLine(afterFen, replyLine), bestOutcome)
  }

  // Took on the right square with the wrong piece: nothing was "missed".
  if (sameSquare && bestSan) {
    const harm = drop < POSITIONAL_MAX_CP ? positionalHarm(f.fenBefore, f.played, f.cpBefore) : null
    return { kind: harm?.kind ?? 'positional', text: `Right square, wrong piece: ${bestSan} was the better way to take.${harm ? ` ${harm.text}` : ''}` }
  }

  // What the player could have won instead.
  const missed = sameSquare ? null : missedWin()
  if (missed) return missed

  // Nothing tactical: what the move did to the position, if it's something to
  // name. Only for smaller slips: a big swing is never "you gave up castling".
  const harm = drop < POSITIONAL_MAX_CP ? positionalHarm(f.fenBefore, f.played, f.cpBefore) : null
  if (harm) return { kind: harm.kind, text: harm.text }
  // Otherwise, what their best reply does to you (Sep 2026: "Nxd4 was
  // stronger" said nothing; "It allowed Qg5, which attacks your knight" does).
  const reply = theirs?.moves[0]
  // (Not when their reply is simply a trade: "Qxd1+ attacks your bishop"
  // would miss that it's the queens coming off.)
  const trade = reply?.captured && theirs?.moves[1]?.captured && theirs.moves[1].to === reply.to
  if (reply && afterFen && !trade) {
    // Threats worth naming: mate, a pin, or an attack on a piece (not just a pawn:
    // "attacks your pawn on h7" was standing in for the real point).
    const threat = moveIdeas(afterFen, reply.lan).filter((i) =>
      /^(threatens mate|pins their|(attacks|uncovers an attack on) their (queen|rook|bishop|knight))/.test(i),
    )
    if (threat.length) {
      const text = `It allowed ${reply.san}, which ${joinIdeas(threat.map(fromTheirSide))}.`
      return { kind: 'positional', text: needed ? `${needed} Instead, ${lower(text)}` : text }
    }
  }
  // A big swing with nothing to point at in the first few moves: name their
  // best reply (as a possibility: they may not have played it), and say what
  // the swing did, in words that match the engine's verdict.
  if (reply && drop >= BIG_DROP) {
    const where =
      f.cpAfter >= 100
        ? 'you’re still better, but a lot of your advantage has gone'
        : f.cpAfter > -100
          ? f.cpBefore >= 100
            ? 'your advantage is gone'
            : 'the position swings their way'
          : 'your position gets much harder'
    const text = `It allowed ${reply.san}, and from there ${where}.`
    return { kind: 'positional', text: needed ? `${needed} Instead, ${lower(text)}` : text }
  }
  if (needed) return { kind: 'missed-win', text: needed }
  return { kind: 'positional', text: bestSan ? `${bestSan} was stronger.` : 'There was a stronger move here.' }
}

/** Turns one of their ideas round to your side ("attacks their knight" → "attacks your knight"). */
function fromTheirSide(idea: string): string {
  return idea.replace(/\btheir\b/g, 'your')
}

/** Why the move played lost material, naming the tactic when the line proves one. */
function lossSentence(f: MistakeFacts, played: LineOutcome, theirs: LineOutcome, best: LineOutcome | null): { kind: ErrorKind; text: string } {
  // What this move cost compared with the best one: material the best line
  // would have given up too isn't blamed on this move (Sep 2026: "it cost you
  // a rook and a knight" when the knight was going anyway).
  const lost = without(played.lost, best?.lost ?? [])
  const won = without(played.won, best?.won ?? [])
  const loss = describeGain(lost, won, played.mixedMinors) ?? describeGain(played.lost, played.won, played.mixedMinors) ?? 'material'
  const reply = theirs.moves[0]
  // Only say it happened if it did (Joseph, Sep 2026). And worded "cost you",
  // never "you lose": a beginner who'd won read "you lost material" as "you lost".
  const tense = tenseOf(f, played.net, false, played.lost)
  if (!reply) return { kind: 'lost-material', text: costs(tense, loss) }
  const moved = f.played.slice(2, 4)
  // Taking something that turns out to be poisoned: say what the capture cost.
  const playedMove = played.moves[0]
  if (playedMove?.captured && reply.to === moved) {
    const text =
      tense === 'happened'
        ? `Taking on ${moved} cost you ${loss}: ${takenBy(f, moved) ?? reply.san} took back.`
        : tense === 'missed'
          ? `Taking on ${moved} could have cost you ${loss}: ${reply.san} takes back. They didn’t.`
          : tense === 'avoided'
            ? `Taking on ${moved} could have cost you ${loss} after ${reply.san}. In the game it went another way.`
            : `Taking on ${moved} would cost you ${loss}: ${reply.san} takes back.`
    return { kind: 'lost-material', text }
  }
  const found = findTactic(theirs)
  if (found?.tactic.kind === 'undefended') {
    const { piece, square } = found.tactic
    const where = square === moved ? `Your ${NAMES[piece]} on ${moved} was left undefended` : `This left your ${NAMES[piece]} on ${square} undefended`
    const then =
      tense === 'happened'
        ? `, and ${takenBy(f, square) ?? reply.san} took it.`
        : tense === 'missed'
          ? `: ${reply.san} would have taken it, but they missed it.`
          : tense === 'avoided'
            ? `: ${reply.san} could take it. In the game it went another way.`
            : `: ${reply.san} just takes it.`
    return { kind: 'undefended', text: `${where}${then}` }
  }
  if (found) {
    const kind: ErrorKind = found.tactic.kind === 'fork' ? 'fork' : 'lost-material'
    if (found.index === 0) return { kind, text: `This allowed ${reply.san}, ${tacticNoun(found.tactic, 'your')}. ${costs(tense, loss)}` }
    return {
      kind,
      text: `It allowed ${lineSan(theirs, 0, found.index)}, and then ${found.move.san} ${tacticVerb(found.tactic, 'your')}. ${costs(tense, loss)}`,
    }
  }
  const key = theirs.keyCapture
  if (key && key !== reply) return { kind: 'lost-material', text: `It allowed ${reply.san}, and then ${key.san}. ${costs(tense, loss)}` }
  return { kind: 'lost-material', text: `It allowed ${reply.san}${reply.captured ? ' and the exchanges after it' : ''}. ${costs(tense, loss)}` }
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
  /** The score after the move actually played (mover's view), when known: the same judge as explainMistake. */
  playedCp?: number,
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

  // (Only if the engine's score for the position backs it up: a line that
  // "wins a rook" when the engine says you're barely better has a catch.)
  // (When the move played is known, a win that matches what it cost is
  // believed too: you may have been behind, and this wins it back.)
  const trusted = out.net * 100 <= bestCp + BEST_TRUST_CP || (playedCp !== undefined && out.net * 100 <= bestCp - playedCp + TRUST_MARGIN_CP)
  if (out.net >= MATERIAL && trusted) {
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
  const instead = explainBestMove(f.fenBefore, f.bestMove, f.cpBefore, f.played, f.bestLine, f.prev, f.cpAfter)
  return why.endsWith('was stronger.') ? instead : `${why} Instead, ${instead}`
}

/**
 * Why the best move of the game was good, in one line. `actual` is what
 * really happened from this move on, in the game. Joseph, Sep 2026: a
 * tester's review said a move "won the queen and a bishop for a rook" when
 * the game never went that way. So what it won is taken from the game
 * itself; the engine's follow-up is only ever offered as "could have".
 */
export function explainGoodMove(fenBefore: string, uci: string, punished: boolean, line?: readonly string[], actual?: readonly string[]): string {
  const chess = new Chess(fenBefore)
  const move = applyUci(chess, uci)
  if (!move) return ''
  if (chess.isCheckmate()) return `${move.san}: checkmate.`

  // What really happened in the game. "Punished" is only said when the move
  // really took advantage (Joseph, Sep 2026: it was said about castling).
  const real = actual?.[0] === uci ? creditFor(fenBefore, actual) : null
  if (real?.mates) return punished ? `You punished their mistake with ${move.san}, and it led to checkmate.` : `${move.san} led to checkmate.`
  const realGain = real && real.net >= MATERIAL ? describeGain(real.won, real.lost, real.mixedMinors) : null
  if (realGain) {
    const found = findTactic(real!)
    if (punished) return `You punished their mistake with ${move.san}, and won ${realGain}.`
    if (found?.tactic.kind === 'undefended' && found.index === 0) return `${move.san} won their ${NAMES[found.tactic.piece]}.`
    return found?.index === 0 ? `${move.san} ${tacticVerb(found.tactic, 'their')}, and won ${realGain}.` : `${move.san} won ${realGain}.`
  }

  // What the engine saw it could win, if the game didn't (or wasn't known).
  const out = followLine(fenBefore, line?.[0] === uci ? line : [uci])
  const gain = out.net >= MATERIAL ? describeGain(out.won, out.lost, out.mixedMinors) : null
  if (gain) {
    const key = out.keyCapture && out.keyCapture !== out.moves[0] ? ` The follow-up was ${out.keyCapture.san}.` : ''
    const could = real ? `Followed up properly, it wins ${gain}.${key}` : `It wins ${gain}.${key}`
    return `${move.san} was the strongest move on the board. ${could}`
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

/**
 * The move in the game that really took on `square` (their move, in notation),
 * so "took back" names what happened, not the engine's choice (Sep 2026:
 * "exd6 took back" when the queen had).
 */
function takenBy(f: MistakeFacts, square: string): string | null {
  if (!f.actual?.length) return null
  const chess = new Chess(f.fenBefore)
  if (!applyUci(chess, f.played)) return null
  const them = chess.turn()
  for (const uci of f.actual.slice(0, 6)) {
    const m = applyUci(chess, uci)
    if (!m) return null
    if (m.color === them && m.captured && m.to === square) return m.san
  }
  return null
}

/** "It allowed…" → "it allowed…", for joining sentences. */
function lower(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1)
}

/** `pieces` with each of `remove` taken out once (a multiset difference). */
function without(pieces: readonly PieceSymbol[], remove: readonly PieceSymbol[]): PieceSymbol[] {
  const left = [...pieces]
  for (const p of remove) {
    const i = left.indexOf(p)
    if (i >= 0) left.splice(i, 1)
  }
  return left
}

/** "king and rook", "king, queen and rook", and "both rooks" rather than "rook and rook". */
function listOf(items: readonly PieceSymbol[]): string {
  if (items.length === 2 && items[0] === items[1]) return `two ${NAMES[items[0]]}s`
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
