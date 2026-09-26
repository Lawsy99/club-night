// Opening lessons (Joseph, Sep 2026: "a lot of people aren't great at
// openings... where do I move my first few pieces"). Two simple, sound ways
// to start as White, each with the three ideas behind every opening: take
// the centre, get your pieces out, castle.
//
// Each has a worked demonstration, then a drill: you play the White moves,
// Pemberton plays Black (varying his replies), and a wrong move gets the
// principle it breaks, not just "no". Lines are checked for legality by
// src/logic/openingDrill.test.ts.
import type { WrittenStep } from '../logic/demo'

export type OpeningDrill = {
  id: string
  name: string
  /** Pemberton plays it through first. */
  demo: WrittenStep[]
  /** The lines you practise, as White, including his replies. */
  lines: string[]
  /** Why each White move is played, by how it's written (shown after you play it). */
  why: Record<string, string>
  /** Run-throughs in the drill. */
  runs: number
}

export const OPENING_DRILLS: Record<string, OpeningDrill> = {
  italian: {
    id: 'italian',
    name: 'the Italian Game',
    demo: [
      {
        caption:
          'Every good opening does three things: takes the centre, gets the pieces out, and tucks the king away. Here is a simple way to do all three as White. The Italian Game.',
      },
      { caption: 'A centre pawn first. It takes space and opens the way for your queen and bishop.', moves: '1. e4 e5' },
      { caption: 'A knight out, towards the middle. It attacks Black’s pawn on e5 as well.', moves: '2. Nf3 Nc6' },
      {
        caption: 'The bishop to c4, aiming at f7. That’s the weakest square near Black’s king: only the king guards it.',
        moves: '3. Bc4 Bc5',
      },
      { caption: 'Then c3 and d3 for a solid centre, and castle. Your king is safe and a rook joins in.', moves: '4. c3 Nf6 5. d3 d6 6. O-O O-O' },
      { caption: 'Centre, pieces, king. Six moves, and you’re ready for a real game. Now you play it.' },
    ],
    lines: [
      '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d3 d6 6. O-O O-O',
      '1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d3 Be7 5. O-O O-O 6. Re1 d6',
      '1. e4 e5 2. Nf3 d6 3. Bc4 Nf6 4. Nc3 Be7 5. d3 O-O 6. O-O c6',
    ],
    why: {
      e4: 'A centre pawn. It takes space and lets your queen and bishop out.',
      Nf3: 'Knight out, towards the centre, and it attacks e5.',
      Bc4: 'The bishop to its best diagonal, aiming at f7.',
      c3: 'c3 prepares d4 later, for a bigger centre.',
      d3: 'd3 guards e4 and opens the way for your other bishop.',
      Nc3: 'The other knight out. It guards e4 too.',
      'O-O': 'Castle early: your king is safe, and a rook joins the game.',
      Re1: 'The rook comes to the middle, where the game will open up.',
    },
    runs: 2,
  },
  london: {
    id: 'london',
    name: 'the London System',
    demo: [
      {
        caption:
          'Another way to start, and one that works against almost anything: the London System. You play the same set-up every game, so there’s less to remember.',
      },
      { caption: 'A centre pawn again, the queen’s pawn this time.', moves: '1. d4 d5' },
      { caption: 'The bishop comes out straight away, before e3 shuts it in. That’s the whole idea of the London.', moves: '2. Bf4 Nf6' },
      { caption: 'Then e3, the knight, and c3: a wall of pawns holding d4.', moves: '3. e3 e6 4. Nf3 c5 5. c3' },
      {
        caption: 'The other knight goes to d2, the last bishop to d3, then castle. If they try to swap off your good bishop, step it back to g3.',
        moves: '5... Nc6 6. Nbd2 Bd6 7. Bg3 O-O 8. Bd3',
      },
      { caption: 'Same plan against almost everything. Now you play it.' },
    ],
    lines: [
      '1. d4 d5 2. Bf4 Nf6 3. e3 e6 4. Nf3 c5 5. c3 Nc6 6. Nbd2 Bd6 7. Bg3 O-O 8. Bd3',
      '1. d4 Nf6 2. Bf4 g6 3. e3 Bg7 4. Nf3 O-O 5. Be2 d6 6. O-O',
      '1. d4 d5 2. Bf4 c5 3. e3 Nc6 4. c3 Nf6 5. Nd2 e6 6. Ngf3 Bd6 7. Bg3 O-O 8. Bd3',
    ],
    why: {
      d4: 'A centre pawn: the queen’s pawn.',
      Bf4: 'The bishop out before e3 shuts it in. That’s the London.',
      e3: 'e3 supports d4 and opens the other bishop.',
      Nf3: 'Knight out, towards the centre.',
      Ngf3: 'Knight out, towards the centre.',
      c3: 'c3 makes d4 rock solid.',
      Nbd2: 'The other knight to d2, where it supports e4 later.',
      Nd2: 'The other knight to d2, where it supports e4 later.',
      Bd3: 'The last bishop out, aimed at the king’s side.',
      Bg3: 'Step the bishop back rather than let it be swapped for a knight.',
      Be2: 'A quiet square, ready to castle.',
      'O-O': 'Castle: king safe, rook in the game.',
    },
    runs: 2,
  },
}
