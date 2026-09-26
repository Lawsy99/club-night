// The story so far: a line for each finished step of Act 1, what's next, and
// what's still to come (titles only, so nothing is given away).
import { Portrait } from '../components/Portrait'
import { ACT_1 } from '../data/act1'
import { DIARY } from '../data/diary'
import type { Progress } from '../logic/path'
import './DiaryScreen.css'

type Entry = { id: string; who: string; title: string; state: 'done' | 'next' | 'later' }

function entries(p: Progress): Entry[] {
  const inAct = p.stage === 'act' || p.stage === 'act-complete'
  const trial: Entry = { id: 'trial', who: 'toby', title: 'Trial night', state: inAct ? 'done' : 'next' }
  const chapters = ACT_1.chapters.map((ch, i): Entry => ({
    id: ch.id,
    who: ch.opponent,
    title: ch.title,
    state: !inAct ? 'later' : i < p.chapter ? 'done' : i === p.chapter ? 'next' : 'later',
  }))
  const cup: Entry = {
    id: 'cup',
    who: ACT_1.gauntlet.boss.opponent,
    title: ACT_1.gauntlet.title,
    state: p.stage === 'act-complete' ? 'done' : inAct && p.chapter >= ACT_1.chapters.length ? 'next' : 'later',
  }
  return [trial, ...chapters, cup]
}

export function DiaryScreen({ progress, onBack }: { progress: Progress; onBack: () => void }) {
  return (
    <main className="diary-screen">
      <header className="diary-header">
        <button type="button" className="diary-back" onClick={onBack}>
          ‹ Back
        </button>
        <h1>The story so far</h1>
      </header>
      <ol className="diary-list">
        {entries(progress).map((e) => (
          <li key={e.id} className={`diary-entry ${e.state}`}>
            <span className="diary-face">{e.state === 'later' ? <span className="diary-dot" /> : <Portrait who={e.who} size={36} />}</span>
            <span className="diary-text">
              <strong>{e.title}</strong>
              {e.state === 'done' && <span>{DIARY[e.id]}</span>}
              {e.state === 'next' && <span className="diary-next">Up next.</span>}
            </span>
          </li>
        ))}
      </ol>
    </main>
  )
}
