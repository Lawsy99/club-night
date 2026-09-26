// Graham asks for your name for the membership list. Used on the welcome
// screen, and on Home for anyone who started before names existed.
import { MAX_NAME_LENGTH } from '../logic/playerName'
import './NameField.css'

type Props = {
  value: string
  onChange: (name: string) => void
  /** What Graham says (varies a little by where it's asked). */
  prompt: string
}

export function NameField({ value, onChange, prompt }: Props) {
  return (
    <label className="name-field">
      <span className="name-field-prompt">
        <strong>Graham</strong> “{prompt}”
      </span>
      {/* 16 px text stops iOS Safari zooming in on focus */}
      <input
        type="text"
        autoComplete="given-name"
        autoCapitalize="words"
        enterKeyHint="done"
        maxLength={MAX_NAME_LENGTH}
        placeholder="Your name"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}
