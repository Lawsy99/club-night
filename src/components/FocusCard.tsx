// Pemberton's focus for the week, on Home (Joseph, Sep 2026). At the start of
// the week he also says how last week's went; after that, just the habit.
import { findFocus } from '../data/focuses'
import type { WeekFocus } from '../logic/weeklyFocus'
import { Portrait } from './Portrait'
import './FocusCard.css'

export function FocusCard({ focus, showVerdict }: { focus: WeekFocus; showVerdict: boolean }) {
  const f = findFocus(focus.id)
  return (
    <section className="focus-card" aria-label="This week's focus">
      <Portrait who="pemberton" size={36} />
      <div>
        <p className="focus-kicker">This week: {f.title.toLowerCase()}</p>
        {showVerdict && focus.verdict && <p className="focus-verdict">{focus.verdict}</p>}
        <p className="focus-habit">{f.habit}</p>
      </div>
    </section>
  )
}
