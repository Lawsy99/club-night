// How each opening family is recognised from a game's first moves, used by
// dialogue (plan hints follow the opening on the board), stats, and Toby's
// targeting.

/**
 * Recognises the opening from the game's first moves (in ordinary notation).
 * `*` matches any single move. The first pattern that matches wins, so the
 * specific ones come first.
 */
export const OPENING_PATTERNS: [key: string, pattern: string[]][] = [
  ['gambit', ['e4', 'e5', 'Nf3', 'Nf6', 'Nxe5', 'Nc6']], // Stafford
  ['gambit', ['d4', 'e5']], // Englund
  ['gambit', ['e4', 'e5', 'f4']], // King's Gambit
  ['gambit', ['e4', 'e5', 'd4', 'exd4', 'c3']], // Danish
  ['exchange', ['e4', 'e6', 'd4', 'd5', 'exd5']],
  ['exchange', ['e4', 'c6', 'd4', 'd5', 'exd5']],
  ['exchange', ['d4', 'd5', 'c4', 'c6', 'cxd5']],
  ['exchange', ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Bxc6']],
  ['exchange', ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'Nf6', 'O-O', 'Nxe4']], // Berlin
  ['ruy-lopez', ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5']],
  ['italian', ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4']],
  ['petroff', ['e4', 'e5', 'Nf3', 'Nf6']],
  ['french', ['e4', 'e6']],
  ['caro-kann', ['e4', 'c6']],
  ['sicilian', ['e4', 'c5']],
  ['london', ['d4', '*', 'Bf4']],
  ['catalan', ['d4', '*', 'c4', 'e6', 'g3']],
  ['nimzo', ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4']],
  ['kid', ['d4', 'Nf6', 'c4', 'g6']],
  ['kid', ['d4', 'Nf6', 'Nf3', 'g6']],
  ['qgd', ['d4', 'd5', 'c4', 'e6']],
  ['qgd', ['d4', 'Nf6', 'c4', 'e6', 'Nf3', 'd5']],
  ['qgd', ['d4', 'd5', 'Nf3', 'Nf6', 'c4', 'e6']],
]
