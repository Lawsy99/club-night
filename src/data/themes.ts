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

/**
 * How to spot each theme at the board: Pemberton's rule of thumb, shown
 * before the puzzles and at the end of the lesson (Sep 2026).
 */
export const THEME_TIPS: Record<string, string> = {
  fork: 'Look for a square where one of your pieces would attack two of theirs. Knights first.',
  pin: 'Find their king or queen, then look along the lines to it. Anything in the way can be pinned.',
  skewer: 'Check the lines through their king and queen. Is something standing behind them?',
  discoveredAttack: 'Where are your pieces lined up behind one another? Moving the front one can unleash the back one.',
  mateIn1: 'Checks first. For each check, count the king’s escape squares.',
  mateIn2: 'Look at every check, and the reply to it. The quiet move is often the second one.',
  mateIn3: 'Checks, captures, threats, in that order, three moves deep.',
  kingsideAttack: 'Count attackers against defenders around the king. When you have more, it’s time.',
  quietMove: 'If no check or capture works, ask what their pieces are guarding, and take the guard away quietly.',
  hangingPiece: 'Before every move: what of theirs is undefended? What of yours?',
  sacrifice: 'Count what you get back: a mate, their queen, or a winning pawn. Not just an attack.',
  backRankMate: 'A king behind three unmoved pawns has no escape. Check the back rank, for them and for you.',
  capturingDefender: 'Find the piece doing the defending. Take it, and what it guarded falls.',
  pawnEndgame: 'Count the moves: yours to queen, theirs to catch you. The king goes in front.',
  deflection: 'If one piece guards two things, pull it away from one of them.',
  trappedPiece: 'Look for a piece with no safe squares, then attack it.',
  rookEndgame: 'Active rook, behind the passed pawn, and bring the king.',
  defensiveMove: 'Ask what they’re threatening before you think about your own plan.',
  intermezzo: 'Before the obvious recapture: is there a check or a threat that comes first?',
  attraction: 'Can you lure their king or queen onto a square where it can be hit?',
  zugzwang: 'Sometimes the best move is one that changes nothing, so they have to move.',
  xRayAttack: 'Look along the whole line, through the pieces on it.',
  advancedPawn: 'A pawn on the sixth or seventh is worth a lot. Push it, and back it up.',
  promotion: 'Clear the square in front of the pawn, then push.',
  exposedKing: 'A king without pawns in front: checks from a distance, then bring more pieces.',
  clearance: 'Is one of your pieces in the way of another? Move it with a threat.',
  smotheredMate: 'The king surrounded by its own pieces: a knight check can be mate.',
}

export function themeTip(themes: readonly string[]): string | null {
  for (const t of themes) if (THEME_TIPS[t]) return THEME_TIPS[t]
  return null
}

export function themeCaption(themes: readonly string[]): string {
  for (const t of themes) if (THEME_CAPTIONS[t]) return THEME_CAPTIONS[t]
  return 'Watch how it works.'
}
