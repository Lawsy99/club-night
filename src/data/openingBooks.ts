// Each character's signature openings (design document, "Signature openings"),
// as main lines in ordinary notation from the starting position. A book line
// includes the player's expected replies; while the game follows a line, the
// character plays the next book move. Once the player leaves every line, the
// engine takes over. All lines are standard theory, checked for legality by
// src/logic/openingBook.test.ts.

export type OpeningBook = {
  /** Lines when the character has White. */
  white: string[]
  /** Lines when the character has Black. */
  black: string[]
}

const LONDON = [
  '1. d4 d5 2. Bf4 Nf6 3. e3 e6 4. Nf3 c5 5. c3 Nc6 6. Nbd2 Bd6 7. Bg3 O-O 8. Bd3',
  '1. d4 Nf6 2. Bf4 g6 3. e3 Bg7 4. Nf3 O-O 5. Be2 d6 6. O-O Nbd7 7. h3',
  '1. d4 d5 2. Bf4 c5 3. e3 Nc6 4. c3 Nf6 5. Nd2 e6 6. Ngf3 Bd6 7. Bg3 O-O 8. Bd3',
  '1. d4 e6 2. Bf4 d5 3. e3 Nf6 4. Nf3 c5 5. c3 Nc6 6. Nbd2 Bd6 7. Bg3',
]

const FRENCH = [
  '1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Be7 5. e5 Nfd7 6. Bxe7 Qxe7 7. f4 O-O 8. Nf3 c5',
  '1. e4 e6 2. d4 d5 3. e5 c5 4. c3 Nc6 5. Nf3 Qb6 6. a3 c4 7. Nbd2 Na5',
  '1. e4 e6 2. d4 d5 3. Nd2 Nf6 4. e5 Nfd7 5. Bd3 c5 6. c3 Nc6 7. Ne2 cxd4 8. cxd4 f6',
  '1. e4 e6 2. d4 d5 3. exd5 exd5 4. Nf3 Nf6 5. Bd3 Bd6 6. O-O O-O',
  '1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7',
]

const QGD = [
  '1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 h6 7. Bh4 b6',
  '1. d4 d5 2. c4 e6 3. Nf3 Nf6 4. Nc3 Be7 5. Bf4 O-O 6. e3 c5',
  '1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. cxd5 exd5 5. Bg5 Be7 6. e3 O-O 7. Bd3 Nbd7',
  '1. d4 d5 2. Nf3 Nf6 3. c4 e6 4. Nc3 Be7 5. Bg5 O-O 6. e3 h6',
]

const PRIYA_RUY = [
  '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5 10. Bc2 c5 11. d4 Qc7',
  '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d5 9. exd5 Nxd5 10. Nxe5 Nxe5 11. Rxe5 c6',
  '1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4 Nd6 6. Bxc6 dxc6 7. dxe5 Nf5 8. Qxd8+ Kxd8',
  '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Bxc6 dxc6 5. O-O f6 6. d4 exd4 7. Nxd4 c5',
]

const ITALIAN_TWO_KNIGHTS = [
  '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d3 d6 6. O-O O-O 7. Re1 a6 8. Bb3 Ba7',
  '1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Na5 6. Bb5+ c6 7. dxc6 bxc6 8. Be2 h6 9. Nf3 e4 10. Ne5',
  '1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d3 Be7 5. O-O O-O 6. Re1 d6 7. c3',
  '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 d6 6. c3 O-O',
]

export const OPENING_BOOKS: Record<string, OpeningBook> = {
  marjorie: { white: LONDON, black: [...FRENCH, ...QGD] },
  dex: {
    white: [
      // King's Gambit
      '1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ne5 Nf6 6. Bc4 d5 7. exd5 Bd6',
      '1. e4 e5 2. f4 exf4 3. Nf3 d6 4. d4 g5 5. h4 g4 6. Ng1',
      '1. e4 e5 2. f4 Bc5 3. Nf3 d6 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+',
      // Danish Gambit
      '1. e4 e5 2. d4 exd4 3. c3 dxc3 4. Bc4 cxb2 5. Bxb2 d5 6. Bxd5 Nf6 7. Bxf7+ Kxf7 8. Qxd8 Bb4+',
      '1. e4 e5 2. d4 exd4 3. c3 d5 4. exd5 Qxd5 5. cxd4 Nc6 6. Nf3 Bg4 7. Be2',
    ],
    black: [
      // Stafford Gambit
      '1. e4 e5 2. Nf3 Nf6 3. Nxe5 Nc6 4. Nxc6 dxc6 5. d3 Bc5 6. Be2 h5 7. c3 Ng4',
      '1. e4 e5 2. Nf3 Nf6 3. Nxe5 Nc6 4. Nxc6 dxc6 5. Nc3 Bc5 6. Bc4 Ng4 7. O-O Qh4',
      '1. e4 e5 2. Nf3 Nf6 3. Nxe5 Nc6 4. Nxc6 dxc6 5. e5 Ne4 6. d3 Bc5 7. dxe4 Bxf2+',
      // Englund Gambit
      '1. d4 e5 2. dxe5 Nc6 3. Nf3 Qe7 4. Bf4 Qb4+ 5. Bd2 Qxb2 6. Nc3 Bb4',
      '1. d4 e5 2. dxe5 Nc6 3. Nf3 Qe7 4. Qd5 f6 5. exf6 Nxf6 6. Qb3 d5',
    ],
  },
  toby: {
    white: [
      // Catalan
      '1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2 Be7 5. Nf3 O-O 6. O-O dxc4 7. Qc2 a6 8. a4 Bd7',
      '1. d4 d5 2. c4 e6 3. Nf3 Nf6 4. g3 Be7 5. Bg2 O-O 6. O-O dxc4 7. Qc2 a6 8. Qxc4 b5',
      '1. d4 Nf6 2. c4 e6 3. g3 Bb4+ 4. Bd2 Be7 5. Bg2 d5 6. Nf3 O-O 7. O-O',
      '1. d4 Nf6 2. c4 g6 3. g3 Bg7 4. Bg2 O-O 5. Nc3 d6 6. Nf3 Nbd7 7. O-O e5',
    ],
    black: [
      // Najdorf Sicilian
      '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5 7. Nb3 Be6 8. f3 Be7',
      '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Be7 8. Qf3 Qc7',
      '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be2 e5 7. Nb3 Be7 8. O-O O-O',
      '1. e4 c5 2. Nf3 d6 3. Bb5+ Bd7 4. Bxd7+ Qxd7 5. O-O Nc6 6. c3 Nf6',
      // Nimzo-Indian
      '1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. Nf3 c5 7. O-O dxc4 8. Bxc4 Nbd7',
      '1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 O-O 5. a3 Bxc3+ 6. Qxc3 b6 7. Bg5 Bb7',
      '1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Ba6 5. b3 Bb4+ 6. Bd2 Be7',
    ],
  },
  graham: {
    white: [
      // Queen's Gambit
      '1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 h6 7. Bh4 b6',
      '1. d4 d5 2. c4 dxc4 3. Nf3 Nf6 4. e3 e6 5. Bxc4 c5 6. O-O a6',
      '1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 dxc4 5. a4 Bf5 6. e3 e6 7. Bxc4 Bb4',
      '1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bg5 O-O 6. e3',
    ],
    black: [
      // Petroff
      '1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4 5. d4 d5 6. Bd3 Nc6 7. O-O Be7 8. c4 Nb4',
      '1. e4 e5 2. Nf3 Nf6 3. d4 Nxe4 4. Bd3 d5 5. Nxe5 Nd7 6. Nxd7 Bxd7 7. O-O Bd6',
      '1. e4 e5 2. Nf3 Nf6 3. Nc3 Nc6 4. Bb5 Bb4 5. O-O O-O 6. d3 d6',
      ...QGD,
    ],
  },
  clive: {
    white: [
      // Exchange variations against everything
      '1. e4 e6 2. d4 d5 3. exd5 exd5 4. Bd3 Nc6 5. c3 Bd6 6. Nf3 Nge7',
      '1. e4 c6 2. d4 d5 3. exd5 cxd5 4. Bd3 Nc6 5. c3 Nf6 6. Bf4 Bg4',
      '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Bxc6 dxc6 5. O-O f6 6. d4 exd4 7. Nxd4 c5',
      '1. e4 c5 2. c3 d5 3. exd5 Qxd5 4. d4 Nf6 5. Nf3 e6 6. Be2 cxd4 7. cxd4 Nc6',
      '1. d4 d5 2. c4 c6 3. cxd5 cxd5 4. Nc3 Nf6 5. Bf4 Nc6 6. e3 Bf5',
    ],
    black: [
      // Berlin Defence
      '1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4 Nd6 6. Bxc6 dxc6 7. dxe5 Nf5 8. Qxd8+ Kxd8',
      '1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Bc5 5. c3 O-O 6. O-O d6',
      // Exchange Slav
      '1. d4 d5 2. c4 c6 3. cxd5 cxd5 4. Nc3 Nf6 5. Bf4 Nc6 6. e3 Bf5',
      '1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. cxd5 cxd5 5. Nc3 Nc6 6. Bf4 Bf5',
    ],
  },
  // Terry (Joseph, Sep 2026): the Bongcloud, the Grob, early queen raids and
  // cheap traps, played with complete sincerity. The mating lines are short
  // on purpose: they end the game if the player falls for them. Otherwise he
  // drops out of book into ordinary (and quite decent) chess.
  terry: {
    white: [
      // Bongcloud
      '1. e4 e5 2. Ke2 Nf6 3. Ke1 Nxe4 4. d3 Nf6 5. Nf3 Nc6 6. Be2 d5',
      '1. e4 c5 2. Ke2 Nc6 3. Kf3 e5 4. Kg3 Nf6 5. d3 d5 6. Nc3 d4',
      // Grob
      '1. g4 d5 2. Bg2 Bxg4 3. c4 c6 4. cxd5 cxd5 5. Qb3 Nc6 6. Qxb7 Nd4',
      '1. g4 e5 2. Bg2 d5 3. c4 dxc4 4. Qa4+ Bd7 5. Qxc4 Nc6 6. d3 Nf6',
      // Scholar's mate, and what he does when it's defended
      '1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7#',
      '1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7#',
      '1. e4 e5 2. Qh5 Nc6 3. Bc4 g6 4. Qf3 Nf6 5. Qb3 Qe7 6. Nc3 Nd4',
      // The Parachute: knight to the edge on move one
      '1. Nh3 d5 2. g3 e5 3. f4 Bxh3 4. Bxh3 exf4 5. O-O fxg3 6. hxg3 Qd7',
    ],
    black: [
      // Bongcloud, with Black
      '1. e4 e5 2. Nf3 Ke7 3. Bc4 d6 4. d4 Nf6 5. Nc3 Ke8 6. O-O Be7',
      // The Borg (the Grob, backwards)
      '1. e4 g5 2. d4 Bg7 3. Bxg5 c5 4. c3 cxd4 5. cxd4 Qb6 6. Nc3 Qxb2',
      '1. d4 g5 2. Bxg5 c5 3. dxc5 Qa5+ 4. Nc3 Qxc5 5. e4 Bg7 6. Nf3 Nc6',
      // Blackburne Shilling: a trap that mates if White grabs the pawn
      '1. e4 e5 2. Nf3 Nc6 3. Bc4 Nd4 4. Nxe5 Qg5 5. Nxf7 Qxg2 6. Rf1 Qxe4+ 7. Be2 Nf3#',
      '1. e4 e5 2. Nf3 Nc6 3. Bc4 Nd4 4. Nxd4 exd4 5. c3 Qg5 6. O-O d5',
      // Englund Gambit trap
      '1. d4 e5 2. dxe5 Nc6 3. Nf3 Qe7 4. Bf4 Qb4+ 5. Bd2 Qxb2 6. Bc3 Bb4 7. Qd2 Bxc3 8. Qxc3 Qc1#',
      // Fool's mate, should anyone oblige
      '1. f3 e5 2. g4 Qh4#',
      '1. g4 e5 2. f3 Qh4#',
      '1. f4 e5 2. g4 Qh4#',
    ],
  },
  priya: { white: PRIYA_RUY, black: [...PRIYA_RUY, ...QGD] },
  oscar: { white: ITALIAN_TWO_KNIGHTS, black: ITALIAN_TWO_KNIGHTS },
}
