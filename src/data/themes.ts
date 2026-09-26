// Plain-English captions for puzzle themes, shown while an example puzzle
// plays itself out ("Watch: …"). Lichess theme names as keys.

export const THEME_CAPTIONS: Record<string, string> = {
  fork: 'Watch: one piece attacks two at once, and only one can be saved.',
  pin: "Watch: a piece can't move without exposing something more valuable behind it.",
  skewer: 'Watch: the valuable piece has to move, and the one behind it falls.',
  discoveredAttack: 'Watch: one piece steps aside, and the piece behind it strikes.',
  mateIn1: 'Watch: the king has nowhere left to go.',
  mateIn2: 'Watch: a forcing move first, then the king has nowhere left to go.',
  kingsideAttack: 'Watch: the pieces pile in on the king.',
  quietMove: 'Watch: no capture, no check, just a quiet move that wins.',
  hangingPiece: 'Watch: an undefended piece, simply taken.',
  sacrifice: 'Watch: something given up now, for much more later.',
}

export function themeCaption(themes: readonly string[]): string {
  for (const t of themes) if (THEME_CAPTIONS[t]) return THEME_CAPTIONS[t]
  return 'Watch how it works.'
}
