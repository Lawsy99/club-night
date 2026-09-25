// First launch only: one question, then trial night (design document,
// "Trial night: Before the games"). PLACEHOLDER TEXT until phase 6.
import { useState } from 'react'
import type { Experience } from '../logic/trialNight'
import './WelcomeScreen.css'

type Props = { onStart: (experience: Experience, statedRating?: number) => void }

const OPTIONS: { value: Experience; label: string; detail: string }[] = [
  { value: 'never', label: "I've never played", detail: "We'll go over the rules first." },
  { value: 'rules', label: 'I know the rules', detail: 'But not much more.' },
  { value: 'casual', label: 'I play casually', detail: 'Friends, family, the odd online game.' },
  { value: 'rated', label: 'I have an online rating', detail: 'Lichess or chess.com.' },
]

export function WelcomeScreen({ onStart }: Props) {
  const [choice, setChoice] = useState<Experience | null>(null)
  const [rating, setRating] = useState('')
  const ratingNumber = Number(rating)
  const ratingValid = rating !== '' && ratingNumber >= 100 && ratingNumber <= 3000

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

        {choice === 'never' && <RulesCard />}
      </section>

      <button
        type="button"
        className="welcome-start"
        disabled={!choice || (choice === 'rated' && !ratingValid)}
        onClick={() => choice && onStart(choice, choice === 'rated' ? ratingNumber : undefined)}
      >
        Start trial night
      </button>
      <p className="welcome-note">Five games, no help, no clock. Your results set your starting rating.</p>
    </main>
  )
}

/** A very short rules walkthrough for complete beginners (fuller version later). */
function RulesCard() {
  return (
    <div className="rules-card">
      <h3>The rules in one minute</h3>
      <ul>
        <li>White moves first; then you take turns, one move each.</li>
        <li>Win by checkmate: attack the enemy king so it has no escape.</li>
        <li>Pawns move forward one square (two on their first move) and capture diagonally.</li>
        <li>Knights jump in an L. Bishops go diagonally, rooks straight, the queen both ways.</li>
        <li>The king moves one square. Never leave your own king in check.</li>
        <li>Tap a piece to see where it can go; the app won't allow an illegal move.</li>
      </ul>
    </div>
  )
}
