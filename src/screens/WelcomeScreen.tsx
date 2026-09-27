// First launch only: your name, one question, then trial night (design
// document, "Trial night: Before the games"). Anyone who has never played
// is shown the moves first, hands on, by Marjorie (Sep 2026).
import { useState } from 'react'
import { NameField } from '../components/NameField'
import { RulesTutorial } from '../components/RulesTutorial'
import { cleanName } from '../logic/playerName'
import type { Experience } from '../logic/trialNight'
import './WelcomeScreen.css'

type Props = { onStart: (experience: Experience, statedRating: number | undefined, name: string) => void }

const OPTIONS: { value: Experience; label: string; detail: string }[] = [
  { value: 'never', label: "I've never played", detail: 'Marjorie will show you the moves first.' },
  { value: 'rules', label: 'I know the rules', detail: 'But not much more.' },
  { value: 'casual', label: 'I play casually', detail: 'Friends, family, the odd online game.' },
  { value: 'rated', label: 'I have an online rating', detail: 'Lichess or chess.com.' },
]

export function WelcomeScreen({ onStart }: Props) {
  const [choice, setChoice] = useState<Experience | null>(null)
  const [rating, setRating] = useState('')
  const [name, setName] = useState('')
  const [learning, setLearning] = useState(false)
  const ratingNumber = Number(rating)
  const ratingValid = rating !== '' && ratingNumber >= 100 && ratingNumber <= 3000
  const start = () => choice && onStart(choice, choice === 'rated' ? ratingNumber : undefined, cleanName(name))

  // The moves, hands on, before trial night.
  if (learning) {
    return (
      <main className="welcome-screen">
        <header>
          <p className="welcome-kicker">Before the games</p>
          <h1>The moves</h1>
        </header>
        <RulesTutorial onDone={start} onSkip={start} />
      </main>
    )
  }

  return (
    <main className="welcome-screen">
      <header>
        <p className="welcome-kicker">Wexley Chess Club · the back room of the Red Lion</p>
        <h1>Club Night</h1>
        <p>
          It's your first night at the club. Before anything else, members like to get new faces playing a few games,
          to see where you fit.
        </p>
      </header>

      <NameField value={name} onChange={setName} prompt="Name, please. For the membership list. Spelt properly." />

      <section>
        <h2>Roughly how much chess have you played?</h2>
        <div className="welcome-options">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className={choice === o.value ? 'selected' : undefined}
              onClick={() => setChoice(o.value)}
            >
              <strong>{o.label}</strong>
              <span>{o.detail}</span>
            </button>
          ))}
        </div>

        {choice === 'rated' && (
          <label className="welcome-rating">
            <span>Your rating</span>
            <input
              type="number"
              inputMode="numeric"
              min={100}
              max={3000}
              placeholder="e.g. 1200"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            />
          </label>
        )}
      </section>

      <button
        type="button"
        className="welcome-start"
        disabled={!choice || (choice === 'rated' && !ratingValid) || !cleanName(name)}
        onClick={() => (choice === 'never' ? setLearning(true) : start())}
      >
        {choice === 'never' ? 'Learn the moves' : 'Start trial night'}
      </button>
      <p className="welcome-note">Five games, no help, no clock. The first four set your starting rating.</p>
    </main>
  )
}
