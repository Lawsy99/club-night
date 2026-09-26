// "Right. What do you play?" Coach Pemberton asks for the player's
// repertoire at the start of Act 1 (design document, "Your repertoire").
import { useState } from 'react'
import { REPERTOIRE_CHOICES, type Repertoire, type RepertoireSlot } from '../data/repertoire'
import { Portrait } from './Portrait'
import './RepertoireCard.css'

const QUESTIONS: { slot: RepertoireSlot; label: string }[] = [
  { slot: 'white', label: 'As White' },
  { slot: 'vsE4', label: 'As Black, against 1.e4' },
  { slot: 'vsD4', label: 'As Black, against 1.d4' },
]

export function RepertoireCard({ onChoose }: { onChoose: (r: Repertoire) => void }) {
  const [picked, setPicked] = useState<Partial<Repertoire>>({})
  const complete = QUESTIONS.every((q) => picked[q.slot])
  return (
    <section className="repertoire-card">
      <p className="repertoire-kicker">One question first</p>
      <p className="repertoire-ask">
        <Portrait who="pemberton" size={44} />
        <span>
          <strong>Coach Pemberton</strong>“Right. What do you play?”
        </span>
      </p>
      {QUESTIONS.map((q) => (
        <fieldset key={q.slot}>
          <legend>{q.label}</legend>
          {REPERTOIRE_CHOICES[q.slot].map((c) => (
            <button
              key={c.id}
              type="button"
              className={picked[q.slot] === c.id ? 'selected' : undefined}
              aria-pressed={picked[q.slot] === c.id}
              onClick={() => setPicked((p) => ({ ...p, [q.slot]: c.id }))}
            >
              <strong>{c.name[0].toUpperCase() + c.name.slice(1)}</strong>
              <span>{c.blurb}</span>
            </button>
          ))}
        </fieldset>
      ))}
      <p className="repertoire-note">In assisted and guided games, a note shows your next move while you're still in your opening.</p>
      <button type="button" className="repertoire-done" disabled={!complete} onClick={() => onChoose(picked as Repertoire)}>
        That's what I play
      </button>
    </section>
  )
}
