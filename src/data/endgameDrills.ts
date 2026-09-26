// Finishing lessons (Joseph, Sep 2026: "we need some stuff on finishing
// too"). You play a won ending out against the engine, which defends as well
// as it can. The position is chosen by your rating, so the same lesson works
// for a beginner (two rooks) and a strong player (the Lucena position).
// See docs/learning-plan.md.

export type EndgameGoal = 'mate' | 'promote'

export type EndgamePosition = {
  id: string
  title: string
  fen: string
  goal: EndgameGoal
  /** Your moves allowed before it counts as too slow. */
  maxMoves: number
  /** Ratings it suits (the first match is used). */
  upTo: number
  /** Pemberton, before you start: the method in a line or two. */
  intro: string
  /** When you've done it. */
  success: string
}

/** A lesson's drill: positions from easiest to hardest; you get the one for your rating. */
export const ENDGAME_DRILLS: Record<string, EndgamePosition[]> = {
  'lone-king': [
    {
      id: 'two-rooks',
      title: 'Two rooks against a king',
      fen: '8/8/8/4k3/8/8/8/R3K2R w - - 0 1',
      goal: 'mate',
      maxMoves: 12,
      upTo: 899,
      intro: 'The ladder. One rook cuts the king off along a rank, the other gives check on the next one. Step by step, to the edge.',
      success: 'That’s the ladder. You’ll never need more than that against a bare king.',
    },
    {
      id: 'queen',
      title: 'King and queen against a king',
      fen: '8/8/8/4k3/8/8/8/3QK3 w - - 0 1',
      goal: 'mate',
      maxMoves: 15,
      upTo: 1399,
      intro: 'Use the queen to shrink the king’s box, a knight’s move away. Then bring your own king up. Watch out for stalemate.',
      success: 'Queen boxes it in, king comes to help. You’ll do that in your sleep now.',
    },
    {
      id: 'rook',
      title: 'King and rook against a king',
      fen: '8/8/8/4k3/8/8/8/R3K3 w - - 0 1',
      goal: 'mate',
      maxMoves: 25,
      upTo: 9999,
      intro: 'Harder: the rook cuts the king off, and your king does the pushing. Opposition, then check. Don’t let the rook be taken.',
      success: 'Rook cuts off, king pushes, then the check. That’s the technique.',
    },
  ],
  'king-pawn': [
    {
      id: 'king-in-front',
      title: 'King in front of the pawn',
      fen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
      goal: 'promote',
      maxMoves: 12,
      upTo: 9999,
      intro: 'Your king in front of its pawn, on the sixth rank: that’s a win, whoever’s move it is. Use the king to clear the way, and only then push.',
      success: 'The king leads, the pawn follows. Remember the rule: king in front on the sixth wins.',
    },
  ],
  'rook-ending': [
    {
      id: 'rook-mate',
      title: 'King and rook against a king',
      fen: '8/8/8/4k3/8/8/8/R3K3 w - - 0 1',
      goal: 'mate',
      maxMoves: 25,
      upTo: 1499,
      intro: 'Every rook ending you win ends like this. The rook cuts the king off, your king does the pushing.',
      success: 'That’s the finish every rook ending needs.',
    },
    {
      id: 'lucena',
      title: 'The Lucena position',
      fen: '1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1',
      goal: 'promote',
      maxMoves: 20,
      upTo: 9999,
      intro: 'The most important rook ending there is. Drive the king away with a check, then build a bridge with your rook on the fourth rank.',
      success: 'That’s the bridge. Know the Lucena and most won rook endings are simple.',
    },
  ],
}

/** The position that suits the player's rating. */
export function endgameFor(drill: string, rating: number): EndgamePosition | undefined {
  const list = ENDGAME_DRILLS[drill]
  return list?.find((p) => rating <= p.upTo) ?? list?.at(-1)
}
