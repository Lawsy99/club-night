// "This leaves your knight undefended. Play it anyway?" Shown over the board
// after the player drops a piece, before the move is confirmed.
import './BlunderWarning.css'

type Props = {
  message: string
  onPlayAnyway: () => void
  onTakeBack: () => void
}

export function BlunderWarning({ message, onPlayAnyway, onTakeBack }: Props) {
  return (
    <div className="blunder-backdrop" role="alertdialog" aria-label="Blunder warning">
      <div className="blunder-card">
        <p className="blunder-message">
          {message} <strong>Play it anyway?</strong>
        </p>
        <div className="blunder-actions">
          <button type="button" className="take-back" onClick={onTakeBack}>
            Take it back
          </button>
          <button type="button" onClick={onPlayAnyway}>
            Play it
          </button>
        </div>
      </div>
    </div>
  )
}
