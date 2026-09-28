// The player's settings (design document, "Chatter setting" and "Screens").

/**
 * Full: everything. Quiet: lines before and after the game only.
 * Off: story beats only.
 */
export type Chatter = 'full' | 'quiet' | 'off'

export type Settings = {
  chatter: Chatter
  /** A click for each move. */
  sound: boolean
  /** Board colours: see components/boardTheme.ts. */
  board: 'club' | 'wood' | 'slate'
  /**
   * Full help in every game (Joseph, Sep 2026): unlimited hints and takebacks,
   * the evaluation bar and move ratings. Before each must-win game Pemberton
   * asks whether you want it; games won with it move the story on but don't
   * change the rating.
   */
  unlimitedHelp?: boolean
  /** A tick and a cross before each move is played (Joseph, Sep 2026, as on chess.com). On unless turned off. */
  confirmMoves?: boolean
}

export const DEFAULT_SETTINGS: Settings = { chatter: 'full', sound: true, board: 'club', unlimitedHelp: false, confirmMoves: true }

export const CHATTER_OPTIONS: { value: Chatter; label: string; detail: string }[] = [
  { value: 'full', label: 'Full', detail: 'Lines before, during and after games.' },
  { value: 'quiet', label: 'Quiet', detail: 'Before and after the game only.' },
  { value: 'off', label: 'Off', detail: 'Story moments only.' },
]
