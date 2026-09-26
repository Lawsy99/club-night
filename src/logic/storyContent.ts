// What a story id plays: the week's "On the way out" or a cutscene.
import { ACT_1 } from '../data/act1'
import { findCutscene, type SceneArt } from '../data/cutscenes'
import { WEEK_STORY, type StoryLine } from '../data/weekStory'

export type Story = { kicker: string; title: string; art?: SceneArt; lines: StoryLine[] }

/** "wayout:c1" or "scene:month-1"; null if it no longer exists. */
export function storyFor(id: string): Story | null {
  const [kind, key] = id.split(':')
  if (kind === 'wayout') {
    const week = WEEK_STORY[key]
    const index = ACT_1.chapters.findIndex((c) => c.id === key)
    if (!week || index < 0) return null
    return { kicker: 'On the way out', title: `Week ${index + 1} · ${ACT_1.chapters[index].title}`, lines: week.wayOut }
  }
  const scene = kind === 'scene' ? findCutscene(key) : undefined
  return scene ? { kicker: scene.place, title: '', art: scene.art, lines: scene.lines } : null
}
