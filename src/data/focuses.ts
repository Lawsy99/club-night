// Pemberton's weekly focus (Joseph, Sep 2026: every mistake should be a
// chance to learn). One habit a week, chosen from the mistakes the player has
// actually been making (logic/weeklyFocus.ts), and checked after every game.
// Listed in order of priority: when two are level, the earlier one wins,
// because a loose piece costs more than a careless swap.
import type { ErrorKind } from '../logic/explain'

export type FocusId = 'loose-pieces' | 'their-threats' | 'own-chances' | 'king-safety' | 'opening' | 'swaps'

export type Focus = {
  id: FocusId
  /** Short, as a heading: "Loose pieces". */
  title: string
  /** What to do about it, in Pemberton's words. Never what to play. */
  habit: string
  /** The kinds of mistake (logic/explain.ts) that count against it. */
  kinds: ErrorKind[]
}

export const FOCUSES: Focus[] = [
  {
    id: 'loose-pieces',
    title: 'Loose pieces',
    habit: 'Before every move, check that everything of yours is defended.',
    kinds: ['undefended'],
  },
  {
    id: 'their-threats',
    title: 'Their threats',
    habit: 'After every move of theirs, ask what it threatens. Then move.',
    kinds: ['fork', 'lost-material'],
  },
  {
    id: 'own-chances',
    title: 'Your chances',
    habit: 'Look at every capture and every check you have, before anything else.',
    kinds: ['missed-win', 'missed-mate'],
  },
  {
    id: 'king-safety',
    title: 'Your king',
    habit: 'Castle early, and leave the pawns in front of your king where they are.',
    kinds: ['allowed-mate', 'king-weakened', 'lost-castling'],
  },
  {
    id: 'opening',
    title: 'The opening',
    habit: 'Knights and bishops out first, one move each. The queen can wait.',
    kinds: ['early-queen', 'same-piece-twice'],
  },
  {
    id: 'swaps',
    title: 'Swaps',
    habit: 'Before you swap anything, look at what’s left on the board afterwards.',
    kinds: ['doubled-pawns', 'isolated-pawn', 'bishop-pair', 'traded-behind'],
  },
]

export function findFocus(id: FocusId): Focus {
  return FOCUSES.find((f) => f.id === id) ?? FOCUSES[0]
}
