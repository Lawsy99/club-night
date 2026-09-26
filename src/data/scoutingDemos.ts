// Scouting reports shown on the board (Joseph's feedback, Sep 2026): the
// character's usual opening plays itself, then the right way to meet it,
// with captions in plain words (no move notation), like a YouTube teacher.
// Keyed by character, then by the PLAYER's colour. Moves are standard theory;
// src/logic/scoutingDemos.test.ts checks every line is legal.
import type { WrittenStep } from '../logic/demo'

export const SCOUTING_DEMOS: Record<string, { w: WrittenStep[]; b: WrittenStep[] }> = {
  marjorie: {
    b: [
      { caption: 'She opens with the queen’s pawn, then brings that bishop out early. It’s the London, every time.', moves: '1. d4 d5 2. Bf4' },
      { caption: 'Don’t copy her. Get the knight out, then strike at her centre with the c-pawn straight away.', moves: '2... Nf6 3. e3 c5' },
      { caption: 'Then the queen comes out to hit the pawn her bishop left unguarded. Now she has to defend.', moves: '4. c3 Nc6 5. Nd2 Qb6' },
    ],
    w: [
      { caption: 'Against your king’s pawn she plays the French: one pawn forward, then the other to challenge.', moves: '1. e4 e6 2. d4 d5' },
      { caption: 'Push past her pawn and grab space. Her pieces get cramped behind it.', moves: '3. e5 c5' },
      { caption: 'Support your centre with a pawn and a knight. Space is your advantage; keep it.', moves: '4. c3 Nc6 5. Nf3' },
    ],
  },
  dex: {
    b: [
      { caption: 'He offers you a pawn on move two. That’s the King’s Gambit.', moves: '1. e4 e5 2. f4' },
      { caption: 'Take it. Then hit back in the centre at once.', moves: '2... exf4 3. Nf3 d5' },
      { caption: 'Don’t cling on to everything: get your pieces out and he’s the one who’s worried.', moves: '4. exd5 Nf6' },
    ],
    w: [
      { caption: 'His Stafford: he lets you take a pawn, hoping you’ll grab more.', moves: '1. e4 e5 2. Nf3 Nf6 3. Nxe5 Nc6' },
      { caption: 'Take the knight, then one quiet pawn move stops every trick against your centre.', moves: '4. Nxc6 dxc6 5. d3' },
      { caption: 'Develop and castle. He’s simply a pawn down.', moves: '5... Bc5 6. Be2' },
    ],
  },
  oscar: {
    b: [
      { caption: 'Oscar plays the Italian: his bishop aims straight at the weak square next to your king.', moves: '1. e4 e5 2. Nf3 Nc6 3. Bc4' },
      { caption: 'Match him calmly: bishop out, knight out.', moves: '3... Bc5 4. c3 Nf6 5. d3 d6' },
      { caption: 'Castle early. His quick attack runs out of pieces.', moves: '6. O-O O-O' },
    ],
    w: [
      { caption: 'Against your Italian he brings the other knight out: the Two Knights.', moves: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6' },
      { caption: 'The calm answer: a quiet pawn move protects your centre.', moves: '4. d3 Be7' },
      { caption: 'Castle and build slowly. Fast players hate slow positions.', moves: '5. O-O O-O 6. Re1 d6 7. c3' },
    ],
  },
  clive: {
    b: [
      { caption: 'Whatever you play, he swaps the centre pawns off early. Here, against the French.', moves: '1. e4 e6 2. d4 d5 3. exd5 exd5' },
      { caption: 'Symmetrical and very drawish. Don’t copy him: develop actively and keep pieces on.', moves: '4. Bd3 Nc6 5. c3 Bd6' },
    ],
    w: [
      { caption: 'His Berlin Defence. He wants the queens off early.', moves: '1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6' },
      { caption: 'So keep them on: a quiet pawn move protects your centre and keeps the game alive.', moves: '4. d3' },
    ],
  },
  priya: {
    b: [
      { caption: 'Priya plays the Ruy Lopez, straight from the book.', moves: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7' },
      { caption: 'She knows twenty moves of this. Play natural developing moves and wait for her book to run out.', moves: '6. Re1 b5 7. Bb3 d6' },
    ],
    w: [
      { caption: 'Against your king’s pawn, she plays the long main line of the Ruy Lopez.', moves: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6' },
      { caption: 'Your plan: a small pawn move to prepare taking the centre. Know the plans, not just the moves.', moves: '8. c3 O-O 9. h3' },
    ],
  },
  graham: {
    b: [
      { caption: 'Graham plays the Queen’s Gambit, by the book: he offers a pawn to pull yours from the centre.', moves: '1. d4 d5 2. c4' },
      { caption: 'Decline it. Keep your centre solid and develop.', moves: '2... e6 3. Nc3 Nf6 4. Bg5 Be7' },
      { caption: 'Castle, then look for a pawn break to free your position. Sitting still gets you squeezed.', moves: '5. e3 O-O 6. Nf3 h6' },
    ],
    w: [
      { caption: 'His Petroff: he copies your first moves exactly.', moves: '1. e4 e5 2. Nf3 Nf6' },
      { caption: 'Take the pawn, but after he chases your knight, step it back before grabbing his.', moves: '3. Nxe5 d6 4. Nf3 Nxe4' },
      { caption: 'Then take the centre. Solid, and you keep a small edge.', moves: '5. d4 d5 6. Bd3' },
    ],
  },
  toby: {
    b: [
      { caption: 'Toby plays the Catalan: his bishop on the long diagonal is the whole idea.', moves: '1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2' },
      { caption: 'Develop and castle; you can take a pawn, but don’t hang on to it for dear life.', moves: '4... Be7 5. Nf3 O-O 6. O-O dxc4 7. Qc2 a6' },
    ],
    w: [
      { caption: 'Against your king’s pawn, the Najdorf: the sharpest defence there is.', moves: '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6' },
      { caption: 'A good plan: bishop out, then pawns forward on the kingside. Race him.', moves: '6. Be3 e5 7. Nb3 Be6 8. f3' },
    ],
  },
}
