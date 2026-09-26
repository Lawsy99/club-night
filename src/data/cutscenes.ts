// Short cutscenes (Joseph, Sep 2026): once a month and at the end of the
// act, straight after you win that week's match. One illustrated place,
// three to five lines, tap through, skippable. Short, sharp, clean: no
// narrator, nothing explained; something has visibly changed.
// See docs/story-outline.md, "Short cutscenes".
import type { StoryLine } from './weekStory'

export type SceneArt = 'club-room' | 'car-park' | 'honours-board' | 'noticeboard'

export type Cutscene = {
  id: string
  /** Plays after this week's match is won (a chapter id), or after the cup final ('cup'). */
  after: string
  art: SceneArt
  /** A small caption over the picture: where and when. */
  place: string
  lines: StoryLine[]
}

export const CUTSCENES: Cutscene[] = [
  {
    id: 'month-1',
    after: 'c3',
    art: 'club-room',
    place: 'The Red Lion, after club',
    lines: [
      { text: 'Everyone’s gone. Marjorie wipes down the boards, one by one.' },
      { text: 'One chair is still out: Pemberton’s, turned towards Toby’s board.' },
      { text: 'She looks at it for a moment, then pushes it in.' },
    ],
  },
  {
    id: 'month-2',
    after: 'c5',
    art: 'car-park',
    place: 'The car park, Thursday',
    lines: [
      { text: 'Rain. Dex sits in his car with the phone lit up. Twelve watching.' },
      { text: 'He waits for the number to go up.' },
      { text: 'It doesn’t. He goes live anyway.' },
    ],
  },
  {
    id: 'month-3',
    after: 'w12',
    art: 'honours-board',
    place: 'The Red Lion, Saturday morning',
    lines: [
      { text: 'Bill is working along the honours board with a duster.' },
      { text: 'He stops at one name, the same one ten years running.' },
      { who: 'bill', text: 'Ten years. Then nothing.' },
      { text: 'He moves on to the next name.' },
    ],
  },
  {
    id: 'cup',
    after: 'cup',
    art: 'noticeboard',
    place: 'The next morning',
    lines: [
      { text: 'A new sheet on the noticeboard: Club ladder.' },
      { text: 'One name is already typed at the top.' },
      { text: 'Graham straightens it, and steps back to check.' },
    ],
  },
]

export function findCutscene(id: string): Cutscene | undefined {
  return CUTSCENES.find((c) => c.id === id)
}
