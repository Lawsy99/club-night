// Act 1 lessons (design document, "Lessons"; revised Sep 2026, Joseph's
// feedback: "just a line or two related to whatever the puzzles are about").
// Each lesson: one or two lines from Coach Pemberton, then a real puzzle from
// the character's opening played out on the board as the example, then a few
// more of the same kind to solve. Puzzles come from games in that opening AND
// share the theme, so the lesson and the puzzles always match. Difficulty
// follows the player's puzzle rating.

export type Lesson = {
  /** Matches the week's id in act1.ts (c1 to c7 story weeks, w3 and so on club weeks). */
  id: string
  title: string
  /** One or two short lines, about exactly what the puzzles will test. */
  intro: string
  /** Opening families the puzzles come from (see scripts/buildPuzzles.mjs). */
  openings?: string[]
  /** Lichess puzzle themes (see data/themes.ts for their plain-English names). */
  themes: string[]
  /** Puzzles to solve after the example. */
  count: number
}

export const LESSONS: Lesson[] = [
  {
    id: 'c1',
    title: 'Forks in the London',
    intro: "Marjorie's London looks tidy, but a knight jumping into the middle can hit two things at once. Spot the forks.",
    openings: ['london'],
    themes: ['fork'],
    count: 4,
  },
  {
    id: 'c2',
    title: 'Punishing a gambit',
    intro: 'Gambits open lines to the king, on both sides. When he overreaches, look for a quick mate.',
    openings: ['stafford', 'englund', 'kings-gambit', 'danish'],
    themes: ['mateIn1', 'mateIn2'],
    count: 4,
  },
  {
    id: 'c3',
    title: 'Attacks in the Italian',
    intro: 'Italian games turn on the kingside quickly. Toby found one of these last week. Learn what the attack looks like.',
    openings: ['italian'],
    themes: ['kingsideAttack'],
    count: 4,
  },
  {
    id: 'c4',
    title: 'The quiet move',
    intro: "Against Clive, the winning move is often not a capture or a check. Look for the quiet one.",
    themes: ['quietMove'],
    count: 4,
  },
  // (Sep 2026: each opening's theme checked against the puzzle database, so the
  // lesson teaches what really does happen in that opening more than usual.)
  {
    id: 'c5',
    title: 'Trapped pieces in the Ruy Lopez',
    intro: "The Ruy Lopez's famous trap shuts White's bishop in behind a wall of pawns. Priya knows it. Look for pieces with nowhere to go.",
    openings: ['ruy-lopez'],
    themes: ['trappedPiece'],
    count: 4,
  },
  {
    id: 'c6',
    title: 'Double attacks in the Queen’s Gambit',
    intro: "Graham's positions look quiet, but the centre is tense. When it opens, one piece often hits two. Toby's very good at these.",
    openings: ['qgd'],
    themes: ['fork'],
    count: 4,
  },
  {
    id: 'c7',
    title: 'Discovered attacks',
    intro: "Toby's Najdorf, Catalan and Nimzo line pieces up behind each other. Move one aside and the one behind strikes.",
    openings: ['najdorf', 'catalan', 'nimzo'],
    themes: ['discoveredAttack'],
    count: 5,
  },
  // Club weeks (between the story weeks): general topics every club player needs.
  {
    id: 'w3',
    title: 'Back-rank mates',
    intro: 'Club players forget their back rank. Marjorie never does. Learn to spot it, for both sides.',
    themes: ['backRankMate'],
    count: 4,
  },
  {
    id: 'w5',
    title: 'Removing the defender',
    intro: 'Take the piece doing the defending, and whatever it was guarding falls.',
    themes: ['capturingDefender'],
    count: 4,
  },
  {
    id: 'w7',
    title: 'Skewers',
    intro: 'The valuable piece has to move, and the one behind it goes.',
    themes: ['skewer'],
    count: 4,
  },
  {
    id: 'w9',
    title: 'King and pawn endings',
    intro: 'Clive swaps everything off, so you will end up here. Count carefully.',
    themes: ['pawnEndgame'],
    count: 4,
  },
  {
    id: 'w11',
    title: 'Deflection',
    intro: 'Pull a defender away from its job, and the rest follows.',
    themes: ['deflection'],
    count: 4,
  },
  {
    id: 'w12',
    title: 'Pins',
    intro: 'A pinned piece can’t move without losing something bigger behind it. Look for them everywhere.',
    themes: ['pin'],
    count: 4,
  },
  {
    id: 'w14',
    title: 'Rook endings',
    intro: 'Graham will reach a rook ending if he can. Most games do. Active rooks win them.',
    themes: ['rookEndgame'],
    count: 4,
  },
  {
    id: 'w15',
    title: 'Mate in two',
    intro: 'Before the cup: a forcing move first, then the king has nowhere left to go.',
    themes: ['mateIn2'],
    count: 5,
  },
]

export function findLesson(chapterId: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === chapterId)
}
