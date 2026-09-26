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
  backRankMate: 'Watch: the king is shut in by its own pawns, and the back rank is open.',
  capturingDefender: 'Watch: the defender goes, and what it was guarding goes with it.',
  pawnEndgame: 'Watch: every tempo counts. The king leads the way.',
  deflection: 'Watch: a defender is pulled away, and the square it guarded is left open.',
  trappedPiece: 'Watch: the piece has nowhere left to go.',
  rookEndgame: 'Watch: the active rook, behind the passed pawn, does the work.',
  // Act 2 lessons
  defensiveMove: 'Watch: the threat is met first. Only then is there time for anything else.',
  intermezzo: 'Watch: instead of the obvious recapture, an in-between move that changes everything.',
  attraction: 'Watch: a piece is lured onto a square where it can be hit.',
  zugzwang: 'Watch: any move they make makes things worse. Waiting is the winning move.',
  xRayAttack: 'Watch: the attack goes straight through one piece to the square behind it.',
  advancedPawn: 'Watch: the far-advanced pawn is worth more than it looks.',
  promotion: 'Watch: the pawn reaches the end and becomes a queen.',
  exposedKing: 'Watch: a king with no cover, and the pieces that find it.',
  clearance: 'Watch: a piece gets out of the way, so another can use its square or line.',
  mateIn3: 'Watch: three forcing moves, and nowhere left to hide.',
  smotheredMate: 'Watch: the king is boxed in by its own pieces, and a knight finishes it.',
}

export function themeCaption(themes: readonly string[]): string {
  for (const t of themes) if (THEME_CAPTIONS[t]) return THEME_CAPTIONS[t]
  return 'Watch how it works.'
}
