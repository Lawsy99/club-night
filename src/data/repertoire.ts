// The player's repertoire (design document, "Your repertoire"): one opening
// as White and one defence against each of 1.e4 and 1.d4, chosen when Coach
// Pemberton asks "Right. What do you play?". Each choice has a few main
// lines (standard theory, in ordinary notation), used to show "your move"
// notes during assisted and guided games. Lines are checked for legality,
// and for agreeing with each other, by repertoire.test.ts.

export type RepertoireSlot = 'white' | 'vsE4' | 'vsD4'

export type OpeningChoice = {
  id: string
  name: string
  /** Pemberton's one-line description when choosing. */
  blurb: string
  lines: string[][]
}

export const REPERTOIRE_CHOICES: Record<RepertoireSlot, OpeningChoice[]> = {
  white: [
    {
      id: 'italian',
      name: 'the Italian',
      blurb: 'Attacking. Quick development and an eye on f7.',
      lines: [
        ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd3', 'd6', 'O-O', 'O-O', 'Re1'],
        ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'd3', 'Be7', 'O-O', 'O-O', 'Re1'],
        ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'd3', 'Bc5', 'c3', 'd6', 'O-O'],
        ['e4', 'e5', 'Nf3', 'Nf6', 'Nxe5', 'd6', 'Nf3', 'Nxe4', 'd4'],
        ['e4', 'e5', 'Nf3', 'Nf6', 'Nxe5', 'Nc6', 'Nxc6', 'dxc6', 'd3'],
        ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3'],
        ['e4', 'c5', 'Nf3', 'Nc6', 'd4', 'cxd4', 'Nxd4'],
        ['e4', 'e6', 'd4', 'd5', 'Nc3'],
        ['e4', 'c6', 'd4', 'd5', 'Nc3'],
      ],
    },
    {
      id: 'london',
      name: 'the London',
      blurb: 'A solid setup you can play against anything. Marjorie approves.',
      lines: [
        ['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6', 'Nf3', 'c5', 'c3', 'Nc6', 'Nbd2', 'Bd6', 'Bg3', 'O-O', 'Bd3'],
        ['d4', 'd5', 'Bf4', 'c5', 'e3', 'Nc6', 'c3', 'Nf6', 'Nd2'],
        ['d4', 'Nf6', 'Bf4', 'g6', 'e3', 'Bg7', 'Nf3', 'O-O', 'Be2', 'd6', 'h3'],
        ['d4', 'Nf6', 'Bf4', 'e6', 'e3', 'c5', 'c3', 'd5', 'Nd2'],
        ['d4', 'Nf6', 'Bf4', 'd5', 'e3', 'e6', 'Nf3', 'c5', 'c3'],
        ['d4', 'e5', 'dxe5', 'Nc6', 'Nf3', 'Qe7', 'Bf4'],
      ],
    },
    {
      id: 'queens-gambit',
      name: "the Queen's Gambit",
      blurb: 'Classical. Space in the centre and a long, patient game.',
      lines: [
        ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e3', 'O-O', 'Nf3'],
        ['d4', 'd5', 'c4', 'c6', 'Nf3', 'Nf6', 'Nc3'],
        ['d4', 'd5', 'c4', 'dxc4', 'e3'],
        ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4', 'e3'],
        ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'd5', 'Bg5'],
        ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3'],
        ['d4', 'e5', 'dxe5', 'Nc6', 'Nf3'],
      ],
    },
  ],
  vsE4: [
    {
      id: 'sicilian',
      name: 'the Sicilian',
      blurb: 'Sharp. Unbalanced positions where both sides play to win.',
      lines: [
        ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'],
        ['e4', 'c5', 'c3', 'Nf6', 'e5', 'Nd5'],
        ['e4', 'c5', 'Nc3', 'Nc6'],
        ['e4', 'c5', 'Bc4', 'e6'],
        ['e4', 'c5', 'd4', 'cxd4'],
      ],
    },
    {
      id: 'caro-kann',
      name: 'the Caro-Kann',
      blurb: 'Solid. Hard to break, and Toby will be delighted.',
      lines: [
        ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5', 'Ng3', 'Bg6'],
        ['e4', 'c6', 'd4', 'd5', 'Nd2', 'dxe4', 'Nxe4', 'Bf5'],
        ['e4', 'c6', 'd4', 'd5', 'e5', 'Bf5'],
        ['e4', 'c6', 'd4', 'd5', 'exd5', 'cxd5'],
        ['e4', 'c6', 'Nf3', 'd5', 'Nc3', 'Bg4'],
        ['e4', 'c6', 'Nc3', 'd5', 'Nf3', 'Bg4'],
        ['e4', 'c6', 'Bc4', 'd5', 'exd5', 'cxd5'],
      ],
    },
    {
      id: 'e5',
      name: '1...e5',
      blurb: 'Classical. Meet the centre head on.',
      lines: [
        ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd3', 'd6'],
        ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'd6', 'c3', 'O-O'],
        ['e4', 'e5', 'Nf3', 'Nc6', 'd4', 'exd4', 'Nxd4', 'Nf6'],
        ['e4', 'e5', 'Nf3', 'Nc6', 'Nc3', 'Nf6'],
        ['e4', 'e5', 'f4', 'exf4', 'Nf3', 'd6'],
        ['e4', 'e5', 'd4', 'exd4', 'c3', 'd5'],
        ['e4', 'e5', 'Bc4', 'Nf6'],
      ],
    },
  ],
  vsD4: [
    {
      id: 'kid',
      name: "the King's Indian",
      blurb: 'Attacking. Let White have the centre, then hit it.',
      lines: [
        ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O', 'Be2', 'e5'],
        ['d4', 'Nf6', 'c4', 'g6', 'g3', 'Bg7', 'Bg2', 'O-O', 'Nc3', 'd6'],
        ['d4', 'Nf6', 'c4', 'g6', 'Nf3', 'Bg7', 'Nc3', 'O-O', 'e4', 'd6'],
        ['d4', 'Nf6', 'Bf4', 'g6', 'e3', 'Bg7', 'Nf3', 'O-O'],
        ['d4', 'Nf6', 'Nf3', 'g6', 'c4', 'Bg7'],
        ['d4', 'Nf6', 'Nf3', 'g6', 'g3', 'Bg7', 'Bg2', 'O-O'],
      ],
    },
    {
      id: 'qgd',
      name: "the Queen's Gambit Declined",
      blurb: 'Solid. Sound, respected, and very hard to crack.',
      lines: [
        ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e3', 'O-O', 'Nf3', 'h6'],
        ['d4', 'd5', 'c4', 'e6', 'Nf3', 'Nf6', 'Nc3', 'Be7'],
        ['d4', 'd5', 'c4', 'e6', 'Nf3', 'Nf6', 'g3', 'Be7', 'Bg2', 'O-O'],
        ['d4', 'd5', 'c4', 'e6', 'g3', 'Nf6', 'Bg2', 'Be7', 'Nf3', 'O-O'],
        ['d4', 'd5', 'c4', 'e6', 'cxd5', 'exd5', 'Nc3', 'Nf6'],
        ['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6', 'Nf3', 'c5'],
        ['d4', 'd5', 'Nf3', 'Nf6', 'c4', 'e6'],
      ],
    },
  ],
}

export type Repertoire = Record<RepertoireSlot, string>

export function findChoice(slot: RepertoireSlot, id: string): OpeningChoice | undefined {
  return REPERTOIRE_CHOICES[slot].find((c) => c.id === id)
}
