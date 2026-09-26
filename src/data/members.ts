// Background members of Wexley Chess Club (Joseph, Sep 2026): on the club
// ladder but not opponents (yet). Their ratings are set once after trial
// night and never change, and sit well away from the player's, so they give
// the ladder depth without crowding the main cast. The two above are
// long-term targets (and natural Act 2 ladder opponents).

export type Member = {
  id: string
  name: string
  /** A few words on the full ladder. */
  note: string
  /** From the player's starting rating (set once after trial night). */
  offset: number
}

export const MEMBERS: Member[] = [
  { id: 'malcolm', name: 'Malcolm', note: 'Board one. Comes in for league nights.', offset: 320 },
  { id: 'ray', name: 'Ray', note: 'League regular. Thursdays, mostly.', offset: 190 },
  { id: 'sheila', name: 'Sheila', note: 'Here for the company.', offset: -240 },
  { id: 'bill', name: 'Bill', note: 'A member since 1974.', offset: -330 },
]
