// Pemberton's traps (Joseph, Sep 2026): now and then, the coached game
// starts with him telling you what he's about to do ("My knight's going to
// d4. Don't take the pawn."), then doing it. Afterwards he says whether you
// avoided it, got out of it, or fell for it.
//
// Each scenario is data, not a script: the line he plays (checked for
// legality by the tests), who has which colour, the rating band it suits,
// and his three short lines. Whether you escaped is decided by the engine a
// few moves after the trap: were you still all right?
//
// All are well-known, sound teaching traps and attacks.

export type CoachScenario = {
  id: string
  /** Pemberton's colour in this scenario. */
  coachColour: 'w' | 'b'
  /** Player ratings it suits. */
  minRating: number
  maxRating: number
  /** The set-up, in ordinary notation, including the replies he's hoping for. */
  setup: string
  /** How he follows up if you take the bait (so it's shown properly, not left to chance). */
  punish?: string[]
  /** Moves after the line ends at which he judges how you got on. */
  judgeAfter: number
  /** Before the game. */
  announce: string
  /** You never went into it. */
  avoided: string
  /** You went into it and came out fine. */
  escaped: string
  /** It worked. */
  fell: string
}

export const COACH_SCENARIOS: CoachScenario[] = [
  {
    id: 'scholars',
    coachColour: 'w',
    minRating: 0,
    maxRating: 1000,
    setup: '1. e4 e5 2. Bc4 Nc6 3. Qh5',
    punish: ['1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7#'],
    judgeAfter: 4,
    announce: 'Tonight I’m going after f7 with my queen and bishop. The oldest trick there is. Let’s see if you know the answer.',
    avoided: 'You didn’t let me set it up. That’s one answer.',
    escaped: 'Good. You defended f7 and my queen is out too early. Remember that feeling.',
    fell: 'That’s the one. Queen and bishop on f7. Look at it now, so it never happens in a match.',
  },
  {
    id: 'blackburne',
    coachColour: 'b',
    minRating: 0,
    maxRating: 1200,
    setup: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Nd4',
    punish: [
      '1. e4 e5 2. Nf3 Nc6 3. Bc4 Nd4 4. Nxe5 Qg5 5. Nxf7 Qxg2 6. Rf1 Qxe4+ 7. Be2 Nf3#',
      '1. e4 e5 2. Nf3 Nc6 3. Bc4 Nd4 4. Nxe5 Qg5 5. Bxf7+ Ke7 6. O-O Qxe5',
    ],
    judgeAfter: 6,
    announce: 'If you play the Italian, my knight goes to d4 and leaves the pawn on e5 hanging. Think before you take it.',
    avoided: 'No Italian tonight. Fair enough: it only works if you play into it.',
    escaped: 'You didn’t fall for it. The pawn on e5 was poisoned. Now you know why.',
    fell: 'There it is. The pawn was never free. When something looks free, ask why it’s there.',
  },
  {
    id: 'englund',
    coachColour: 'b',
    minRating: 700,
    maxRating: 1500,
    setup: '1. d4 e5 2. dxe5 Nc6 3. Nf3 Qe7',
    punish: ['1. d4 e5 2. dxe5 Nc6 3. Nf3 Qe7 4. Bf4 Qb4+ 5. Bd2 Qxb2 6. Bc3 Bb4 7. Qd2 Bxc3 8. Qxc3 Qc1#'],
    judgeAfter: 6,
    announce: 'If you open with d4, I’ll offer you a pawn on move one. Take it if you like. Then be careful where your pieces go.',
    avoided: 'No d4 tonight. The trap waits for another day.',
    escaped: 'Well handled. You took the pawn and didn’t give me the checks I wanted.',
    fell: 'That’s the Englund trap. My queen and bishop against your queenside. Look at where it started.',
  },
  {
    id: 'fried-liver',
    coachColour: 'w',
    minRating: 900,
    maxRating: 1600,
    setup: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5',
    punish: ['1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Nxd5 6. Nxf7 Kxf7 7. Qf3+ Ke6 8. Nc3'],
    judgeAfter: 6,
    announce: 'Tonight: the Two Knights. My knight goes to g5 and attacks f7. There’s a right answer. Find it.',
    avoided: 'You didn’t go into the Two Knights. Sensible, if a little cautious.',
    escaped: 'Good. You hit back in the centre instead of just defending. That’s the idea.',
    fell: 'That’s why they call it the Fried Liver. The answer was to hit back in the centre, not to sit and wait.',
  },
  {
    id: 'fishing-pole',
    coachColour: 'b',
    minRating: 1100,
    maxRating: 1900,
    setup: '1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Ng4 5. h3 h5',
    punish: ['1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Ng4 5. h3 h5 6. hxg4 hxg4 7. Ne1 Qh4 8. f3 g3'],
    judgeAfter: 6,
    announce: 'If you play the Ruy Lopez, my knight is going to g4, and I’ll leave it there. Think hard before you take it.',
    avoided: 'No Ruy Lopez tonight. The knight stays in the box.',
    escaped: 'You left the knight alone, or took it safely. Either way, you saw the h-file coming.',
    fell: 'The Fishing Pole. Take the knight and the h-file opens straight at your king. Remember it.',
  },
  {
    id: 'marshall',
    coachColour: 'b',
    minRating: 1700,
    maxRating: 3000,
    setup: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d5',
    punish: ['1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d5 9. exd5 Nxd5 10. Nxe5 Nxe5 11. Rxe5 c6'],
    judgeAfter: 10,
    announce: 'If you play the Ruy Lopez tonight, I’ll give you a pawn for an attack on your king. The Marshall. Hold on if you can.',
    avoided: 'You stayed out of the Marshall. Plenty of grandmasters do.',
    escaped: 'You held on. A pawn up, and still standing. That’s the hard part of the Marshall.',
    fell: 'That’s what the pawn was for. In the Marshall, defend first and count pawns later.',
  },
  {
    id: 'queens-gambit-trap',
    coachColour: 'w',
    minRating: 1200,
    maxRating: 2000,
    setup: '1. d4 d5 2. c4 dxc4 3. e3 b5 4. a4',
    punish: ['1. d4 d5 2. c4 dxc4 3. e3 b5 4. a4 c6 5. axb5 cxb5 6. Qf3'],
    judgeAfter: 4,
    announce: 'If you take my pawn on c4, try to keep it. I’ll show you why that’s hard.',
    avoided: 'You didn’t take the pawn, or didn’t cling to it. That’s the grown-up answer.',
    escaped: 'You came through it. That pawn on c4 is harder to keep than it looks.',
    fell: 'That’s why you don’t hang on to the c4 pawn. My queen comes to f3, down the long diagonal at your rook.',
  },
]
