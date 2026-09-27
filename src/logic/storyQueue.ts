// Which story moments play after a win (Joseph, Sep 2026: straight after
// you beat that week's opponent, tapped through). Kept apart from path.ts's
// imports so the path can use it without a loop.
import { CUTSCENES } from '../data/cutscenes'
import { STUDY_WEEK } from '../data/prepStudy'
import { WEEK_STORY } from '../data/weekStory'

/** "wayout:c1" is a week's closing moment; "scene:month-1" is a cutscene; "study:prep" is the study. */
export type StoryId = string

export const STUDY_ID = 'study:prep'

/** What plays once the week's best of three is won: the way out, then any cutscene. */
export function storyAfterWin(chapterId: string): StoryId[] {
  const ids: StoryId[] = []
  if (WEEK_STORY[chapterId]) ids.push(`wayout:${chapterId}`)
  // Toby's "Sending you my study, mate": it opens straight away.
  if (chapterId === STUDY_WEEK) ids.push(STUDY_ID)
  for (const c of CUTSCENES) if (c.after === chapterId) ids.push(`scene:${c.id}`)
  return ids
}

/** When trial night ends (after Toby's game, win or lose): the first hook. */
export function storyAfterTrial(): StoryId[] {
  return CUTSCENES.filter((c) => c.after === 'trial').map((c) => `scene:${c.id}`)
}

/** After an act's final is won (the cup in Act 1, the top of the ladder in Act 2). */
export function storyAfterFinal(act: number): StoryId[] {
  return CUTSCENES.filter((c) => c.after === `final:${act}`).map((c) => `scene:${c.id}`)
}
