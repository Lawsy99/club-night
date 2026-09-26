// The club calendar: the season month by month, a week to a line, with who
// each week is with. Replaces "the story so far" (Joseph, Sep 2026).
import { Portrait } from '../components/Portrait'
import { findCharacter } from '../data/characters'
import { seasonCalendar } from '../logic/calendar'
import type { Progress } from '../logic/path'
import './CalendarScreen.css'

export function CalendarScreen({ progress, onBack }: { progress: Progress; onBack: () => void }) {
  const months = seasonCalendar(progress)
  return (
    <main className="calendar-screen">
      <header className="calendar-header">
        <button type="button" className="calendar-back" onClick={onBack}>
          ‹ Back
        </button>
        <h1>Club calendar</h1>
      </header>
      {progress.stage === 'trial' && <p className="calendar-note">Trial night first. The season starts after.</p>}
      {months.map((m) => (
        <section key={m.month} className="calendar-month">
          <h2>Month {m.month}</h2>
          <ol>
            {m.weeks.map((w) => (
              <li key={w.week} className={`calendar-week ${w.state}`}>
                <span className="calendar-week-no">Week {w.week}</span>
                <Portrait who={w.opponent} size={34} />
                <span className="calendar-week-text">
                  <strong>{w.title}</strong>
                  <span>
                    {w.state === 'now' ? 'This week · ' : ''}
                    {findCharacter(w.opponent)?.name}
                    {w.note && w.state !== 'later' ? ` · ${w.note}` : ''}
                  </span>
                </span>
                {w.state === 'done' && (
                  <span className="calendar-tick" aria-label="done">
                    ✓︎
                  </span>
                )}
              </li>
            ))}
          </ol>
        </section>
      ))}
      <p className="calendar-note">More to come after the cup.</p>
    </main>
  )
}
