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
    story('a2-1', 'The ladder goes up', 'graham', 'Graham', 'There’s a new line on the honours board, in gold. The paint is still tacky.'),
    story('a2-2', 'Captain', 'priya', 'Priya', 'Toby is captain. Graham has minuted it.'),
    club('a2-3', 'Subs, again', 'clive', 'Clive', 'Castlebury on Saturday, at home. Marjorie has borrowed extra cups.'),
    story('a2-4', 'Board four', 'ray', 'Ray', 'The league team needs a fourth board.'),
    club('a2-5', 'The Terry', 'terry', 'Terry', 'Terry has been preparing something. It has a name now.'),
    story('a2-6', 'Going live', 'dex', 'Dex', 'Dex keeps checking his phone. The numbers, presumably.'),
    club('a2-7', 'New faces', 'marjorie', 'Marjorie', 'Three people nobody knows are at the door.'),
    story('a2-8', 'Away at Castlebury', 'oscar', 'Oscar', 'The return at Castlebury. Board four is still in pencil.'),
    club('a2-9', 'Notes', 'priya', 'Priya', 'Priya has a notebook with your name on it.'),
    story('a2-10', 'The study', 'malcolm', 'Malcolm', 'Malcolm is in on a Tuesday. Nobody can remember the last time.'),
    club('a2-11', 'Off air', 'dex', 'Dex', 'Dex has been on his laptop all week. He won’t say what at.'),
    club('a2-12', 'Extraordinary general meeting', 'graham', 'Graham', 'Graham has booked the back room for an extraordinary general meeting.'),
    story('a2-13', 'Kingsbridge', 'oscar', 'Oscar', 'Neil wants a word. About Oscar.'),
    club('a2-14', 'Notice', 'clive', 'Clive', 'A letter from the brewery. Graham hasn’t laminated it. That’s how you know.'),
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
