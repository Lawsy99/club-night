// TEMPORARY (Phase 1–3): choose a help stage and opponent strength for a test
// game. Deleted in Phase 4, when the path decides what comes next.
import { useEffect, useState } from 'react'
import { BUILD_LABEL } from '../buildInfo'
import { HELP_STAGE_ORDER, HELP_STAGES, type HelpStageId } from '../data/helpStages'
import { TEST_OPPONENT_LEVELS } from '../data/testOpponents'
import type { Colour } from '../logic/game'
import { dueCards } from '../logic/mistakesDeck'
import { loadCards } from '../storage/db'
import './TestSetupScreen.css'

type Props = {
  playerColour: Colour
  initialLevelId: string
  onStart: (stage: HelpStageId, levelId: string) => void
  onOpenDeck: () => void
  onOpenHistory: () => void
}

const STAGE_DETAILS: Record<HelpStageId, string> = {
  assisted: 'Evaluation bar, hints, best line, unlimited takebacks, blunder warnings.',
  guided: '3 takebacks. Warns only if you drop a piece or allow mate.',
  real: 'No help at all.',
}

export function TestSetupScreen({ playerColour, initialLevelId, onStart, onOpenDeck, onOpenHistory }: Props) {
  const [levelId, setLevelId] = useState(initialLevelId)
  const [deck, setDeck] = useState<{ due: number; total: number } | null>(null)

  useEffect(() => {
    loadCards()
      .then((cards) => setDeck({ due: dueCards(cards).length, total: cards.filter((c) => !c.retired).length }))
      .catch(() => setDeck(null))
  }, [])

  return (
    <main className="setup-screen">
      <header>
        <h1>Test game</h1>
        <p>You'll play {playerColour === 'w' ? 'White' : 'Black'}. Colours alternate every game.</p>
      </header>

      <label className="setup-level">
        <span>Opponent</span>
        <select value={levelId} onChange={(e) => setLevelId(e.target.value)}>
          {TEST_OPPONENT_LEVELS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label} · {l.rating}
            </option>
          ))}
        </select>
      </label>

      <div className="setup-stages">
        {HELP_STAGE_ORDER.map((id) => (
          <button key={id} type="button" onClick={() => onStart(id, levelId)}>
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
