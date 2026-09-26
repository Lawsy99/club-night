// Act 2, "The club ladder" (docs/story-outline.md, "Act 2 in detail").
//
// The ladder goes up the week after the cup, with Toby already at the top
// and made captain. Sixteen more weeks: Saturdays are ladder challenges (the
// person above you, or someone below challenging you), the league team is
// picked, Dex's stream is found out, Toby sends the wrong study, the club
// runs out of money and room. It ends at the top of the ladder: Toby. Then
// the split (a cutscene): Toby and Pemberton leave for Kingsbridge.
//
// No act numbers on screen: the calendar simply carries on (Month 5, Week 17).
import { clubChapter, storyChapter, type ActPlan } from './act1'

const LADDER = 'Ladder challenge'
const story = (id: string, title: string, opponent: string, name: string, note: string) =>
  storyChapter(id, title, opponent, name, note, LADDER)
const club = (id: string, title: string, opponent: string, name: string, note: string) =>
  clubChapter(id, title, opponent, name, note, LADDER)

/** An offset that changes at the given weeks: steps([[0, -30], [5, 15]]) → −30 until week 6, then +15. */
function steps(changes: [fromWeek: number, offset: number][], weeks = 16): number[] {
  return Array.from({ length: weeks }, (_, w) => {
    let value = changes[0][1]
    for (const [from, offset] of changes) if (w >= from) value = offset
    return value
  })
}

export const ACT_2: ActPlan = {
  act: 2,
  title: 'The club ladder',
  matchPrefix: LADDER,
  chapters: [
    story('a2-1', 'The ladder goes up', 'graham', 'Graham', 'Pemberton has pinned up the ladder. Toby’s name is at the top.'),
    story('a2-2', 'Captain', 'priya', 'Priya', 'Toby is captain. Graham has minuted it.'),
    club('a2-3', 'Subs, again', 'clive', 'Clive', 'Graham is collecting subs with a receipt book.'),
    story('a2-4', 'Board four', 'ray', 'Ray', 'The league team needs a fourth board.'),
    club('a2-5', 'The Terry', 'terry', 'Terry', 'Terry has been preparing something. It has a name now.'),
    story('a2-6', 'Going live', 'dex', 'Dex', 'Graham has found out about the stream.'),
    club('a2-7', 'New faces', 'marjorie', 'Marjorie', 'Three people nobody knows are at the door.'),
    story('a2-8', 'The first league match', 'oscar', 'Oscar', 'Oscar has grown two inches and a hundred points.'),
    club('a2-9', 'Notes', 'priya', 'Priya', 'Priya has a notebook with your name on it.'),
    story('a2-10', 'The study', 'malcolm', 'Malcolm', 'Toby has sent you a Lichess study.'),
    club('a2-11', 'Off air', 'dex', 'Dex', 'Dex has stopped streaming Wexley games.'),
    club('a2-12', 'Extraordinary general meeting', 'graham', 'Graham', 'The meeting is on Tuesday. Laminated.'),
    story('a2-13', 'Kingsbridge', 'oscar', 'Oscar', 'A Kingsbridge club card is on the noticeboard.'),
    club('a2-14', 'Notice', 'clive', 'Clive', 'The pub wants the back room for functions from the spring.'),
    club('a2-15', 'One rung left', 'terry', 'Terry', 'Pemberton sends his apologies. Through Toby.'),
  ],
  gauntlet: {
    title: 'The top of the ladder',
    location: 'The back room of the Red Lion',
    weekTitle: 'Top of the ladder',
    slots: ['Priya', 'Malcolm', 'Toby'],
    note: 'The last rungs. Graham has drawn up a schedule. Toby says there’s no rush.',
    afterNote: 'Tuesday. Pemberton’s chair is empty.',
    rounds: [
      { opponent: 'priya', label: 'Ladder challenge vs Priya' },
      { opponent: 'malcolm', label: 'Ladder challenge vs Malcolm' },
    ],
    boss: { opponent: 'toby', label: 'Top of the ladder vs Toby' },
    won: { heading: 'Top of the ladder.', note: 'Your name at the top, in Graham’s typing. Toby shook your hand. He didn’t stay for a drink.' },
  },
  startLabel: 'The ladder goes up',
  // Where the scaling cast sit this season, week by week. (The fixed members,
  // Marjorie, Clive, Graham, Ray, Malcolm, stay where trial night set them:
  // you climb past them.) Each story week's person is set just above you, so
  // Saturday is a real climb; once beaten, they settle just below.
  offsets: {
    toby: steps([[0, 60]]),
    priya: steps([[0, 20], [2, -10], [8, 10], [9, -15], [15, 10]]),
    dex: steps([[0, -30], [5, 15], [6, -15], [10, 0], [11, -20]]),
    oscar: steps([[0, -20], [7, 20], [8, 0], [12, 25], [13, 0]]),
    terry: steps([[0, -40]]),
  },
}
