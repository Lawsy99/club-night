// Act 1 lessons (design document, "Lessons"). Coach Pemberton presents each
// in 3–5 bubbles over a demonstration board, then 3–5 puzzles on the theme.
// Every topic has three versions by player strength: under 800, 800–1400,
// over 1400. The idea is the same; the depth and puzzle difficulty differ.
// Board moves are in ordinary notation and play on from the previous bubble;
// src/logic/lessons.test.ts checks every line is legal.

export type LessonBubble = {
  text: string
  /** Moves to play on the demonstration board with this bubble (optional). */
  moves?: string
}

export type LessonVersion = {
  bubbles: LessonBubble[]
  puzzles: { themes?: string[]; openings?: string[]; count: number }
}

export type Lesson = {
  /** Matches the chapter id in act1.ts. */
  id: string
  title: string
  /** Which side of the demonstration board faces the player. */
  orientation: 'white' | 'black'
  beginner: LessonVersion
  club: LessonVersion
  advanced: LessonVersion
}

// --- 1. Marjorie: the London System -------------------------------------------

const londonClub: LessonBubble[] = [
  {
    text: "Marjorie sets up the same way every time: d4, bishop to f4, e3, Nf3, c3. It's called the London. Very solid, and very hard to crack if you simply copy her.",
    moves: '1. d4 d5 2. Bf4 Nf6 3. e3',
  },
  { text: 'So hit the centre at once with ...c5, and bring the knight to c6.', moves: '3... c5 4. c3 Nc6 5. Nd2' },
  {
    text: 'Now ...Qb6. Her bishop went to f4 and left b2 unguarded. Suddenly she has to find a way to defend it.',
    moves: '5... Qb6',
  },
  {
    text: 'If she answers Qb3, push past with ...c4, gaining space with a threat. Ask the London questions early and it runs out of ideas.',
    moves: '6. Qb3 c4',
  },
]

const london: Lesson = {
  id: 'c1',
  title: "The London System's plan, and how to break it",
  orientation: 'black',
  beginner: {
    bubbles: [
      {
        text: "Marjorie plays the same way every time: d4, then her bishop to f4, then e3. It's called the London System.",
        moves: '1. d4 d5 2. Bf4 Nf6 3. e3',
      },
      { text: "Don't be put off by how tidy it looks. Bring your pieces out and keep a pawn on d5.", moves: '3... e6 4. Nf3 Bd6' },
      {
        text: 'Your bishop on d6 offers to swap itself for her favourite piece. Without that bishop, her plan runs out of steam.',
        moves: '5. Bxd6 Qxd6',
      },
      { text: "Then castle and bring the rest out. Solid against solid is fine. You'll outplay her later.", moves: '6. Bd3 O-O' },
    ],
    puzzles: { openings: ['london'], count: 3 },
  },
  club: { bubbles: londonClub, puzzles: { openings: ['london'], count: 4 } },
  advanced: {
    bubbles: [
      ...londonClub,
      {
        text: "Another good try is ...Nh5, hunting the f4 bishop for the pair of bishops. It's the heart of her system; take it and she's just a pile of pawns.",
      },
    ],
    puzzles: { openings: ['london'], count: 5 },
  },
}

// --- 2. Dex: meeting a gambit calmly ------------------------------------------

const staffordCore: LessonBubble[] = [
  {
    text: 'Dex loves a gambit: he gives away a pawn early for fast attacking chances. This is his Stafford Gambit.',
    moves: '1. e4 e5 2. Nf3 Nf6 3. Nxe5 Nc6',
  },
  { text: 'Taking on c6 is simplest. Now keep calm and finish your development.', moves: '4. Nxc6 dxc6' },
  {
    text: "The quiet d3 stops all his tricks against e4. Don't grab anything else yet.",
    moves: '5. d3 Bc5 6. Be2',
  },
]

const gambits: Lesson = {
  id: 'c2',
  title: 'Meeting a gambit calmly',
  orientation: 'white',
  beginner: {
    bubbles: [
      ...staffordCore,
      { text: "Develop, castle, and he's simply a pawn down. Gambits only work if you panic." },
    ],
    puzzles: { openings: ['stafford', 'englund', 'kings-gambit', 'danish'], count: 3 },
  },
  club: {
    bubbles: [
      ...staffordCore,
      {
        text: "Watch for his favourite trap: after 5.e5 Ne4 6.d3 Bc5, taking the knight with dxe4 loses to ...Bxf2+, and your queen falls. Calm moves first, pawns later.",
      },
    ],
    puzzles: { openings: ['stafford', 'englund', 'kings-gambit', 'danish'], count: 4 },
  },
  advanced: {
    bubbles: [
      ...staffordCore,
      {
        text: "Watch for his favourite trap: after 5.e5 Ne4 6.d3 Bc5, taking the knight with dxe4 loses to ...Bxf2+, and your queen falls.",
      },
      {
        text: 'Against his Englund (1.d4 e5), the same rule: after 4.Bf4 Qb4+ 5.Bd2 Qxb2, the calm 6.Nc3 is best. The greedy 6.Bc3 walks into ...Bb4.',
      },
    ],
    puzzles: { openings: ['stafford', 'englund', 'kings-gambit', 'danish'], count: 5 },
  },
}

// --- 3. Oscar: staying calm against fast play ----------------------------------

const italianCore: LessonBubble[] = [
  {
    text: "Oscar plays fast and confidently. That isn't the same as playing well. Take your time on every move.",
    moves: '1. e4 e5 2. Nf3 Nc6 3. Bc4',
  },
  {
    text: "His bishop on c4 is aimed at f7, the weakest square near your king. Always check what it's looking at.",
  },
]

const oscar: Lesson = {
  id: 'c3',
  title: 'Staying calm against fast, confident play',
  orientation: 'black',
  beginner: {
    bubbles: [
      ...italianCore,
      { text: 'Develop your pieces, castle early, and his quick attack runs out of pieces.', moves: '3... Bc5 4. c3 Nf6 5. d3 d6 6. O-O O-O' },
    ],
    puzzles: { openings: ['italian'], themes: ['defensiveMove'], count: 3 },
  },
  club: {
    bubbles: [
      ...italianCore,
      { text: "If he lunges with Ng5, hitting f7, don't panic. ...d5 blocks the bishop's view.", moves: '3... Nf6 4. Ng5 d5 5. exd5' },
      {
        text: 'Now ...Na5, hitting the bishop. Taking back on d5 with the knight lets him sacrifice on f7: the famous Fried Liver.',
        moves: '5... Na5',
      },
      { text: "You're a pawn down for a big lead in development. Oscar hates having to defend." },
    ],
    puzzles: { openings: ['italian'], themes: ['defensiveMove'], count: 4 },
  },
  advanced: {
    bubbles: [
      ...italianCore,
      { text: "If he lunges with Ng5, ...d5 and then ...Na5 is the principled answer, not ...Nxd5 and the Fried Liver.", moves: '3... Nf6 4. Ng5 d5 5. exd5 Na5' },
      {
        text: 'Against his quiet set-up with c3 and d3, aim for ...a6, ...Ba7 and a well-timed ...d5. Fast players struggle when the position slows down.',
      },
    ],
    puzzles: { openings: ['italian'], themes: ['defensiveMove'], count: 5 },
  },
}

// --- 4. Clive: winning chances in level positions -------------------------------

const cliveCore: LessonBubble[] = [
  {
    text: "Clive wants a draw, and he'll swap everything to get one: symmetrical pawns, open files, early queen trades.",
    moves: '1. d4 d5 2. c4 c6 3. cxd5 cxd5',
  },
  {
    text: 'Refuse to mirror him. Keep pieces on the board: the more pieces left, the more chances for someone to go wrong.',
    moves: '4. Nc3 Nf6 5. Bf4 Nc6 6. e3 Bf5',
  },
]

const clive: Lesson = {
  id: 'c4',
  title: 'Creating winning chances in a level position',
  orientation: 'white',
  beginner: {
    bubbles: [
      ...cliveCore,
      { text: 'When he offers a draw around move 12, decline politely. Remember, draws here are replayed.' },
    ],
    puzzles: { themes: ['quietMove', 'intermezzo'], count: 3 },
  },
  club: {
    bubbles: [
      ...cliveCore,
      {
        text: 'Create something to play for: a knight on a good outpost, a pawn majority, or a weak pawn to attack. Here Qb3, hitting b7 and d5, is a typical start.',
      },
      { text: 'When he offers a draw around move 12, decline politely. Draws are replayed.' },
    ],
    puzzles: { themes: ['quietMove', 'intermezzo'], count: 4 },
  },
  advanced: {
    bubbles: [
      ...cliveCore,
      {
        text: 'Create an imbalance: an outpost, a majority, or castling on opposite sides. In this structure the minority attack, a4 then b4-b5, is a patient way to make him defend.',
      },
      { text: "He'll offer a draw at move 12. Decline, and make him prove he can hold a slightly worse position." },
    ],
    puzzles: { themes: ['quietMove', 'intermezzo', 'zugzwang'], count: 5 },
  },
}

// --- 5. Priya: when the theory runs out -----------------------------------------

const ruyMain = '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3'

const priya: Lesson = {
  id: 'c5',
  title: 'What to do once the opening theory runs out',
  orientation: 'white',
  beginner: {
    bubbles: [
      { text: "Priya knows twenty moves of theory. She'll play the main line of the Ruy Lopez perfectly.", moves: ruyMain },
      { text: "Don't try to out-memorise her. Play natural moves: develop, castle, keep your centre." },
      { text: 'When she leaves her book, she slows right down. That is your moment.' },
    ],
    puzzles: { openings: ['ruy-lopez'], count: 3 },
  },
  club: {
    bubbles: [
      { text: "Priya knows twenty moves of theory. She'll play the main line of the Ruy Lopez perfectly.", moves: ruyMain },
      { text: "Don't try to out-memorise her. Aim for positions where she has to think for herself." },
      { text: 'When the book runs out, ask two questions: which is my worst piece, and where is my pawn break?' },
      {
        text: "In the Ruy, Black often plays ...Na5 and ...c5, and White's break is d4. Plans beat memory.",
        moves: '9... Na5 10. Bc2 c5 11. d4',
      },
    ],
    puzzles: { openings: ['ruy-lopez'], count: 4 },
  },
  advanced: {
    bubbles: [
      { text: 'Priya knows the Ruy Lopez main lines deeply. Meet her there if you like, but know the plans, not just the moves.', moves: ruyMain },
      {
        text: "Black's typical plan: ...Na5, ...c5 and queenside space. White's: d4, then the knight's long trip Nbd2–f1–g3 towards the kingside.",
        moves: '9... Na5 10. Bc2 c5 11. d4',
      },
      { text: 'Out of book, find the worst piece and the pawn break, then play for them. She will spend twenty minutes looking for a line she remembers.' },
    ],
    puzzles: { openings: ['ruy-lopez'], count: 5 },
  },
}

// --- 6. Graham: classical positions ---------------------------------------------

const qgdStart = '1. d4 d5 2. c4 e6 3. Nc3 Nf6'
const carlsbad = '4. cxd5 exd5 5. Bg5 Be7 6. e3 c6'
const qgdDevelop = '7. Bd3 Nbd7 8. Qc2 O-O 9. Nf3 Re8 10. O-O'

const graham: Lesson = {
  id: 'c6',
  title: 'Classical, principled positions',
  orientation: 'white',
  beginner: {
    bubbles: [
      { text: 'Graham plays by the book: centre first, pieces out, king safe. Good habits, and worth copying.', moves: qgdStart },
      { text: 'Swap on d5 and the position becomes calm and easy to understand.', moves: carlsbad },
      { text: 'Finish developing: bishop, queen, knight, castle. No hurry, no tricks.', moves: qgdDevelop },
    ],
    puzzles: { openings: ['qgd'], count: 3 },
  },
  club: {
    bubbles: [
      { text: "Graham plays the Queen's Gambit by the book: centre first, pieces out, king safe.", moves: qgdStart },
      { text: 'Swap on d5 and you reach the Carlsbad structure: his pawns on c6 and d5, yours on d4 and e3.', moves: carlsbad },
      { text: 'Finish developing calmly: Bd3, Qc2, Nf3, castle.', moves: qgdDevelop },
      { text: 'Then the minority attack: push b4 and b5 to break up his queenside and leave him a weak pawn to aim at.' },
    ],
    puzzles: { openings: ['qgd'], count: 4 },
  },
  advanced: {
    bubbles: [
      { text: "The Queen's Gambit Declined, Exchange Variation: the Carlsbad structure.", moves: `${qgdStart} ${carlsbad}` },
      { text: 'Develop with Bd3, Qc2, Nf3 and castle; Black aims for ...Ne4 or a kingside push with ...Nf8-g6.', moves: qgdDevelop },
      { text: 'Your plan is the minority attack: Rb1, b4, b5. Swap on c6 and he is left with a weak c-pawn or a hole on c6.' },
    ],
    puzzles: { openings: ['qgd'], count: 5 },
  },
}

// --- 7. Toby: fixing your own weak spots ----------------------------------------

const tobyBubbles: LessonBubble[] = [
  { text: "Toby has been studying your games. He'll aim for whatever you find hardest." },
  { text: 'Most club games are decided by loose pieces. Before every move, check what is undefended, on both sides.' },
  { text: 'Then look at every check, capture and threat. Ten seconds a move, and it saves games.' },
  { text: 'Forks, pins and skewers all feed on loose pieces and exposed kings. Let us find some.' },
]

const toby: Lesson = {
  id: 'c7',
  title: 'Fixing your own weak spots',
  orientation: 'white',
  beginner: { bubbles: tobyBubbles, puzzles: { themes: ['fork', 'hangingPiece', 'mateIn1'], count: 4 } },
  club: { bubbles: tobyBubbles, puzzles: { themes: ['fork', 'pin', 'skewer', 'hangingPiece'], count: 5 } },
  advanced: {
    bubbles: tobyBubbles,
    puzzles: { themes: ['fork', 'pin', 'skewer', 'discoveredAttack', 'deflection'], count: 5 },
  },
}

export const LESSONS: Lesson[] = [london, gambits, oscar, clive, priya, graham, toby]

export type LessonLevel = 'beginner' | 'club' | 'advanced'

/** Which version suits the player (design: under 800, 800–1400, over 1400). */
export function lessonLevel(rating: number): LessonLevel {
  return rating < 800 ? 'beginner' : rating <= 1400 ? 'club' : 'advanced'
}

export function findLesson(chapterId: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === chapterId)
}
