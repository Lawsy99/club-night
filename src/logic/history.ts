// Your history with each person at the club (Joseph, Sep 2026: playing
// someone weeks later should feel like playing an old friend). Shown when
// you tap someone on the ladder.

export type Together = { played: number; wins: number; losses: number; draws: number; last: 'won' | 'lost' | 'drew' | null }

type Finished = { opponent: string; result: 'won' | 'lost' | 'drew' }

/** `games` newest first, as the archive lists them. */
export function historyWith(games: readonly Finished[]): Record<string, Together> {
  const out: Record<string, Together> = {}
  for (const g of games) {
    const t = (out[g.opponent] ??= { played: 0, wins: 0, losses: 0, draws: 0, last: null })
    t.played++
    if (g.result === 'won') t.wins++
    else if (g.result === 'lost') t.losses++
    else t.draws++
    t.last ??= g.result
  }
  return out
}

/** One plain line: "11 games. You've won 4, lost 7. Last time, she won." */
export function describeTogether(t: Together | undefined, pronoun: 'he' | 'she' | 'they' = 'they'): string {
  if (!t || t.played === 0) return 'You haven’t played yet.'
  const games = `${t.played} game${t.played === 1 ? '' : 's'}`
  const record = `You’ve won ${t.wins}, lost ${t.losses}${t.draws ? `, drawn ${t.draws}` : ''}.`
  const last = t.last === 'won' ? 'Last time, you won.' : t.last === 'lost' ? `Last time, ${pronoun} won.` : 'Last time, a draw.'
  return `${games}. ${record} ${last}`
}
