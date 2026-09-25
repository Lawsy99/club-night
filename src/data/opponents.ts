// One way to describe whoever the player faces: a club character (strength
// from the act baseline plus their offset) or a plain practice level.
import { characterRating, findCharacter, type Character } from './characters'
import { findLevel } from './testOpponents'

export type Opponent = {
  id: string
  name: string
  rating: number
  /** Below 800 the custom mistake-model bot plays; from 800 up, Maia-3. */
  engine: 'bot' | 'maia'
  character?: Character
}

/** Maia-3 takes over from here (design document, "Which engine plays"). */
export const MAIA_FROM = 800

/** Until ratings arrive (phase 4), the test screen sets a stand-in baseline. */
export const DEFAULT_BASELINE = 1000

const CHARACTER_PREFIX = 'char:'

export const characterOpponentId = (characterId: string) => CHARACTER_PREFIX + characterId

/**
 * Works out the opponent for a game. `rating` is the strength saved with the
 * game when it started, so a character's rating never shifts mid-game.
 */
export function resolveOpponent(opponentId: string, rating?: number): Opponent {
  if (opponentId.startsWith(CHARACTER_PREFIX)) {
    const character = findCharacter(opponentId.slice(CHARACTER_PREFIX.length))
    if (character) {
      const r = rating ?? characterRating(character, DEFAULT_BASELINE)
      return { id: opponentId, name: character.name, rating: r, engine: r < MAIA_FROM ? 'bot' : 'maia', character }
    }
  }
  const level = findLevel(opponentId)
  return { id: level.id, name: level.label, rating: level.rating, engine: level.engine }
}
