// A game's biggest moments (for the review) and the warm-up positions made
// from them. Pure: the review screen and the background check after a game
// both use it, so they always agree.
import { explainMistake } from './explain'
import { replay, type Colour } from './game'
import type { GameRecord } from './gameRecord'
import { MAX_CARDS_PER_GAME, newCard, qualifiesForDeck, type MistakeCard } from './mistakesDeck'
import type { Moment } from './moment'
import { RATING_GLYPHS, type MoveRating } from './moveRating'
import { biggestMoments, reviewMoves, type PositionEval, type ReviewedMove } from './review'

export type ReviewMoment = Moment & { ply: number; rating: MoveRating; moveLabel: string }

/** The player's biggest moments in a game, ready to retry. */
export function gameMoments(moves: readonly string[], evals: readonly PositionEval[], player: Colour): ReviewMoment[] {
  const reviewed = reviewMoves(moves, evals)
  return biggestMoments(reviewed, player).map((m) => withLeadUp(toMoment(m, evals, player), moves, m.ply))
}

/** Adds the opponent's move just before (and the position before that), for context. */
export function withLeadUp<M extends Moment>(moment: M, moves: readonly string[], ply: number): M {
  if (ply < 1 || moment.prevMove) return moment
  return { ...moment, prevMove: moves[ply - 1], prevFen: replay(moves.slice(0, ply - 1)).fen() }
}

/** Warm-up cards from a game: its real errors, blunders first, a few at most. */
export function cardsFromMoments(game: Pick<GameRecord, 'id'>, moments: readonly ReviewMoment[]): MistakeCard[] {
  const severity = (m: ReviewMoment) => (m.rating === 'blunder' ? 2 : 1)
  return moments
    .filter((m) => qualifiesForDeck(m.rating))
    .sort((a, b) => severity(b) - severity(a))
    .slice(0, MAX_CARDS_PER_GAME)
    .map((m) => newCard(m, { gameId: game.id, ply: m.ply, rating: m.rating, moveLabel: m.moveLabel }))
}

/** The card id for a game's moment (so a moment retried in the review can be retired). */
export const cardId = (gameId: string, ply: number) => `${gameId}:${ply}`

function toMoment(m: ReviewedMove, evals: readonly PositionEval[], player: Colour): ReviewMoment {
  const forPlayer = (cp: number) => (player === 'w' ? cp : -cp)
  const cpBefore = forPlayer(evals[m.ply].cp)
  const cpAfter = forPlayer(evals[m.ply + 1].cp)
  // Before the opponent's last move, from the player's side.
  const cpEarlier = m.ply > 0 ? forPlayer(evals[m.ply - 1].cp) : 0
  return {
    kind: isMissedChance(cpEarlier, cpBefore) ? 'missed' : 'mistake',
    fenBefore: m.fenBefore,
    playerColour: player,
    played: m.uci,
    playedSan: m.san,
    bestMove: m.bestMove ?? m.uci,
    bestCp: cpBefore,
    explanation: explainMistake({
      fenBefore: m.fenBefore,
      played: m.uci,
      bestMove: m.bestMove,
      reply: evals[m.ply + 1].bestMove,
      cpBefore,
      cpAfter,
    }),
    ply: m.ply,
    rating: m.rating,
    moveLabel: moveLabel(m),
  }
}

/**
 * A missed chance: the opponent's last move handed over a real advantage
 * (two pawns or more, from a position that wasn't already winning), and the
 * player's reply let it go.
 */
export function isMissedChance(cpBeforeTheirMove: number, cpBeforeYourMove: number): boolean {
  return cpBeforeYourMove >= 200 && cpBeforeYourMove - cpBeforeTheirMove >= 200 && cpBeforeTheirMove < 150
}

/** "14. Bxf7??" or "14… Nf6", with the usual annotation mark. */
export function moveLabel(m: ReviewedMove): string {
  const number = Math.floor(m.ply / 2) + 1
  const san = m.san + RATING_GLYPHS[m.rating]
  return m.mover === 'w' ? `${number}. ${san}` : `${number}… ${san}`
}
