// Coach Pemberton's scouting reports (design document, "Scouting reports"):
// hand-written base lines per character, with the player's record and, for
// Toby, the weakness he's targeting, filled in. Advice kept sound.

export type ScoutingNotes = {
  /** When the character has White (the player has Black). */
  asWhite: string
  /** When the character has Black (the player has White). */
  asBlack: string
  style: string
  /** "him" or "her", for the record line. */
  pronoun: 'him' | 'her'
}

export const SCOUTING: Record<string, ScoutingNotes> = {
  marjorie: {
    asWhite: "She'll play the London: d4, Bf4, e3, every time. Hit back early with ...c5 and ...Qb6.",
    asBlack: "The French against 1.e4, the Queen's Gambit Declined against 1.d4. She's happy to wait. Don't be.",
    style: 'Solid as a rock, and her endgames are better than they look.',
    pronoun: 'her',
  },
  dex: {
    asWhite: "He'll gambit something on move two: the King's Gambit or the Danish. Take it, develop, castle.",
    asBlack: 'The Stafford against 1.e4, the Englund against 1.d4. Calm development refutes both.',
    style: "He'll sacrifice something before move 15. Take it and trade queens.",
    pronoun: 'him',
  },
  oscar: {
    asWhite: 'The Italian, played quickly. Castle early and keep an eye on f7.',
    asBlack: 'The Two Knights against 1.e4. If you go Ng5, know what ...d5 and ...Na5 mean.',
    style: "Fast and confident. Take your time. He won't.",
    pronoun: 'him',
  },
  clive: {
    asWhite: "He'll swap the centre pawns in whatever you play. Keep pieces on and give him problems.",
    asBlack: 'The Berlin against 1.e4, the Exchange Slav against 1.d4. Both built to be drawn.',
    style: "He'll offer a draw around move twelve. Don't take it.",
    pronoun: 'him',
  },
  priya: {
    asWhite: 'The Ruy Lopez, main line, twenty moves deep. Know your plans, not just your moves.',
    asBlack: "The Closed Ruy against 1.e4, the Queen's Gambit Declined against 1.d4.",
    style: 'Word-perfect in the opening. Leave the book and she slows right down.',
    pronoun: 'her',
  },
  graham: {
    asWhite: "The Queen's Gambit, by the book. Develop, castle, and find a pawn break.",
    asBlack: "The Petroff against 1.e4, the Queen's Gambit Declined against 1.d4. Correct, and hard to crack.",
    style: "Principled. You'll have to earn every point.",
    pronoun: 'him',
  },
  toby: {
    asWhite: 'The Catalan. That bishop on g2 is the whole idea. Break out with ...c5 or ...e5.',
    asBlack: 'The Najdorf against 1.e4, the Nimzo-Indian against 1.d4. He knows them well.',
    style: 'Always a little stronger than you. You know that.',
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
}
