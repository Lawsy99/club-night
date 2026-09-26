// Board colours (Settings: "board style"). Shared through React context so
// every board in the app (games, reviews, lessons, the deck) follows the
// player's choice without each screen passing it down.
import { createContext, useContext } from 'react'

export type BoardThemeId = 'club' | 'wood' | 'slate'

export const BOARD_THEMES: Record<BoardThemeId, { label: string; light: string; dark: string }> = {
  club: { label: 'Club green', light: '#ece4cf', dark: '#86a07a' },
  wood: { label: 'Wood', light: '#f0d9b5', dark: '#b58863' },
  slate: { label: 'Slate', light: '#dee3e6', dark: '#8ca2ad' },
}

export const BoardThemeContext = createContext<BoardThemeId>('club')

export function useBoardColours() {
  return BOARD_THEMES[useContext(BoardThemeContext)] ?? BOARD_THEMES.club
}
