// Background members of Wexley Chess Club (Joseph, Sep 2026): on the club
// ladder but not opponents (yet). Their ratings are set once after trial
// night and never change, and sit well away from the player's, so they give
// the ladder depth without crowding the main cast. The two above are
// long-term targets (and natural Act 2 ladder opponents).

// They're never labelled on screen (like everyone else). The player learns
// who they are from the noticeboard and from being mentioned or seen around
// the club: see content/dialogue.csv (lines mentioning them) and data/noticeboard.ts.
export type Member = {
  id: string
  name: string
  /** For us, not shown: who they are at the club. */
  note: string
  /** From the player's starting rating (set once after trial night). */
  offset: number
}

export const MEMBERS: Member[] = [
  { id: 'malcolm', name: 'Malcolm', note: 'Board one. Only in for league matches.', offset: 320 },
  { id: 'ray', name: 'Ray', note: 'Runs junior night on Thursdays.', offset: 190 },
  { id: 'sheila', name: 'Sheila', note: 'Does the raffle. Plays when asked.', offset: -240 },
  { id: 'bill', name: 'Bill', note: 'A member since 1974. Remembers everyone.', offset: -330 },
]
