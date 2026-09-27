// "Prep: {name}" (Act 2, the study Toby sends you by mistake): Pemberton's
// notes on how to beat you, written for Toby, built from your real games.
// It should read as a betrayal and still be the most useful thing anyone has
// told you. Pemberton's voice: confident, clipped, sound advice. Third person.
import type { ErrorKind } from '../logic/explain'
import type { Phase } from '../logic/stats'

/** The week whose way out ("Sending you my study, mate") is followed by the study. */
export const STUDY_WEEK = 'a2-9'

/** How to exploit each habit. */
export const STUDY_HABITS: Record<ErrorKind, string> = {
  undefended: 'Leaves pieces loose. Keep asking questions; something will drop.',
  fork: 'Doesn’t see forks coming. Get a knight into the middle and wait.',
  'lost-material': 'Miscounts exchanges. Offer trades on busy squares and let them start it.',
  'allowed-mate': 'Forgets their king once the queens are on. Keep the queens on and look for checks.',
  'missed-mate': 'Misses mates. Their attacks run out of steam just before the end, so defend, and wait.',
  'missed-win': 'Doesn’t take what’s offered. You can afford to be loose for a move or two.',
  positional: 'Drifts when there’s nothing to calculate. Keep it slow. They’ll find something to do, and it’ll be wrong.',
  'king-weakened': 'Pushes the pawns in front of their own king. Wait for it, then go for the king.',
  'doubled-pawns': 'Takes back the wrong way. Offer swaps that leave them the choice.',
  'isolated-pawn': 'Ends up with isolated pawns. Blockade the pawn and win it in the ending.',
  'bishop-pair': 'Gives up bishops for knights. Keep the position open and use the pair.',
  'traded-behind': 'Swaps pieces when behind. Win a pawn and they’ll trade into a lost ending for you.',
  'early-queen': 'Brings the queen out early. Develop with gain of time against it.',
  'lost-castling': 'Loses the right to castle. Open the centre.',
  'same-piece-twice': 'Wastes time in the opening. Develop quickly and open the centre.',
}

/** Where they're weakest, and what to do about it. */
export const STUDY_PHASES: Record<Phase, string> = {
  opening: 'Weakest in the first ten moves. Get something early and keep it.',
  middlegame: 'Fine in the opening, fine in the ending. Lost in the middle. Keep the pieces on.',
  endgame: 'Goes to pieces in the ending. Trade down whenever it’s level.',
}

export const STUDY_TEXT = {
  kicker: 'Lichess study · shared by Toby',
  openings: 'Openings',
  habits: 'Habits',
  phases: 'Where it goes wrong',
  night: 'On the night',
  /** An opening they play a lot and score badly in. */
  weakOpening: (colour: string, name: string, played: number, pct: number) =>
    `As ${colour}, ${name} (${played} games, ${pct}%). Go straight into it. They know the moves, not the ideas.`,
  /** An opening they play a lot and score well in. */
  strongOpening: (colour: string, name: string, played: number, pct: number) =>
    `As ${colour}, ${name} (${played} games, ${pct}%). They know it. Get them out of it early: a sideline on move three.`,
  noOpenings: 'No settled openings yet. Play something solid and wait for them to go wrong.',
  habitSeen: (games: number, of: number) => `Seen in ${games} of their last ${of} games.`,
  noReviews: 'Doesn’t go over their games. It shows.',
  noHabit: 'No mistake they keep making. Unusual at this level. Make it long and wait.',
  noPhases: 'Not enough to go on yet. Watch a game or two.',
  steady: 'Steady in every part of the game. Don’t expect a collapse; grind.',
  onTheNight: 'Be friendly. Offer to go over games. They play worse when they like you.',
  signOff: 'Keep this to yourself. P.',
}
