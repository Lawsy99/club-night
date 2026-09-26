// Board colours (Settings: "board style"). Shared through React context so
// every board in the app (games, reviews, lessons, the deck) follows the
// player's choice without each screen passing it down.
import { createContext, useContext } from 'react'

/** 'club' is the roll-up vinyl mat real clubs use (the default); older saves may still say 'club'. */
export type BoardThemeId = 'club' | 'wood' | 'slate'

export const BOARD_THEMES: Record<BoardThemeId, { label: string; light: string; dark: string; frame: string }> = {
  club: { label: 'Club mat', light: '#f3edd3', dark: '#3f6b4b', frame: '#f3edd3' },
  wood: { label: 'Wood', light: '#f0d9b5', dark: '#b58863', frame: '#6b4a2b' },
  slate: { label: 'Slate', light: '#dee3e6', dark: '#8ca2ad', frame: '#4d5f6a' },
}

export const BoardThemeContext = createContext<BoardThemeId>('club')

export function useBoardColours() {
  return BOARD_THEMES[useContext(BoardThemeContext)] ?? BOARD_THEMES.club
}
