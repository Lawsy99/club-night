// Scouting reports shown on the board (Joseph's feedback, Sep 2026): the
// character's usual opening plays itself, then the right way to meet it,
// with captions in plain words (no move notation), like a YouTube teacher.
// Keyed by character, then by the PLAYER's colour: several reports each, used
// in turn and never repeated (Joseph, Sep 2026: you meet everyone more than
// once, so one report on playing White against them, another on playing
// Black, and a different one next time). Moves are standard theory;
// src/logic/scoutingDemos.test.ts checks every line is legal.
import type { WrittenStep } from '../logic/demo'

export const SCOUTING_DEMOS: Record<string, { w: WrittenStep[][]; b: WrittenStep[][] }> = {
  marjorie: {
    b: [
      [
        { caption: 'She opens with the queen’s pawn, then brings that bishop out early. It’s the London, every time.', moves: '1. d4 d5 2. Bf4' },
        { caption: 'Don’t copy her. Get the knight out, then strike at her centre with the c-pawn straight away.', moves: '2... Nf6 3. e3 c5' },
        { caption: 'Then the queen comes out to hit the pawn her bishop left unguarded. Now she has to defend.', moves: '4. c3 Nc6 5. Nd2 Qb6' },
      ],
      [
        { caption: 'Another way against her London: put your bishop on the same diagonal as hers.', moves: '1. d4 d5 2. Bf4 Bf5 3. e3 e6 4. Nf3 Nf6' },
        { caption: 'When she offers to swap it, take. Then bring the other bishop out to challenge hers. Her whole system runs short of ideas.', moves: '5. Bd3 Bxd3 6. Qxd3 Bd6' },
      ],
    ],
    w: [
      [
        { caption: 'Play the king’s pawn against her. She answers with the French: one pawn forward, then the other to challenge.', moves: '1. e4 e6 2. d4 d5' },
        { caption: 'Push past her pawn and grab space. It’s called the Advance, and her pieces get cramped behind it.', moves: '3. e5 c5' },
        { caption: 'Support your centre with a pawn and a knight. Space is your advantage; keep it.', moves: '4. c3 Nc6 5. Nf3' },
      ],
      [
        { caption: 'Or open with the queen’s pawn. She declines the gambit and sits tight: the Queen’s Gambit Declined.', moves: '1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7' },
        { caption: 'Castle, then put a rook where the pawns will open up. Patience beats patience.', moves: '5. e3 O-O 6. Nf3 Nbd7 7. Rc1' },
      ],
    ],
  },
  dex: {
    b: [
      [
        { caption: 'He offers you a pawn on move two. That’s the King’s Gambit.', moves: '1. e4 e5 2. f4' },
        { caption: 'Take it. Then hit back in the centre at once.', moves: '2... exf4 3. Nf3 d5' },
        { caption: 'Don’t cling on to everything: get your pieces out and he’s the one who’s worried.', moves: '4. exd5 Nf6' },
      ],
      [
        { caption: 'Or the Danish: he gives you one pawn, then offers another.', moves: '1. e4 e5 2. d4 exd4 3. c3' },
        { caption: 'Turn the second one down with a pawn to the centre. Your queen comes out safely, and his pieces are still at home.', moves: '3... d5 4. exd5 Qxd5 5. cxd4 Nc6' },
      ],
    ],
    w: [
      [
        { caption: 'Open with the king’s pawn and bring a knight out. He answers with the Stafford: he lets you take a pawn, hoping you’ll grab more.', moves: '1. e4 e5 2. Nf3 Nf6 3. Nxe5 Nc6' },
        { caption: 'Take the knight, then one quiet pawn move stops every trick against your centre.', moves: '4. Nxc6 dxc6 5. d3' },
        { caption: 'Develop and castle. He’s simply a pawn down.', moves: '5... Bc5 6. Be2' },
      ],
      [
        { caption: 'The Stafford again, and another way to meet it: bring your other knight out to guard the centre.', moves: '1. e4 e5 2. Nf3 Nf6 3. Nxe5 Nc6 4. Nxc6 dxc6 5. Nc3' },
        { caption: 'His bishop and knight will be looking at your king. Tuck your bishop in, and one small pawn move keeps his knight out.', moves: '5... Bc5 6. Be2 h5 7. h3' },
      ],
    ],
  },
  oscar: {
    b: [
      [
        { caption: 'Oscar plays the Italian: his bishop aims straight at the weak square next to your king.', moves: '1. e4 e5 2. Nf3 Nc6 3. Bc4' },
        { caption: 'Match him calmly: bishop out, knight out.', moves: '3... Bc5 4. c3 Nf6 5. d3 d6' },
        { caption: 'Castle early. His quick attack runs out of pieces.', moves: '6. O-O O-O' },
      ],
      [
        { caption: 'Or answer his bishop with your other knight: the Two Knights.', moves: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6' },
        { caption: 'He’ll play quietly now. Castle and keep everything protected. He’s the one who wants it over quickly.', moves: '4. d3 Be7 5. O-O O-O 6. Re1 d6' },
      ],
    ],
    w: [
      [
        { caption: 'Play the Italian against him: king’s pawn, knight, then the bishop. He brings his other knight out: the Two Knights.', moves: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6' },
        { caption: 'The calm answer: a quiet pawn move protects your centre.', moves: '4. d3 Be7' },
        { caption: 'Castle and build slowly. Fast players hate slow positions.', moves: '5. O-O O-O 6. Re1 d6 7. c3' },
      ],
      [
        { caption: 'Try something he hasn’t prepared: the Scotch. The queen’s pawn goes to the middle on move three.', moves: '1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Nf6' },
        { caption: 'Swap knights and push on. Open positions reward the player whose pieces are out first. Make sure that’s you.', moves: '5. Nxc6 bxc6 6. e5 Qe7 7. Qe2' },
      ],
    ],
  },
  clive: {
    b: [
      [
        { caption: 'Whatever you play, he swaps the centre pawns off early. Here, against the French.', moves: '1. e4 e6 2. d4 d5 3. exd5 exd5' },
        { caption: 'Symmetrical and very drawish. Don’t copy him: develop actively and keep pieces on.', moves: '4. Bd3 Nc6 5. c3 Bd6' },
      ],
      [
        { caption: 'Against the Caro-Kann he swaps too: the Exchange, and a symmetrical position.', moves: '1. e4 c6 2. d4 d5 3. exd5 cxd5' },
        { caption: 'Develop with purpose: knights out, and your light bishop comes out before your pawns shut it in. Give him problems to solve.', moves: '4. Bd3 Nc6 5. c3 Nf6 6. Bf4 Bg4' },
      ],
    ],
    w: [
      [
        { caption: 'Try the Ruy Lopez: king’s pawn, knight, then the bishop to pin his knight. He answers with the Berlin. He wants the queens off early.', moves: '1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6' },
        { caption: 'So keep them on: a quiet pawn move protects your centre and keeps the game alive.', moves: '4. d3' },
      ],
      [
        { caption: 'Or the queen’s pawn. He wants to swap pawns and draw, so don’t swap first: keep the tension.', moves: '1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. e3' },
        { caption: 'If he takes your pawn, take back with the bishop. You’re first to develop, and the position stays unbalanced.', moves: '4... dxc4 5. Bxc4 e6 6. O-O' },
      ],
    ],
  },
  priya: {
    b: [
      [
        { caption: 'Priya plays the Ruy Lopez, straight from the book.', moves: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7' },
        { caption: 'She knows twenty moves of this. Play natural developing moves and wait for her book to run out.', moves: '6. Re1 b5 7. Bb3 d6' },
      ],
      [
        { caption: 'Or take her off her main line on move three: the Berlin. Your knight takes her centre pawn.', moves: '1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4' },
        { caption: 'It gets quiet quickly, and it isn’t the twenty moves she prepared. Now she has to think for herself.', moves: '5. d4 Nd6 6. Bxc6 dxc6 7. dxe5 Nf5' },
      ],
    ],
    w: [
      [
        { caption: 'Play the Ruy Lopez, her own favourite. She follows the long main line, as you’d expect.', moves: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6' },
        { caption: 'Your plan: a small pawn move to prepare taking the centre. Know the plans, not just the moves.', moves: '8. c3 O-O 9. h3' },
      ],
      [
        { caption: 'Or the queen’s pawn. She’ll decline the gambit, by the book. Swap in the centre early: the Exchange variation.', moves: '1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. cxd5 exd5 5. Bg5 Be7' },
        { caption: 'Now there’s a plan she can’t memorise her way out of: pawns up the queenside, into her pawns.', moves: '6. e3 O-O 7. Bd3 c6 8. Qc2' },
      ],
    ],
  },
  graham: {
    b: [
      [
        { caption: 'Graham plays the Queen’s Gambit, by the book: he offers a pawn to pull yours from the centre.', moves: '1. d4 d5 2. c4' },
        { caption: 'Decline it. Keep your centre solid and develop.', moves: '2... e6 3. Nc3 Nf6 4. Bg5 Be7' },
        { caption: 'Castle, then look for a pawn break to free your position. Sitting still gets you squeezed.', moves: '5. e3 O-O 6. Nf3 h6' },
      ],
      [
        { caption: 'Or take the pawn he offers: the Queen’s Gambit Accepted.', moves: '1. d4 d5 2. c4 dxc4 3. Nf3 Nf6 4. e3 e6' },
        { caption: 'He’ll win it back. Don’t mind: develop, then hit his centre with the c-pawn. Your pieces get free squares.', moves: '5. Bxc4 c5 6. O-O a6' },
      ],
    ],
    w: [
      [
        { caption: 'The king’s pawn and a knight. He answers with the Petroff: he copies your first moves exactly.', moves: '1. e4 e5 2. Nf3 Nf6' },
        { caption: 'Take the pawn, but after he chases your knight, step it back before grabbing his.', moves: '3. Nxe5 d6 4. Nf3 Nxe4' },
        { caption: 'Then take the centre. Solid, and you keep a small edge.', moves: '5. d4 d5 6. Bd3' },
      ],
      [
        { caption: 'Or the queen’s pawn. He’ll answer by the book: the Queen’s Gambit Declined.', moves: '1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 h6' },
        { caption: 'Keep your bishop pinning his knight and castle. You have the extra space; let him show you how he means to free himself.', moves: '7. Bh4 b6 8. Be2' },
      ],
    ],
  },
  ray: {
    b: [
      [
        { caption: 'Ray plays the Italian, the way he teaches it: bishop out early, looking at the square next to your king.', moves: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6' },
        { caption: 'If he builds a big centre with two pawns, take one and check him. His centre gets a lot less scary.', moves: '5. d4 exd4 6. cxd4 Bb4+' },
      ],
      [
        { caption: 'Or meet his bishop with your other knight: the Two Knights. Ray will play it quietly.', moves: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d3 Be7' },
        { caption: 'Castle and match him move for move. He’s tired by nine o’clock. Long games suit you.', moves: '5. O-O O-O 6. Re1 d6 7. c3' },
      ],
    ],
    w: [
      [
        { caption: 'Against the king’s pawn he plays the Caro-Kann: solid, and hard to break down.', moves: '1. e4 c6 2. d4 d5' },
        { caption: 'Push past him and take space: the Advance. His light bishop comes out, so give it something to worry about.', moves: '3. e5 Bf5 4. Nf3 e6 5. Be2 c5 6. Be3' },
      ],
      [
        { caption: 'Or the queen’s pawn. He declines the gambit, like his juniors do.', moves: '1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3 Be7' },
        { caption: 'Bring your dark bishop out to a good square, then castle. You have the space; make him prove he can use his.', moves: '5. Bf4 O-O 6. e3 c5 7. dxc5' },
      ],
    ],
  },
  malcolm: {
    b: [
      [
        { caption: 'Malcolm plays the Queen’s Gambit, and he knows it better than the book.', moves: '1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7' },
        { caption: 'Castle, and free your position with a pawn break when you can. It’ll be a long game. Get comfortable.', moves: '5. e3 O-O 6. Nf3 Nbd7 7. Rc1 c6' },
      ],
      [
        { caption: 'Or avoid his main lines altogether: the Nimzo-Indian pins his knight on move three.', moves: '1. d4 Nf6 2. c4 e6 3. Nc3 Bb4' },
        { caption: 'Castle, take a share of the centre, then hit it with the c-pawn. His kind of game, on your terms.', moves: '4. e3 O-O 5. Bd3 d5 6. Nf3 c5' },
      ],
    ],
    w: [
      [
        { caption: 'Against the king’s pawn he plays the closed Ruy Lopez, and very well.', moves: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6' },
        { caption: 'The usual plan: prepare to take the centre. He’ll know every move of it, so don’t expect him to go wrong early.', moves: '8. c3 O-O 9. h3 Na5 10. Bc2' },
      ],
      [
        { caption: 'Or take him somewhere quieter: the Italian, played slowly.', moves: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d3 d6' },
        { caption: 'Castle and manoeuvre. A long, slow game is decided by whoever stays patient. Make sure that’s you.', moves: '6. O-O O-O 7. Re1 a6 8. Bb3' },
      ],
    ],
  },
  terry: {
    b: [
      [
        { caption: 'Terry might bring his queen out on move two, aiming at the weak square next to your king.', moves: '1. e4 e5 2. Qh5 Nc6 3. Bc4' },
        { caption: 'Guard it first, then chase the queen with a knight. She has to run, and your pieces come out with gain of time.', moves: '3... g6 4. Qf3 Nf6' },
      ],
      [
        { caption: 'Or the Grob: the pawn in front of his king goes two squares on move one, and his bishop aims at your centre.', moves: '1. g4 d5 2. Bg2 c6' },
        { caption: 'A small pawn move makes your centre safe. Then build the ideal centre and develop. He’s spent his moves on the edge of the board.', moves: '3. d3 e5 4. Nc3 Nf6' },
      ],
    ],
    w: [
      [
        { caption: 'His favourite trap: his knight jumps forward and leaves his king’s pawn loose. Don’t take it.', moves: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Nd4' },
        { caption: 'Take the knight instead, then challenge the pawn that takes back. You’re simply better.', moves: '4. Nxd4 exd4 5. c3' },
      ],
      [
        { caption: 'Or he walks his king out on move two. He means it.', moves: '1. e4 e5 2. Nf3 Ke7' },
        { caption: 'Don’t laugh. Develop fast and open the centre: a king in the middle is a target all game.', moves: '3. d4 exd4 4. Nxd4 Nf6 5. Nc3' },
      ],
    ],
  },
  toby: {
    b: [
      [
        { caption: 'Toby plays the Catalan: his bishop on the long diagonal is the whole idea.', moves: '1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2' },
        { caption: 'Develop and castle; you can take a pawn, but don’t hang on to it for dear life.', moves: '4... Be7 5. Nf3 O-O 6. O-O dxc4 7. Qc2 a6' },
      ],
      [
        { caption: 'The Catalan again. This time take the pawn early and hold on to it for a while.', moves: '1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2 dxc4 5. Nf3 a6' },
        { caption: 'Two pawns forward on the queenside keep it. He’ll get pressure for it. You’ll have the pawn.', moves: '6. O-O b5' },
      ],
    ],
    w: [
      [
        { caption: 'Play the Open Sicilian: king’s pawn, knight, then open the centre. He answers with the Najdorf, the sharpest defence there is.', moves: '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6' },
        { caption: 'A good plan: bishop out, then pawns forward on the kingside. Race him.', moves: '6. Be3 e5 7. Nb3 Be6 8. f3' },
      ],
      [
        { caption: 'Or avoid his preparation altogether: check with your bishop on move three.', moves: '1. e4 c5 2. Nf3 d6 3. Bb5+ Bd7' },
        { caption: 'Swap the bishops, castle, and build a centre with two pawns. He’d much rather you walked into his homework.', moves: '4. Bxd7+ Qxd7 5. O-O Nc6 6. c3' },
      ],
    ],
  },
}
