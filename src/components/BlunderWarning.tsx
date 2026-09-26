// "This leaves your knight undefended. Play it anyway?" Shown over the board
// after the player drops a piece, before the move is confirmed.
import { Portrait } from './Portrait'
import './BlunderWarning.css'

type Props = {
  message: string
  onPlayAnyway: () => void
  onTakeBack: () => void
  /** The coach asking (the coached game): his face, and his words. */
  coach?: string
  /** Shown on the button, since thinking again uses a takeback. */
  takebacksLeft?: number
}

export function BlunderWarning({ message, onPlayAnyway, onTakeBack, coach, takebacksLeft }: Props) {
  return (
    <div className="blunder-backdrop" role="alertdialog" aria-label="Blunder warning">
      <div className="blunder-card">
        {coach ? (
          // The coach asking, in his words: he doesn't say what's wrong.
          <p className="blunder-message blunder-coach">
            <Portrait who={coach} size={36} expression="annoyed" />
            <span>“{message}”</span>
          </p>
        ) : (
          <p className="blunder-message">
            {message} <strong>Play it anyway?</strong>
          </p>
        )}
        <div className="blunder-actions">
          <button type="button" className="take-back" onClick={onTakeBack}>
            {takebacksLeft !== undefined
              ? `Think again (${takebacksLeft} takeback${takebacksLeft === 1 ? '' : 's'} left)`
              : 'Take it back'}
          </button>
          <button type="button" onClick={onPlayAnyway}>
            Play it
          </button>
        </div>
      </div>
    </div>
  )
}
