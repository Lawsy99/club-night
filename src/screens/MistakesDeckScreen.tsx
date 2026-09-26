// The mistakes deck: due cards one at a time, with a count of what's left.
// Each card is a real position from the player's games; find a better move.
import { useEffect, useState } from 'react'
import { MomentTrainer } from '../components/MomentTrainer'
import { RATING_LABELS } from '../logic/moveRating'
import {
  answerCard,
  dueCards,
  MAX_CARDS_PER_SESSION,
  nextDue,
  warmupCards,
  type Answer,
  type MistakeCard,
} from '../logic/mistakesDeck'
import { withLeadUp } from '../logic/mistakeCards'
import { getArchivedGame, loadCards, saveCard } from '../storage/db'
import '../components/ratings.css'
import './ReviewScreen.css'
import './MistakesDeckScreen.css'

/** A card in this session's queue; repeats are practice only (not re-graded). */
type QueueItem = { card: MistakeCard; repeat: boolean }

type Props = {
  onBack: () => void
  /** Coaching night's warm-ups: three recent errors, then on to the lesson. */
  warmup?: boolean
  /** Warm-ups finished (leaving part-way doesn't count). */
  onDone?: () => void
}

export function MistakesDeckScreen({ onBack, warmup = false, onDone }: Props) {
  const [queue, setQueue] = useState<QueueItem[] | null>(null)
  const [allCards, setAllCards] = useState<MistakeCard[]>([])
  const [index, setIndex] = useState(0)
  const [answered, setAnswered] = useState(false)

  useEffect(() => {
    loadCards()
      .then((cards) => {
        setAllCards(cards)
        // Short sittings: at most MAX_CARDS_PER_SESSION, oldest-due first.
        const picked = warmup ? warmupCards(cards) : dueCards(cards).slice(0, MAX_CARDS_PER_SESSION)
        // Older cards don't know the opponent's move before: look it up in the game.
        return Promise.all(
          picked.map(async (card) => {
            if (card.prevMove) return card
            const g = await getArchivedGame(card.gameId).catch(() => null)
            return g ? withLeadUp(card, g.moves, card.ply) : card
          }),
        ).then((ready) => setQueue(ready.map((card) => ({ card, repeat: false }))))
      })
      .catch(() => setQueue([]))
  }, [warmup])

  function handleFinished(answer: Answer) {
    setAnswered(true)
    if (!queue) return
    const item = queue[index]
    if (item.repeat) return // practice round: the schedule was already set

    // Seen once, right or wrong, and it's gone: no repeats, so it never
    // becomes a memory test (Joseph, Sep 2026).
    const updated = answerCard(item.card, answer)
    saveCard(updated).catch((err) => console.error('Card save failed', err))
    setAllCards((cards) => cards.map((c) => (c.id === updated.id ? updated : c)))
  }

  function next() {
    setIndex((i) => i + 1)
    setAnswered(false)
    window.scrollTo({ top: 0 })
  }

  // (No "I've got this one" button, Sep 2026: every position is shown once and
  // then retired anyway, so getting it right is how it goes.)

  if (!queue) return <main className="review-screen">Setting up the positions…</main>

  const item = queue[index]
  if (!item) {
    const upcoming = nextDue(allCards)
    const active = allCards.filter((c) => !c.retired).length
    const learned = allCards.length - active
    const stillDue = dueCards(allCards).length
    if (warmup) {
      return (
        <main className="review-screen">
          <header>
            <h1>Warm-up done</h1>
          </header>
          <p className="review-note">That’s the warm-up. On to tonight’s lesson.</p>
          <button type="button" className="review-continue" onClick={onDone ?? onBack}>
            On to the lesson
          </button>
        </main>
      )
    }
    return (
      <main className="review-screen">
        <header>
          <h1>Mistakes deck</h1>
        </header>
        <p className="review-note">
          {allCards.length === 0
            ? 'No cards yet. Mistakes and blunders from your game reviews will appear here.'
            : queue.length === 0
              ? `Nothing due right now.${upcoming ? ` Next card ${describeWhen(upcoming)}.` : ''}`
              : stillDue > 0
                ? `That's enough for one sitting. ${stillDue} more waiting for next time.`
                : `All done for now.${upcoming ? ` Next card ${describeWhen(upcoming)}.` : ''}`}
        </p>
        {allCards.length > 0 && (
          <p className="review-note">
            {active} card{active === 1 ? '' : 's'} in the deck · {learned} learned
          </p>
        )}
        <button type="button" className="review-continue" onClick={onBack}>
          Back
        </button>
      </main>
    )
  }

  const { card } = item
  return (
    <main className="review-screen with-board">
      <header className="deck-header">
        <button type="button" className="deck-back" onClick={onBack}>
          ‹ Back
        </button>
        <p className="review-kicker">
          {warmup ? 'Warm-up · ' : ''}
          {item.repeat ? 'One more go' : `Position ${index + 1} of ${queue.length}`}
        </p>
      </header>
      <h1 className="deck-title">
        {card.moveLabel}{' '}
        <span className={`review-pill rating-${card.rating}`}>
          {card.kind === 'missed' ? 'Missed chance' : RATING_LABELS[card.rating]}
        </span>
      </h1>
      <p className="deck-source">From a game on {formatDate(card.createdAt)}</p>
      <MomentTrainer key={`${index}-${card.id}`} moment={card} onFinished={handleFinished} />
      <button type="button" className="review-continue" disabled={!answered} onClick={next}>
        {index + 1 < queue.length ? 'Next position' : 'Finish'}
      </button>
    </main>
  )
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/** "tomorrow", "in 3 days", "on 12 Oct"… */
function describeWhen(date: Date): string {
  const days = Math.ceil((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
  if (days <= 0) return 'is due now'
  if (days === 1) return 'is due tomorrow'
  if (days < 7) return `is due in ${days} days`
  return `is due on ${formatDate(date.getTime())}`
}
