// "I've never played" (Sep 2026): a short, hands-on walk through the moves
// before trial night, with Marjorie. One small task per piece; the board
// only allows legal moves, so trying is the lesson. Positions are checked for
// legality by src/logic/rulesTutorial.test.ts.

export type RulesStep = {
  title: string
  /** What Marjorie says: the rule, then the task. */
  say: string
  fen: string
  /** The square to reach, or 'mate' for a checkmate. */
  target: string
  /** When the move isn't it. */
  nudge: string
  /** When it is. */
  done: string
}

export const RULES_STEPS: RulesStep[] = [
  {
    title: 'The rook',
    say: 'Rooks move in straight lines, as far as they like: up, down, or sideways. Take that pawn with yours.',
    fen: '4k3/p7/8/8/8/8/8/R3K3 w - - 0 1',
    target: 'a7',
    nudge: 'Straight up the file, love. All the way.',
    done: 'That’s it. You take a piece by moving onto its square.',
  },
  {
    title: 'The bishop',
    say: 'Bishops move diagonally, as far as they like. Take the pawn.',
    fen: '4k3/8/8/5p2/8/8/8/1B2K3 w - - 0 1',
    target: 'f5',
    nudge: 'Corner to corner. Follow the diagonal.',
    done: 'Good. A bishop stays on its own colour all game.',
  },
  {
    title: 'The queen',
    say: 'The queen moves like a rook and a bishop together. She’s the strongest piece. Take the pawn.',
    fen: '4k3/3p4/8/8/8/8/8/3QK3 w - - 0 1',
    target: 'd7',
    nudge: 'Straight up. She can go anywhere a rook or a bishop could.',
    done: 'Lovely. Look after her: she’s worth nine pawns.',
  },
  {
    title: 'The knight',
    say: 'The knight jumps in an L: two squares one way, then one to the side. It can jump over pieces. Take the pawn.',
    fen: '4k3/8/8/8/3p4/8/2N5/4K3 w - - 0 1',
    target: 'd4',
    nudge: 'Two up, one across. Tap the knight to see where it can land.',
    done: 'That’s the knight. Everyone finds it odd at first.',
  },
  {
    title: 'The king',
    say: 'The king moves one square in any direction. Take that pawn, it’s right next to you.',
    fen: '8/8/8/8/8/k7/4p3/4K3 w - - 0 1',
    target: 'e2',
    nudge: 'Just one square. It’s right in front of you.',
    done: 'Good. The king is slow, but the whole game is about him.',
  },
  {
    title: 'The pawn',
    say: 'Pawns move forward one square (two on their first move), but they take diagonally. Take the black pawn.',
    fen: '4k3/8/8/8/3p4/4P3/8/4K3 w - - 0 1',
    target: 'd4',
    nudge: 'Diagonally forward. Pawns never take straight ahead.',
    done: 'That catches everyone out. Now you know.',
  },
  {
    title: 'A new queen',
    say: 'A pawn that reaches the far end becomes a queen (or anything else you like). Push it.',
    fen: '4k3/1P6/8/8/8/8/8/4K3 w - - 0 1',
    target: 'b8',
    nudge: 'One more square forward.',
    done: 'A new queen. It happens more often than you’d think.',
  },
  {
    // Joseph, Sep 2026: new players should know what the pieces are worth.
    title: 'What pieces are worth',
    say: 'Pieces aren’t equal. Roughly: a pawn is 1, a knight 3, a bishop 3, a rook 5, the queen 9. Your rook can take the knight or the queen. Take the one worth more.',
    fen: '7k/3q4/8/8/8/8/8/1n1RK3 w - - 0 1',
    target: 'd7',
    nudge: 'The knight’s worth three. The queen’s worth nine. Go for her.',
    done: 'Nine for nothing. Before you swap pieces, add them up: never give a rook for a knight if you can help it.',
  },
  {
    title: 'Checkmate',
    say: 'When the king is attacked, that’s check, and it must get out. If it can’t, that’s checkmate, and the game is won. Their king is stuck behind its pawns. Finish it with your rook.',
    fen: '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1',
    target: 'mate',
    nudge: 'Where can your rook check the king, with nowhere for it to run?',
    done: 'Checkmate. That’s the whole game. Everything else is getting there.',
  },
]
