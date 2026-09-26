// Which story moments play after a win (Joseph, Sep 2026: straight after
// you beat that week's opponent, tapped through). Kept apart from path.ts's
// imports so the path can use it without a loop.
import { CUTSCENES } from '../data/cutscenes'
import { WEEK_STORY } from '../data/weekStory'

/** "wayout:c1" is a week's closing moment; "scene:month-1" is a cutscene. */
export type StoryId = string

/** What plays once the week's best of three is won: the way out, then any cutscene. */
export function storyAfterWin(chapterId: string): StoryId[] {
  const ids: StoryId[] = []
  if (WEEK_STORY[chapterId]) ids.push(`wayout:${chapterId}`)
  for (const c of CUTSCENES) if (c.after === chapterId) ids.push(`scene:${c.id}`)
  return ids
}

/** After the cup final is won. */
export function storyAfterCup(): StoryId[] {
  return CUTSCENES.filter((c) => c.after === 'cup').map((c) => `scene:${c.id}`)
}
