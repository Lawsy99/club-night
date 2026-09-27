// A story moment, played straight after you win the week's match (Joseph,
// Sep 2026): the week's "On the way out", or a month's cutscene. Tap to
// bring in each line; Skip is always there. Short, sharp, clean.
import { useEffect, useState } from 'react'
import { Portrait } from '../components/Portrait'
import { SceneArt } from '../components/SceneArt'
import { findCharacter } from '../data/characters'
import { SPEAKER_NAMES } from '../data/dialogue'
import { STUDY_TEXT } from '../data/prepStudy'
import type { StoryLine } from '../data/weekStory'
import { errorKindsByGame, toStatsGame } from '../logic/archiveStats'
import { fillName } from '../logic/dialogue'
import { prepStudy, type StudyChapter } from '../logic/prepStudy'
import { storyFor } from '../logic/storyContent'
import { listArchivedGames } from '../storage/db'
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
  // The study's pages, built from your games once it opens.
  const [pages, setPages] = useState<StudyChapter[] | null>(null)
  useEffect(() => {
    if (!story?.study) return
    listArchivedGames()
      .then((archived) => setPages(prepStudy(archived.flatMap(toStatsGame), errorKindsByGame(archived))))
      .catch(() => setPages(prepStudy([], [])))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per story
  }, [id])
  if (!story) return null // (callers only pass ids that exist; see storyFor)
  // A study page per tap, then Pemberton's sign-off.
  const total = story.study ? (pages ? pages.length + 1 : 0) : story.lines.length
  const done = shown >= total
  const advance = () => {
    if (story.study && !pages) return
    if (done) onDone()
    else setShown((n) => n + 1)
  }
  const title = fillName(story.title, playerName).replace(/:? ?\{name\}/, '')

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
      {title && <h1 className="story-title">{title}</h1>}
      {story.art && <SceneArt scene={story.art} playerName={playerName} />}
      {story.study ? (
        <div className="story-study">
          {!pages && <p className="story-direction">Opening the study…</p>}
          {pages?.slice(0, shown).map((page, i) => (
            <section key={page.heading} className="story-study-page">
              <h2>
                Chapter {i + 1} · {page.heading}
              </h2>
              {page.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </section>
          ))}
          {pages && shown > pages.length && <p className="story-study-sign">{STUDY_TEXT.signOff}</p>}
        </div>
      ) : (
        <div className="story-lines">
          {story.lines.slice(0, shown).map((line, i) => (
            <Line key={i} line={line} playerName={playerName} />
          ))}
        </div>
      )}
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
