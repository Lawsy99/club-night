// TEMPORARY (Phase 1–3): choose a help stage and opponent strength for a test
// game. Deleted in Phase 4, when the path decides what comes next.
import { useState } from 'react'
import { BUILD_LABEL } from '../buildInfo'
import { HELP_STAGE_ORDER, HELP_STAGES, type HelpStageId } from '../data/helpStages'
import { TEST_OPPONENT_LEVELS } from '../data/testOpponents'
import type { Colour } from '../logic/game'
import './TestSetupScreen.css'

type Props = {
  playerColour: Colour
  initialLevelId: string
  onStart: (stage: HelpStageId, levelId: string) => void
}

const STAGE_DETAILS: Record<HelpStageId, string> = {
  assisted: 'Evaluation bar, hints, best line, unlimited takebacks, blunder warnings.',
  guided: '3 takebacks. Warns only if you drop a piece or allow mate.',
  real: 'No help at all.',
}

export function TestSetupScreen({ playerColour, initialLevelId, onStart }: Props) {
  const [levelId, setLevelId] = useState(initialLevelId)

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
              Stockfish · {l.label}
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

      <p className="build-stamp">Version: {BUILD_LABEL}</p>
    </main>
  )
}
