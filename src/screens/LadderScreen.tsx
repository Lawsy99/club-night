// The whole club ladder: everyone at Wexley by rating, the player among
// them. Tap someone to see your history together.
import { useEffect, useState } from 'react'
import { LadderList } from '../components/ClubLadder'
import { SCOUTING } from '../data/scouting'
import { MEMBERS } from '../data/members'
import { outcomeOf } from '../logic/gameRecord'
import { describeTogether, historyWith } from '../logic/history'
import type { LadderNews, Rung } from '../logic/ladder'
import { listArchivedGames } from '../storage/db'
import './StatsScreen.css'

const pronounOf = (id: string): 'he' | 'she' | 'they' => {
  const p = SCOUTING[id]?.pronoun ?? MEMBERS.find((m) => m.id === id)?.pronoun
  return p === 'her' ? 'she' : p === 'him' ? 'he' : 'they'
}

export function LadderScreen({ ladder, news, onBack }: { ladder: readonly Rung[]; news: LadderNews[]; onBack: () => void }) {
  const [details, setDetails] = useState<Record<string, string>>({})

  useEffect(() => {
    listArchivedGames()
      .then((games) => {
        const finished = games.flatMap((g) => {
          try {
            const o = outcomeOf(g)
            if (!o || !g.levelId.startsWith('char:')) return []
            const result = o.winner === null ? ('drew' as const) : o.winner === g.playerColour ? ('won' as const) : ('lost' as const)
            return [{ opponent: g.levelId.slice(5), result }]
          } catch {
            return []
          }
        })
        const together = historyWith(finished)
        setDetails(Object.fromEntries(ladder.map((r) => [r.id, describeTogether(together[r.id], pronounOf(r.id))])))
      })
      .catch(() => undefined)
  }, [ladder])

  return (
    <main className="stats-screen">
      <header className="stats-header">
        <button type="button" className="stats-back" onClick={onBack}>
          ‹ Back
        </button>
        <h1>Club ladder</h1>
      </header>
      <section>
        <LadderList ladder={ladder} news={news} details={details} />
      </section>
      <p className="stats-note">Everyone’s club rating, as of this week. Tap anyone to see your games together.</p>
    </main>
  )
}
