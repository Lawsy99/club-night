// After a game the player didn't review, check it quietly in the background
// and keep its real errors as Tuesday warm-ups, so there are always fresh
// positions the player has never looked at again (Joseph, Sep 2026). The
// engine does one position at a time, so the opponent's moves in the next
// game are never held up for more than a moment.
import type { GameRecord } from '../logic/gameRecord'
import { cardsFromMoments, gameMoments } from '../logic/mistakeCards'
import { addCardsIfNew, getArchivedGame, saveGameAnalysis } from '../storage/db'
import { analyseGame } from './reviewAnalysis'

const running = new Set<string>()

export async function collectMistakes(game: GameRecord): Promise<void> {
  if (running.has(game.id) || game.moves.length < 10) return
  running.add(game.id)
  try {
    const saved = await getArchivedGame(game.id)
    // Already analysed (reviewed): its errors were collected then.
    if (saved?.evals?.length === game.moves.length + 1) return
    const evals = await analyseGame(game.moves, () => undefined, () => false)
    if (!evals) return
    await saveGameAnalysis(game.id, evals)
    const cards = cardsFromMoments(game, gameMoments(game.moves, evals, game.playerColour))
    if (cards.length) await addCardsIfNew(cards)
  } finally {
    running.delete(game.id)
  }
}
