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
  /**
   * What kind of lesson (Joseph, Sep 2026): tactics (an example, then puzzles),
   * an opening (a demonstration, then you play it), or finishing (you play a
   * won ending out against the engine, then puzzles). Tactics if not set.
   */
  kind?: 'tactics' | 'opening' | 'endgame'
  /** The opening drill (data/openingLessons.ts) or finishing drill (data/endgameDrills.ts). */
  drill?: string
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
  // Openings first (Joseph, Sep 2026): "where do I move my first few pieces?"
  // is the biggest barrier for new players, so the season starts there.
  {
    id: 'c1',
    title: 'How to start a game',
    kind: 'opening',
    drill: 'italian',
    intro: 'Before anything else: how to begin. Three ideas, and one simple opening to play as White.',
    themes: [],
    count: 0,
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
    title: 'Another way to start: the London',
    kind: 'opening',
    drill: 'london',
    intro: 'Marjorie’s opening. The same set-up against almost anything, which is why she’s played it for forty years.',
    themes: [],
    count: 0,
  },
  // Finishing (Joseph, Sep 2026): won positions have to be won. The position
  // you play out is chosen by your rating (data/endgameDrills.ts).
  {
    id: 'w5',
    title: 'Finishing: mating a lone king',
    kind: 'endgame',
    drill: 'lone-king',
    intro: 'A won game isn’t won until it’s mate. Tonight you finish one off, against a king that won’t make it easy.',
    themes: ['mateIn1'],
    count: 3,
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
    kind: 'endgame',
    drill: 'king-pawn',
    intro: 'Clive swaps everything off, so you will end up here. First, win one against a king that knows what it’s doing. Then count carefully.',
    themes: ['pawnEndgame'],
    count: 3,
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
    kind: 'endgame',
    drill: 'rook-ending',
    intro: 'Graham will reach a rook ending if he can. Most games do. First, finish one off. Then some puzzles: active rooks win them.',
    themes: ['rookEndgame'],
    count: 3,
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
