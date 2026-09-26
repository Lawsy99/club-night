// The plan pause: the game stops once, around move 10 of an assisted game,
// and the player picks a plan. Coach Pemberton gives a one-line verdict.
import { useMemo, useState } from 'react'
import type { PlanOption, PlanSet } from '../data/plans'
import './PlanPause.css'

type Props = {
  plans: PlanSet
  onDone: () => void
}

export function PlanPause({ plans, onDone }: Props) {
  // Rotated by an amount that varies between openings, so the best plan
  // isn't always in the same place (and stays put while the card is open).
  const options = useMemo(() => {
    const shift = plans.prompt.length % plans.options.length
    return [...plans.options.slice(shift), ...plans.options.slice(0, shift)]
  }, [plans])
  const [chosen, setChosen] = useState<PlanOption | null>(null)
  const best = plans.options.find((o) => o.quality === 'best')

  return (
    <div className="plan-backdrop" role="dialog" aria-label="Plan pause">
      <div className="plan-card">
        <p className="plan-kicker">Plan pause · the opening's over</p>
        <p className="plan-prompt">{plans.prompt}</p>
        {!chosen ? (
          <div className="plan-options">
            {options.map((o) => (
              <button key={o.label} type="button" onClick={() => setChosen(o)}>
                {o.label}
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className={`plan-verdict ${chosen.quality}`}>
              <span className="plan-portrait" aria-hidden="true">
                P
              </span>
              <p>
                <strong>Coach Pemberton:</strong> {chosen.verdict}
              </p>
            </div>
            {chosen.quality !== 'best' && best && (
              // Only the first letter is lowered: moves like ...Qb6 keep their capitals.
              <p className="plan-best">The classical plan: {best.label[0].toLowerCase() + best.label.slice(1)}.</p>
            )}
            <button type="button" className="plan-continue" onClick={onDone}>
              Back to the game
            </button>
          </>
        )}
      </div>
    </div>
  )
}
