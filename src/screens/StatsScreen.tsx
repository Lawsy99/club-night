// Stats (design document, "Stats screen"): the rating graph, the record
// against each character, accuracy over time and by phase, and the
// strongest and weakest openings. Quiet numbers, never a to-do list.
import { useEffect, useState } from 'react'
import { RatingGraph } from '../components/RatingGraph'
import { CHARACTERS, COACH, findCharacter, PRACTICE_REGULARS } from '../data/characters'
import { OPENING_NAMES } from '../data/scouting'
import { replay } from '../logic/game'
import { outcomeOf, upgradeGameRecord } from '../logic/gameRecord'
import type { MonthlyTest } from '../logic/monthlyTest'
import type { Progress } from '../logic/path'
import { reviewMoves } from '../logic/review'
import {
  accuracyByPhase,
  accuracyTrend,
  improvement,
  openingScores,
  recordByCharacter,
  type OpeningScore,
  type StatsGame,
} from '../logic/stats'
import { listArchivedGames, type ArchivedGame } from '../storage/db'
import './StatsScreen.css'

const CHARACTER_PREFIX = 'char:'

export function StatsScreen({ progress, onBack }: { progress: Progress; onBack: () => void }) {
  const [games, setGames] = useState<StatsGame[] | null>(null)

  useEffect(() => {
    listArchivedGames()
      .then((archived) => setGames(archived.flatMap(toStatsGame)))
      .catch(() => setGames([]))
  }, [])

  const history = progress.ratingHistory ?? []
  const peak = history.length ? Math.max(...history.map((p) => p.rating)) : null

  return (
    <main className="stats-screen">
      <header className="stats-header">
        <button type="button" className="stats-back" onClick={onBack}>
          ‹ Back
        </button>
        <h1>Your stats</h1>
      </header>

      <section>
        <h2>Rating</h2>
        <RatingGraph points={history} />
        {peak !== null && history.length > 1 && <p className="stats-note">Highest so far: {peak}</p>}
      </section>

      {games === null ? (
        <p className="stats-note">Reading your games…</p>
      ) : (
        <>
          <ImprovementSection games={games} />
          <MonthlyTestsSection tests={progress.monthlyTests ?? []} />
          <RecordSection games={games} />
          <AccuracySection games={games} />
          <OpeningsSection games={games} />
        </>
      )}
    </main>
  )
}

/** Your last ten reviewed games against the ten before, on the habits that matter. */
function ImprovementSection({ games }: { games: StatsGame[] }) {
  const rows = improvement(games)
  return (
    <section>
      <h2>How you’re improving</h2>
      {!rows ? (
        <p className="stats-note">Review a few more games and this shows how your habits are changing.</p>
      ) : (
        <>
          <p className="stats-note">Your last ten reviewed games, against the ten before.</p>
          <ul className="stats-records">
            {rows.map((r) => {
              const better = r.lowerIsBetter ? r.recent < r.earlier : r.recent > r.earlier
              const same = r.recent === r.earlier
              return (
                <li key={r.label}>
                  <span className="stats-name">{r.label}</span>
                  <span>
                    <strong className={better && !same ? 'stats-better' : undefined}>
                      {r.recent}
                      {r.unit}
                    </strong>{' '}
                    (was {r.earlier}
                    {r.unit})
                  </span>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}

/** Pemberton's monthly tests: the same standard each time, so the scores compare. */
function MonthlyTestsSection({ tests }: { tests: readonly MonthlyTest[] }) {
  return (
    <section>
      <h2>Monthly tests</h2>
      {tests.length === 0 ? (
        <p className="stats-note">Pemberton sets one every four weeks. Six positions at the same standard each time.</p>
      ) : (
        <ul className="stats-records">
          {tests.map((t, i) => (
            <li key={t.month}>
              <span className="stats-name">Month {t.month}</span>
              <span>
                <strong className={i > 0 && t.score > tests[i - 1].score ? 'stats-better' : undefined}>
                  {t.score} of {t.out}
                </strong>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function RecordSection({ games }: { games: StatsGame[] }) {
  // The main cast, then the practice-night regulars (Terry, Ray, Sheila, Bill)
  // and Pemberton, for anyone you've played.
  const rows = recordByCharacter(games, [...CHARACTERS, ...PRACTICE_REGULARS, COACH].map((c) => c.id))
  return (
    <section>
      <h2>Against the club</h2>
      {rows.length === 0 ? (
        <p className="stats-note">No games against club members yet.</p>
      ) : (
        <ul className="stats-records">
          {rows.map(({ id, record }) => (
            <li key={id}>
              <span className="stats-name">{findCharacter(id)?.name ?? id}</span>
              <span>
                {record.wins} won · {record.losses} lost
                {record.draws > 0 ? ` · ${record.draws} drawn` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function AccuracySection({ games }: { games: StatsGame[] }) {
  const trend = accuracyTrend(games)
  const recent = trend.slice(-10)
  const earlier = trend.slice(-20, -10)
  const avg = (xs: { accuracy: number }[]) => Math.round(xs.reduce((a, b) => a + b.accuracy, 0) / xs.length)
  const phases = accuracyByPhase(games)
  const phaseRows: [string, number | null][] = [
    ['Opening', phases.opening],
    ['Middlegame', phases.middlegame],
    ['Endgame', phases.endgame],
  ]
  return (
    <section>
      <h2>Accuracy</h2>
      {trend.length === 0 ? (
        <p className="stats-note">Accuracy comes from reviewed games. Review a game to start this.</p>
      ) : (
        <>
          <p className="stats-big">
            <strong>{avg(recent)}%</strong> over your last {recent.length} reviewed game{recent.length === 1 ? '' : 's'}
            {earlier.length >= 3 && <span> (the {earlier.length} before: {avg(earlier)}%)</span>}
          </p>
          <div className="stats-bars">
            {phaseRows.map(([label, value]) => (
              <div key={label} className="stats-bar-row">
                <span>{label}</span>
                <span className="stats-bar" aria-hidden="true">
                  {value !== null && <i style={{ width: `${value}%` }} />}
                </span>
                <span className="stats-bar-value">{value === null ? 'not enough yet' : `${value}%`}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

function OpeningsSection({ games }: { games: StatsGame[] }) {
  const scores = openingScores(games)
  const best = scores[0]
  const worst = scores.length > 1 ? scores.at(-1)! : null
  return (
    <section>
      <h2>Openings</h2>
      {!best ? (
        <p className="stats-note">Play a couple of games in the same opening to see how you score in it.</p>
      ) : (
        <ul className="stats-records">
          <li>
            <span className="stats-name">{worst ? 'Strongest' : 'So far'}</span>
            <span>{describeOpening(best)}</span>
          </li>
          {worst && (
            <li>
              <span className="stats-name">Weakest</span>
              <span>{describeOpening(worst)}</span>
            </li>
          )}
        </ul>
      )}
    </section>
  )
}

function describeOpening(s: OpeningScore): string {
  const name = OPENING_NAMES[s.opening] ?? s.opening
  const colour = s.colour === 'w' ? 'White' : 'Black'
  return `${name[0].toUpperCase()}${name.slice(1)} as ${colour}: ${Math.round(s.score * 100)}% from ${s.played} games`
}

/** One archived game in the shape the stats need (unfinished or unreadable games are skipped). */
function toStatsGame(saved: ArchivedGame): StatsGame[] {
  try {
    const g = upgradeGameRecord(saved)
    const outcome = outcomeOf(g)
    if (!outcome) return []
    const result = outcome.winner === null ? 'draw' : outcome.winner === g.playerColour ? 'win' : 'loss'
    const analysed = saved.evals && saved.evals.length === g.moves.length + 1
    return [
      {
        finishedAt: saved.finishedAt,
        character: g.levelId.startsWith(CHARACTER_PREFIX) ? g.levelId.slice(CHARACTER_PREFIX.length) : null,
        playerColour: g.playerColour,
        result,
        sans: replay(g.moves.slice(0, 20)).history(),
        reviewed: analysed ? reviewMoves(g.moves, saved.evals!) : undefined,
      },
    ]
  } catch {
    return []
  }
}
