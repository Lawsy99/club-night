// The whole club ladder: everyone at Wexley by rating, the player among them.
import { LadderList } from '../components/ClubLadder'
import type { LadderNews, Rung } from '../logic/ladder'
import './StatsScreen.css'

export function LadderScreen({ ladder, news, onBack }: { ladder: readonly Rung[]; news: LadderNews[]; onBack: () => void }) {
  return (
    <main className="stats-screen">
      <header className="stats-header">
        <button type="button" className="stats-back" onClick={onBack}>
          ‹ Back
        </button>
        <h1>Club ladder</h1>
      </header>
      <section>
        <LadderList ladder={ladder} news={news} />
      </section>
      <p className="stats-note">
        Everyone's club rating. Some members are still improving, a little each week. The rest have settled.
      </p>
    </main>
  )
}
