// Short cutscenes (Joseph, Sep 2026): once a month and at the end of the
// act, straight after you win that week's match. One illustrated place,
// three to five lines, tap through, skippable. Short, sharp, clean: no
// narrator, nothing explained; something has visibly changed.
// See docs/story-outline.md, "Short cutscenes".
import type { StoryLine } from './weekStory'

export type SceneArt =
  | 'club-room'
  | 'car-park'
  | 'honours-board'
  | 'noticeboard'
  | 'team-sheet'
  | 'league-hall'
  | 'kitchen'
  | 'empty-room'

export type Cutscene = {
  id: string
  /** Plays after this week's match is won (a week id), or after an act's final ("final:1"). */
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
    after: 'final:1',
    art: 'noticeboard',
    place: 'The next morning',
    lines: [
      { text: 'A new sheet on the noticeboard: Club ladder.' },
      { text: 'One name is already typed at the top.' },
      { text: 'Graham straightens it, and steps back to check.' },
    ],
  },

  // --- Act 2: the club ladder ---
  {
    id: 'month-5',
    after: 'a2-4',
    art: 'team-sheet',
    place: 'The noticeboard, Friday',
    lines: [
      { text: 'The team sheet for Castlebury, in pencil. Four boards, and a line for reserves.' },
      { text: 'Someone has added your name under reserves, in different handwriting.' },
      { who: 'marjorie', text: 'Well. Somebody had to.' },
    ],
  },
  {
    id: 'month-6',
    after: 'a2-8',
    art: 'league-hall',
    place: 'Castlebury, away',
    lines: [
      { text: 'Castlebury’s hall has proper lights, and a clock on every board.' },
      { text: 'Wexley’s team sit in a row. Oscar’s feet don’t reach the floor.' },
      { text: 'Toby shakes every hand in the room. Pemberton watches board two all night.' },
    ],
  },
  {
    id: 'month-7',
    after: 'a2-12',
    art: 'kitchen',
    place: 'The kitchen, after the meeting',
    lines: [
      { text: 'Marjorie washes up forty cups. Nine were used.' },
      { text: 'The subs tin is on the side. She doesn’t open it.' },
      { who: 'marjorie', text: 'We’ve been here before. We’ll manage.' },
    ],
  },
  {
    id: 'split',
    after: 'final:2',
    art: 'empty-room',
    place: 'A week later. Tuesday.',
    lines: [
      { text: 'Pemberton’s chair isn’t there. Toby’s name is off the ladder.' },
      { text: 'There’s a Kingsbridge card on the noticeboard. Nobody has taken it down.' },
      { who: 'marjorie', text: 'Kingsbridge. Both of them. Lovely hall, apparently.' },
      { text: 'Nobody sets up the second room.' },
    ],
  },
]

export function findCutscene(id: string): Cutscene | undefined {
  return CUTSCENES.find((c) => c.id === id)
}
