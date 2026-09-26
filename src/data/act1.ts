// Act 1, "Club nights": the fixed path from after trial night to the
// knockout cup final (design document, "The path" and "Stakes").
//
// Revised Sep 2026 (Joseph: more runway; the story can move slowly, the
// essence is playing chess). Sixteen weeks, four months: seven story weeks,
// each introducing someone, with ordinary club weeks between them where you
// play people you already know, so they become familiar. Then cup week.
//
// Story beats are in content/dialogue.csv (lines flagged "chapter:c1" and so
// on) and data/noticeboard.ts; see docs/story-outline.md. Each week's
// coaching-night lesson is in lessons.ts (same id).

export type ChapterPlan = {
  id: string
  /** A story week meets someone new; a club week is an ordinary week with someone you know. */
  kind: 'story' | 'club'
  title: string
  /** The week's opponent: practice games on Thursday, the match on Saturday. */
  opponent: string
  matchLabel: string
  /** A little of what else is going on at the club that week (shown on the calendar). */
  note?: string
}

export type GauntletPlan = {
  title: string
  location: string
  /** The three cup rounds, against club members. */
  rounds: { opponent: string; label: string }[]
  boss: { opponent: string; label: string }
}

export type ActPlan = {
  act: number
  title: string
  chapters: ChapterPlan[]
  gauntlet: GauntletPlan
}

const story = (id: string, title: string, opponent: string, name: string): ChapterPlan => ({
  id,
  kind: 'story',
  title,
  opponent,
  matchLabel: `Club match vs ${name}`,
})

const club = (id: string, title: string, opponent: string, name: string, note: string): ChapterPlan => ({
  id,
  kind: 'club',
  title,
  opponent,
  matchLabel: `Club match vs ${name}`,
  note,
})

export const ACT_1: ActPlan = {
  act: 1,
  title: 'Club nights',
  chapters: [
    story('c1', 'First proper club night', 'marjorie', 'Marjorie'),
    story('c2', 'The streamer', 'dex', 'Dex'),
    club('w3', 'Raffle night', 'marjorie', 'Marjorie', 'Sheila is selling raffle tickets.'),
    story('c3', 'Junior night', 'oscar', 'Oscar'),
    club('w5', 'Off camera', 'dex', 'Dex', 'Graham has put up a notice about filming.'),
    story('c4', 'A quiet one', 'clive', 'Clive'),
    club('w7', 'Junior night overruns', 'oscar', 'Oscar', 'Ray needs the big room.'),
    story('c5', 'By the book', 'priya', 'Priya'),
    club('w9', 'A long evening', 'clive', 'Clive', 'Bill stays to watch.'),
    story('c6', 'Subs are due', 'graham', 'Graham'),
    club('w11', 'Chapter nine', 'priya', 'Priya', 'Priya has the new edition.'),
    club('w12', 'General meeting', 'marjorie', 'Marjorie', 'The general meeting is on Tuesday.'),
    story('c7', 'No pressure, mate', 'toby', 'Toby'),
    club('w14', 'Minutes of the last meeting', 'graham', 'Graham', 'Graham reads the minutes.'),
    club('w15', 'Before the cup', 'dex', 'Dex', 'The cup draw goes up.'),
  ],
  gauntlet: {
    title: 'The club knockout cup',
    location: 'The back room of the Red Lion',
    rounds: [
      // Played at club ratings, so the draw is ordered to get harder each round:
      // Clive (settled, well below by now), Oscar (about −90), Priya (−20).
      { opponent: 'clive', label: 'Cup round 1 vs Clive' },
      { opponent: 'oscar', label: 'Cup round 2 vs Oscar' },
      { opponent: 'priya', label: 'Cup semi-final vs Priya' },
    ],
    boss: { opponent: 'toby', label: 'Cup final vs Toby' },
  },
}

/** How many story weeks come before this week (story offsets follow these, not weeks). */
export function storyWeeksBefore(week: number): number {
  return ACT_1.chapters.slice(0, week).filter((c) => c.kind === 'story').length
}

/** Trial night: the four placement games, in order (design: "Trial night"). */
export const TRIAL_OPPONENTS = ['marjorie', 'dex', 'graham', 'clive']

/**
 * Then one last game "for fun" against Toby, who is also new that night. He
 * plays at full engine strength, so the player loses: the story's first sting.
 * It doesn't count towards the rating, and his rating is hidden ("unrated").
 */
export const TRIAL_FINALE = { opponent: 'toby', label: 'Trial night · one for fun vs Toby' }
