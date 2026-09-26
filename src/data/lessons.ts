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

// --- Act 2 (Sep 2026): Black openings, defence, finishing and the ideas
// behind the tactics. Same three kinds of lesson as Act 1.
LESSONS.push(
  {
    id: 'a2-1',
    title: 'Playing Black: answering 1.e4',
    kind: 'opening',
    drill: 'black-e4',
    intro: 'Half your games are with Black. Same three ideas: centre, pieces, king. Tonight, when they start with the king’s pawn.',
    themes: [],
    count: 0,
  },
  {
    id: 'a2-2',
    title: 'Defend first',
    intro: 'Before your plan, theirs. Find the move that meets the threat. Only then is there time for anything else.',
    themes: ['defensiveMove'],
    count: 4,
  },
  {
    id: 'a2-3',
    title: 'Playing Black: answering 1.d4',
    kind: 'opening',
    drill: 'black-d4',
    intro: 'The queen’s pawn. The simplest answer is Graham’s: d5, e6, develop, castle.',
    themes: [],
    count: 0,
  },
  {
    id: 'a2-4',
    title: 'Key squares',
    kind: 'endgame',
    drill: 'key-squares',
    intro: 'In king and pawn endings, where the king stands decides everything. Win one from a key square, then count carefully.',
    themes: ['pawnEndgame'],
    count: 3,
  },
  {
    id: 'a2-5',
    title: 'The in-between move',
    intro: 'Everyone expects the recapture. Before you make it, look for a check or a threat that comes first.',
    themes: ['intermezzo'],
    count: 4,
  },
  {
    id: 'a2-6',
    title: 'Luring a piece in',
    intro: 'Sometimes the winning idea is to give something up, so that a piece is dragged onto the wrong square.',
    themes: ['attraction'],
    count: 4,
  },
  {
    id: 'a2-7',
    title: 'Loose pieces drop off',
    intro: 'An undefended piece is a target, yours or theirs. Count the defenders before every move.',
    themes: ['hangingPiece'],
    count: 4,
  },
  {
    id: 'a2-8',
    title: 'The exposed king',
    intro: 'League matches are won against kings that have lost their cover. Find the way in.',
    themes: ['exposedKing'],
    count: 4,
  },
  {
    id: 'a2-9',
    title: 'X-ray attacks',
    intro: 'A rook or bishop can attack through a piece, to the square behind it. Look along the whole line.',
    themes: ['xRayAttack'],
    count: 4,
  },
  {
    id: 'a2-10',
    title: 'Clearing the way',
    intro: 'Sometimes a piece is in its own side’s way. Move it, with tempo, and the one behind comes alive.',
    themes: ['clearance'],
    count: 4,
  },
  {
    id: 'a2-11',
    title: 'Holding a draw',
    kind: 'endgame',
    drill: 'hold',
    intro: 'Being worse isn’t being lost. Tonight you defend a position a pawn down against a player who wants to win it.',
    themes: ['defensiveMove'],
    count: 3,
  },
  {
    id: 'a2-12',
    title: 'Zugzwang',
    intro: 'Sometimes the best move is to make them move. Every move they have makes things worse.',
    themes: ['zugzwang'],
    count: 4,
  },
  {
    id: 'a2-13',
    title: 'Passed pawns must be pushed',
    intro: 'A passed pawn is a criminal that should be kept under lock and key. Yours should be pushed.',
    themes: ['advancedPawn', 'promotion'],
    count: 4,
  },
  {
    id: 'a2-14',
    title: 'Mate in three',
    intro: 'Three forcing moves. Checks first, then captures, then threats. See it all before you move.',
    themes: ['mateIn3'],
    count: 4,
  },
  {
    id: 'a2-15',
    title: 'The smothered mate',
    intro: 'Before the top of the ladder: the king boxed in by its own pieces, and a knight to finish.',
    themes: ['smotheredMate'],
    count: 4,
  },
)

export function findLesson(chapterId: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === chapterId)
}
