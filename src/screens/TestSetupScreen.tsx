// TEMPORARY (Phases 1–3): choose an opponent and a help stage for a test
// game. Deleted in Phase 4, when the path decides what comes next.
import { useEffect, useState } from 'react'
import { BUILD_LABEL } from '../buildInfo'
import { CHARACTERS, characterRating } from '../data/characters'
import { HELP_STAGE_ORDER, HELP_STAGES, type HelpStageId } from '../data/helpStages'
import { characterOpponentId, resolveOpponent } from '../data/opponents'
import { TEST_OPPONENT_LEVELS } from '../data/testOpponents'
import type { Colour } from '../logic/game'
import { dueCards } from '../logic/mistakesDeck'
import { loadCards } from '../storage/db'
import './TestSetupScreen.css'

type Props = {
  playerColour: Colour
  initialOpponentId: string
  /** Stand-in for the player's rating until phase 4; characters scale from it. */
  baseline: number
  onBaselineChange: (baseline: number) => void
  onStart: (stage: HelpStageId, opponentId: string, rating: number) => void
  onOpenDeck: () => void
  onOpenHistory: () => void
}

const STAGE_DETAILS: Record<HelpStageId, string> = {
  assisted: 'Evaluation bar, hints, best line, unlimited takebacks, blunder warnings.',
  guided: '3 takebacks. Warns only if you drop a piece or allow mate.',
  real: 'No help at all.',
}

const BASELINE_RANGE = { min: 400, max: 2400, step: 100 }

export function TestSetupScreen(props: Props) {
  const { playerColour, initialOpponentId, baseline, onBaselineChange, onStart, onOpenDeck, onOpenHistory } = props
  const [opponentId, setOpponentId] = useState(initialOpponentId)
  const [deck, setDeck] = useState<{ due: number; total: number } | null>(null)

  useEffect(() => {
    loadCards()
      .then((cards) => setDeck({ due: dueCards(cards).length, total: cards.filter((c) => !c.retired).length }))
      .catch(() => setDeck(null))
  }, [])

  // A character's rating comes from the baseline; a practice level's is fixed.
  const ratingFor = (id: string) => {
    const opponent = resolveOpponent(id)
    return opponent.character ? characterRating(opponent.character, baseline) : opponent.rating
  }
  const changeBaseline = (delta: number) =>
    onBaselineChange(Math.min(BASELINE_RANGE.max, Math.max(BASELINE_RANGE.min, baseline + delta)))

  return (
    <main className="setup-screen">
      <header>
        <h1>Test game</h1>
        <p>You'll play {playerColour === 'w' ? 'White' : 'Black'}. Colours alternate every game.</p>
      </header>

      <div className="setup-baseline">
        <span>
          Your level <small>(until ratings arrive)</small>
        </span>
        <div className="stepper">
          <button type="button" aria-label="Lower" onClick={() => changeBaseline(-BASELINE_RANGE.step)}>
            −
          </button>
          <strong>{baseline}</strong>
          <button type="button" aria-label="Higher" onClick={() => changeBaseline(BASELINE_RANGE.step)}>
            +
          </button>
        </div>
      </div>

      <label className="setup-level">
        <span>Opponent</span>
        <select value={opponentId} onChange={(e) => setOpponentId(e.target.value)}>
          <optgroup label="Club members">
            {CHARACTERS.map((c) => (
              <option key={c.id} value={characterOpponentId(c.id)}>
                {c.name} · {characterRating(c, baseline)}
              </option>
            ))}
          </optgroup>
          <optgroup label="Practice">
            {TEST_OPPONENT_LEVELS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label} · {l.rating}
              </option>
            ))}
          </optgroup>
        </select>
      </label>

      <div className="setup-stages">
        {HELP_STAGE_ORDER.map((id) => (
          <button key={id} type="button" onClick={() => onStart(id, opponentId, ratingFor(opponentId))}>
            <strong>{HELP_STAGES[id].label}</strong>
            <span>{STAGE_DETAILS[id]}</span>
          </button>
        ))}
      </div>

      <button type="button" className="setup-deck" onClick={onOpenDeck}>
        <strong>Mistakes deck</strong>
        <span>
          {!deck || deck.total === 0
            ? 'Empty so far'
            : deck.due > 0
              ? `${deck.due} due`
              : `${deck.total} card${deck.total === 1 ? '' : 's'}, none due`}
        </span>
      </button>

      <button type="button" className="setup-deck setup-history" onClick={onOpenHistory}>
        <strong>Past games</strong>
        <span>Review any game ›</span>
      </button>

      <p className="build-stamp">Version: {BUILD_LABEL}</p>
    </main>
  )
}
