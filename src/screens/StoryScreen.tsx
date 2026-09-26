// A story moment, played straight after you win the week's match (Joseph,
// Sep 2026): the week's "On the way out", or a month's cutscene. Tap to
// bring in each line; Skip is always there. Short, sharp, clean.
import { useState } from 'react'
import { Portrait } from '../components/Portrait'
import { SceneArt } from '../components/SceneArt'
import { findCharacter } from '../data/characters'
import { SPEAKER_NAMES } from '../data/dialogue'
import type { StoryLine } from '../data/weekStory'
import { fillName } from '../logic/dialogue'
import { storyFor } from '../logic/storyContent'
import './StoryScreen.css'

type Props = {
  /** "wayout:c1" or "scene:month-1". */
  id: string
  playerName?: string
  onDone: () => void
}

export function StoryScreen({ id, playerName, onDone }: Props) {
  const story = storyFor(id)
  const [shown, setShown] = useState(1)
  if (!story) return null // (callers only pass ids that exist; see storyFor)
  const done = shown >= story.lines.length
  const advance = () => (done ? onDone() : setShown((n) => n + 1))

  return (
    <main className="story-screen" onClick={advance}>
      <header className="story-top">
        <p className="story-kicker">{story.kicker}</p>
        <button
          type="button"
          className="story-skip"
          onClick={(e) => {
            e.stopPropagation()
            onDone()
          }}
        >
          Skip
        </button>
      </header>
      {story.title && <h1 className="story-title">{story.title}</h1>}
      {story.art && <SceneArt scene={story.art} />}
      <div className="story-lines">
        {story.lines.slice(0, shown).map((line, i) => (
          <Line key={i} line={line} playerName={playerName} />
        ))}
      </div>
      <p className="story-tap">{done ? 'Tap to carry on' : 'Tap to continue'}</p>
    </main>
  )
}

function Line({ line, playerName }: { line: StoryLine; playerName?: string }) {
  const text = fillName(line.text, playerName)
  if (!line.who) return <p className="story-direction">{text}</p>
  const name = findCharacter(line.who)?.name ?? SPEAKER_NAMES[line.who] ?? line.who
  return (
    <p className="story-speech">
      <Portrait who={line.who} size={36} />
      <span>
        <span className="story-speaker">{name}</span>“{text}”
      </span>
    </p>
  )
}
