// The plan pause (design document, "The help stages"): once per assisted game,
// around move 10, the player picks the plan for the next few moves and Coach
// Pemberton gives a one-line verdict. Plans are written per opening and per
// side the player is on. Standard, sound middlegame plans only.

export type PlanOption = {
  label: string
  verdict: string
  /** 'best' is the classical plan; 'ok' playable; 'poor' a common mistake. */
  quality: 'best' | 'ok' | 'poor'
}

export type PlanSet = { prompt: string; options: PlanOption[] }

/** Keyed by opening, then by the PLAYER's colour. */
export const PLANS: Record<string, Partial<Record<'w' | 'b', PlanSet>>> = {
  london: {
    w: {
      prompt: 'Your London is set up. What now?',
      options: [
        { label: 'Knight to e5, then build up on the kingside', quality: 'best', verdict: "The London's main idea. A knight on e5 that can't be moved is worth a lot." },
        { label: 'Prepare the e4 break with Nbd2 and Qe2', quality: 'ok', verdict: 'Solid and sensible. It opens the centre on your terms.' },
        { label: 'Swap off your bishop from f4', quality: 'poor', verdict: "That bishop is the point of the London. Keep it." },
      ],
    },
    b: {
      prompt: 'Her London is set up. What now?',
      options: [
        { label: 'Press her centre and the b2 pawn (...c5, ...Qb6)', quality: 'best', verdict: 'Right. Keep asking the London questions. b2 is its soft spot.' },
        { label: 'Swap pieces and aim for an endgame', quality: 'ok', verdict: "Safe enough, but that's her home ground. Marjorie's endgames are ruthless." },
        { label: 'Attack on the kingside with ...h5 and ...g5', quality: 'poor', verdict: "Too loose. Your own king lives there, and her pieces are ready for it." },
      ],
    },
  },
  french: {
    w: {
      prompt: 'The French. How do you want to play it?',
      options: [
        { label: 'Space with e5, then attack on the kingside', quality: 'best', verdict: 'The classical plan. The e5 pawn cramps her whole position.' },
        { label: 'Swap on d5 and play for quick development', quality: 'ok', verdict: "Sound, but very level. She'll be happy with that." },
        { label: 'Push on the queenside with a4 and b4', quality: 'poor', verdict: 'Wrong wing. The queenside is where she plays, with ...c5.' },
      ],
    },
  },
  qgd: {
    w: {
      prompt: "The Queen's Gambit Declined. Your plan?",
      options: [
        { label: 'Minority attack: b4 and b5 on the queenside', quality: 'best', verdict: 'Textbook. Break up the queenside and leave a weak pawn to aim at.' },
        { label: 'Pawn storm on the kingside', quality: 'ok', verdict: 'Possible if the kings are on opposite sides. Otherwise risky.' },
        { label: 'Trade queens early', quality: 'poor', verdict: 'Takes the life out of it. Nothing left to play for.' },
      ],
    },
    b: {
      prompt: "Queen's Gambit, all very classical. What's your plan?",
      options: [
        { label: 'Finish developing, then free the position with ...c5 or ...e5', quality: 'best', verdict: 'Right. Every QGD needs a pawn break, or you get squeezed.' },
        { label: 'Sit tight and shuffle your pieces', quality: 'poor', verdict: 'Graham will happily squeeze you all night.' },
        { label: 'Launch ...g5 on the kingside', quality: 'poor', verdict: "Weakening. Don't attack where you're the weaker side." },
      ],
    },
  },
  gambit: {
    b: {
      prompt: "You're a pawn up and Dex is hunting your king. What now?",
      options: [
        { label: 'Finish developing and castle; give the pawn back if needed', quality: 'best', verdict: "Exactly. Castle and he's simply a pawn down." },
        { label: 'Hit back with your own attack at once', quality: 'ok', verdict: "Brave, but your pieces aren't out yet." },
        { label: 'Grab more pawns while you can', quality: 'poor', verdict: "That's how gambits work. Development first." },
      ],
    },
    w: {
      prompt: "Dex has gambited a pawn and wants chaos. What now?",
      options: [
        { label: 'Develop calmly, castle, and shut down his tricks', quality: 'best', verdict: "Right. Gambits only work if you panic." },
        { label: 'Give the pawn back for a simple position', quality: 'ok', verdict: 'Fine if you need it, but you were ahead.' },
        { label: 'Hunt for more material', quality: 'poor', verdict: 'Greed is exactly what his traps are waiting for.' },
      ],
    },
  },
  italian: {
    b: {
      prompt: "Oscar's Italian is up and running. Your plan?",
      options: [
        { label: 'Finish developing, castle, then ...d5 at the right moment', quality: 'best', verdict: 'Good. Fast players struggle when you meet them calmly.' },
        { label: 'Trade into a quiet endgame', quality: 'ok', verdict: 'Fine, but a quick player blunders more in complicated positions.' },
        { label: 'Go for his king at once with ...Ng4', quality: 'poor', verdict: 'Premature. Pieces out first.' },
      ],
    },
    w: {
      prompt: 'The Italian. How will you build?',
      options: [
        { label: 'Slow build-up: c3, d3, Nbd2, and a later d4', quality: 'best', verdict: 'The modern way. Patience beats him.' },
        { label: 'Ng5 and go straight for f7', quality: 'ok', verdict: 'Tempting, but after ...d5 he gets lively play.' },
        { label: 'Swap everything off', quality: 'poor', verdict: 'Leaves nothing to play for.' },
      ],
    },
  },
  exchange: {
    b: {
      prompt: 'Clive has swapped pawns early. What are you playing for?',
      options: [
        { label: 'Keep pieces on and create an imbalance', quality: 'best', verdict: 'Right. Give him something he has to think about.' },
        { label: 'Copy his moves and stay solid', quality: 'poor', verdict: "That's his plan, not yours. It'll be a draw by move thirty." },
        { label: 'Accept an early queen swap', quality: 'poor', verdict: 'Exactly what he wants.' },
      ],
    },
    w: {
      prompt: "Clive's set up to swap everything. Your plan?",
      options: [
        { label: 'Keep the tension, avoid trades, build a pawn majority', quality: 'best', verdict: 'Good. Make him defend for a long time.' },
        { label: 'Attack with everything', quality: 'ok', verdict: 'It might work, but he defends quite happily.' },
        { label: 'Trade queens early', quality: 'poor', verdict: "A queenless middlegame is exactly what he's hoping for." },
      ],
    },
  },
  'ruy-lopez': {
    b: {
      prompt: "Priya's Ruy Lopez, straight from the book. Your plan?",
      options: [
        { label: 'Queenside space with ...Na5 and ...c5', quality: 'best', verdict: 'The classical plan. Now she has to think for herself.' },
        { label: 'An early ...d5 break', quality: 'ok', verdict: "Sharp, and she'll know the theory. Be sure of your moves." },
        { label: 'Sit back and defend', quality: 'poor', verdict: 'Passive. The Ruy squeezes you slowly if you let it.' },
      ],
    },
    w: {
      prompt: 'The Ruy Lopez. How do you build?',
      options: [
        { label: 'h3, then Nbd2–f1–g3 and prepare d4', quality: 'best', verdict: "The main-line plan. When her book ends, she's on her own." },
        { label: 'Swap into an endgame early', quality: 'ok', verdict: 'Playable, but it lets her off the hook.' },
        { label: 'Attack on the queenside', quality: 'poor', verdict: "That's her side of the board." },
      ],
    },
  },
  petroff: {
    w: {
      prompt: "Graham's Petroff: solid and symmetrical. Your plan?",
      options: [
        { label: 'Keep pieces on and play for a small edge, with c4', quality: 'best', verdict: 'Right. A small edge, kept for a long time.' },
        { label: 'A wild kingside attack', quality: 'ok', verdict: "Possible, but his position has no weaknesses yet." },
        { label: 'Trade queens', quality: 'poor', verdict: 'Now it really is a draw.' },
      ],
    },
  },
  catalan: {
    b: {
      prompt: "Toby's Catalan. That bishop on g2 is his whole idea. Your plan?",
      options: [
        { label: 'Develop, then free yourself with ...c5 or ...e5', quality: 'best', verdict: 'Good. Break out before the bishop takes over.' },
        { label: 'Attack on the kingside', quality: 'ok', verdict: 'Ambitious. His king is safe behind that bishop.' },
        { label: 'Hold on to the extra c4 pawn at all costs', quality: 'poor', verdict: 'The Catalan punishes greed. Give it back when needed.' },
      ],
    },
  },
  'caro-kann': {
    b: {
      prompt: 'The Caro-Kann. Solid so far. Your plan?',
      options: [
        { label: 'Finish developing, then break with ...c5', quality: 'best', verdict: 'The classical way. Solid first, then hit the centre.' },
        { label: 'Swap pieces towards an endgame', quality: 'ok', verdict: 'Your pawns are in good shape for an endgame. Reasonable.' },
        { label: 'Push ...g5 and attack', quality: 'poor', verdict: 'Not with this structure. Your strength is being solid.' },
      ],
    },
  },
  kid: {
    b: {
      prompt: "The King's Indian. White has the centre. Your plan?",
      options: [
        { label: 'Strike with ...e5, then go for the king with ...f5', quality: 'best', verdict: "That's the King's Indian. Hit the centre, then attack." },
        { label: 'Hit the centre with ...c5 instead', quality: 'ok', verdict: 'A reasonable alternative, and a sharp one.' },
        { label: 'Wait and let White expand', quality: 'poor', verdict: 'White will take the whole board. You have to hit back.' },
      ],
    },
  },
  sicilian: {
    b: {
      prompt: 'The Sicilian. How do you play it?',
      options: [
        { label: 'Counterattack on the queenside with ...b5 and the open c-file', quality: 'best', verdict: "Right. That's what the Sicilian is for. The c-file is yours." },
        { label: 'Break in the centre with ...d5 when it is safe', quality: 'ok', verdict: "A good freeing move, if you've prepared it properly." },
        { label: 'Castle queenside and sit tight', quality: 'poor', verdict: 'Your queenside pawns have already moved. That king has no cover.' },
      ],
    },
    w: {
      prompt: 'The Sicilian. How will you play it?',
      options: [
        { label: 'Attack on the kingside: f3 or f4, then g4', quality: 'best', verdict: 'The main plan. Race him, and be quick about it.' },
        { label: 'Slow play in the centre', quality: 'ok', verdict: 'Fine, but it gives him time for his queenside play.' },
        { label: 'Trade pieces early', quality: 'poor', verdict: 'His queenside pawns get better as pieces come off.' },
      ],
    },
  },
  nimzo: {
    w: {
      prompt: 'The Nimzo-Indian. You may have the two bishops. Your plan?',
      options: [
        { label: 'Open the position for your bishops', quality: 'best', verdict: 'Right. Bishops want open lines.' },
        { label: 'Close the centre and attack the kingside', quality: 'ok', verdict: "Possible, but it suits his knights." },
        { label: 'Trade off your bishops', quality: 'poor', verdict: "That throws away the one thing you had." },
      ],
    },
  },
}

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
