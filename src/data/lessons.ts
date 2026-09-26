// Act 1 lessons (design document, "Lessons"; revised Sep 2026, Joseph's
// feedback: "just a line or two related to whatever the puzzles are about").
// Each lesson: one or two lines from Coach Pemberton, then a real puzzle from
// the character's opening played out on the board as the example, then a few
// more of the same kind to solve. Puzzles come from games in that opening AND
// share the theme, so the lesson and the puzzles always match. Difficulty
// follows the player's puzzle rating.

export type Lesson = {
  /** Matches the chapter id in act1.ts. */
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
    intro: "Marjorie's London looks tidy, but it leaves pieces where one move can hit two of them. Spot the forks.",
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
    intro: 'Italian games turn on the kingside quickly. Learn what the attack looks like, so it never surprises you.',
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
  {
    id: 'c5',
    title: 'Pins in the Ruy Lopez',
    intro: "The Ruy Lopez is full of pinned pieces. When Priya's out of her book, pins decide it.",
    openings: ['ruy-lopez'],
    themes: ['pin'],
    count: 4,
  },
  {
    id: 'c6',
    title: 'Discovered attacks',
    intro: "In Graham's classical positions, pieces line up. Move one out of the way and the one behind strikes.",
    openings: ['qgd'],
    themes: ['discoveredAttack'],
    count: 4,
  },
  {
    id: 'c7',
    title: "Toby's openings",
    intro: "Toby's Najdorf, Catalan and Nimzo lead to sharp tactics. Forks, pins, discoveries: find them first.",
    openings: ['najdorf', 'catalan', 'nimzo'],
    themes: ['fork', 'pin', 'discoveredAttack'],
    count: 5,
  },
]

export function findLesson(chapterId: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === chapterId)
}
