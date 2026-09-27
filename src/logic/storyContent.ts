// What a story id plays: the week's "On the way out" or a cutscene.
import { ACTS, findWeek } from '../data/acts'
import { findCutscene, type SceneArt } from '../data/cutscenes'
import { STUDY_TEXT } from '../data/prepStudy'
import { WEEK_STORY, type StoryLine } from '../data/weekStory'
import { STUDY_ID } from './storyQueue'

export type Story = {
  kicker: string
  title: string
  art?: SceneArt
  lines: StoryLine[]
  /** The Act 2 study: its pages are built from your games when it opens. */
  study?: boolean
}

/** "wayout:c1", "scene:month-1" or "study:prep"; null if it no longer exists. */
export function storyFor(id: string): Story | null {
  const [kind, key] = id.split(':')
  if (id === STUDY_ID) return { kicker: STUDY_TEXT.kicker, title: 'Prep: {name}', lines: [], study: true }
  if (kind === 'wayout') {
    const week = WEEK_STORY[key]
    const found = findWeek(key)
    if (!week || !found) return null
    // Week numbers carry on across seasons, as in the calendar.
    const before = ACTS.slice(0, found.act.act - 1).reduce((sum, a) => sum + a.chapters.length + 1, 0)
    return {
      kicker: 'On the way out',
      title: `Week ${before + found.index + 1} · ${found.act.chapters[found.index].title}`,
      lines: week.wayOut,
    }
  }
  const scene = kind === 'scene' ? findCutscene(key) : undefined
  return scene ? { kicker: scene.place, title: '', art: scene.art, lines: scene.lines } : null
}
