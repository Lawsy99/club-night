// Coach Pemberton's scouting reports (design document, "Scouting reports"):
// hand-written base lines per character, with the player's record and, for
// Toby, the weakness he's targeting, filled in. Advice kept sound.
// Sep 2026 (Joseph): several lines about each character's style, used in turn,
// so meeting someone again doesn't mean hearing the same thing again.

export type ScoutingNotes = {
  /** When the character has White (the player has Black). */
  asWhite: string
  /** When the character has Black (the player has White). */
  asBlack: string
  /** Their style, one line each time you meet: used in order, never repeated until all are used. */
  styles: string[]
  /** "him" or "her", for the record line. */
  pronoun: 'him' | 'her'
}

export const SCOUTING: Record<string, ScoutingNotes> = {
  marjorie: {
    asWhite: "She'll play the London: d4, Bf4, e3, every time. Hit back early with ...c5 and ...Qb6.",
    asBlack: "The French against 1.e4, the Queen's Gambit Declined against 1.d4. She's happy to wait. Don't be.",
    styles: [
      'Solid as a rock, and her endgames are better than they look.',
      'She’s never in a hurry. If you are, she’ll notice.',
      'She doesn’t blunder much. Make her think, and keep making her think.',
    ],
    pronoun: 'her',
  },
  dex: {
    asWhite: "He'll gambit something on move two: the King's Gambit or the Danish. Take it, develop, castle.",
    asBlack: 'The Stafford against 1.e4, the Englund against 1.d4. Calm development refutes both.',
    styles: [
      "He'll sacrifice something before move 15. Take it and trade queens.",
      'He plays fast when he’s winning and faster when he isn’t. Slow the game down.',
      'Once the queens are off, most of his tricks go with them.',
    ],
    pronoun: 'him',
  },
  oscar: {
    asWhite: 'The Italian, played quickly. Castle early and keep an eye on f7.',
    asBlack: 'The Two Knights against 1.e4. If you go Ng5, know what ...d5 and ...Na5 mean.',
    styles: [
      "Fast and confident. Take your time. He won't.",
      'He calculates well for eleven. Give him positions where calculating isn’t enough.',
      'He hates being a pawn down. Win one and sit on it.',
    ],
    pronoun: 'him',
  },
  clive: {
    asWhite: "He'll swap the centre pawns in whatever you play. Keep pieces on and give him problems.",
    asBlack: 'The Berlin against 1.e4, the Exchange Slav against 1.d4. Both built to be drawn.',
    styles: [
      "He'll offer a draw around move twelve. Don't take it.",
      'Symmetrical positions are his home. Unbalance it: different pawns, different pieces.',
      'He plays for one mistake, and he waits a long time for it.',
    ],
    pronoun: 'him',
  },
  priya: {
    asWhite: 'The Ruy Lopez, main line, twenty moves deep. Know your plans, not just your moves.',
    asBlack: "The Closed Ruy against 1.e4, the Queen's Gambit Declined against 1.d4.",
    styles: [
      'Word-perfect in the opening. Leave the book and she slows right down.',
      'She’s always prepared. What she hasn’t prepared is where you win.',
      'She trusts the book more than her eyes. Give her something the book doesn’t cover.',
    ],
    pronoun: 'her',
  },
  graham: {
    asWhite: "The Queen's Gambit, by the book. Develop, castle, and find a pawn break.",
    asBlack: "The Petroff against 1.e4, the Queen's Gambit Declined against 1.d4. Correct, and hard to crack.",
    styles: [
      "Principled. You'll have to earn every point.",
      'He does everything properly. Proper can still be too slow.',
      'He won’t take risks. Neither should you, until the position asks you to.',
    ],
    pronoun: 'him',
  },
  ray: {
    asWhite: 'The Italian, played properly. He teaches it to the juniors every Thursday. Castle and don’t let him have f7.',
    asBlack: 'The Caro-Kann against 1.e4, the Queen’s Gambit Declined against 1.d4. Solid. You’ll have to make something happen.',
    styles: [
      'A teacher. He won’t beat himself. Tired by nine o’clock, mind.',
      'He knows the right plan in every opening he teaches. Play one he doesn’t.',
      'Long games suit you against him. He fades.',
    ],
    pronoun: 'him',
  },
  malcolm: {
    asWhite: "The Queen's Gambit, and he knows it better than the book. Develop, castle, and wait for a chance. It'll be small.",
    asBlack: 'The Closed Ruy against 1.e4, the Queen’s Gambit Declined against 1.d4. Patient. Very patient.',
    styles: [
      'Board one. Correct, patient, and he never offers a draw. You’ll need to be better for a long time.',
      'He wins small endings. Don’t give him one.',
      'He won’t fall for anything. You’ll have to outplay him.',
    ],
    pronoun: 'him',
  },
  terry: {
    asWhite:
      "Could be the king walking out on move two, could be g4, could be the queen out early for f7. Develop, guard f7, and don't grab anything that looks free.",
    asBlack: "Anything. If a pawn on e5 looks free after ...Nd4, it isn't. Develop and castle; he'll hand you the rest.",
    styles: [
      "Plays nonsense with total conviction. Out of the opening, he's better than you'd think. Don't laugh until it's over.",
      'Every trap he plays has a refutation. Look for it before you take anything.',
      'He’s at his most dangerous when you think you’ve already won.',
    ],
    pronoun: 'him',
  },
  toby: {
    asWhite: 'The Catalan. That bishop on g2 is the whole idea. Break out with ...c5 or ...e5.',
    asBlack: 'The Najdorf against 1.e4, the Nimzo-Indian against 1.d4. He knows them well.',
    // Deliberately thin next to everyone else's (story: Pemberton's favouritism).
    styles: ["You've seen him play.", 'He’s good. You know that.', 'Nothing new to add.'],
    pronoun: 'him',
  },
}

/** Readable names for opening families (see data/plans.ts OPENING_PATTERNS). */
export const OPENING_NAMES: Record<string, string> = {
  london: 'the London System',
  french: 'the French',
  qgd: "the Queen's Gambit Declined",
  gambit: 'early gambits',
  italian: 'the Italian',
  exchange: 'exchange variations',
  'ruy-lopez': 'the Ruy Lopez',
  petroff: 'the Petroff',
  catalan: 'the Catalan',
  sicilian: 'the Sicilian',
  nimzo: 'the Nimzo-Indian',
  'caro-kann': 'the Caro-Kann',
  kid: "the King's Indian",
}
