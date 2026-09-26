// Act 1, "Club nights": the fixed path from after trial night to the
// knockout cup final (design document, "The path" and "Stakes").
// The story beats for each chapter are in content/dialogue.csv (lines flagged
// "chapter:c1" and so on) and data/noticeboard.ts; see docs/story-outline.md.
// Each chapter's lesson is in lessons.ts (same id).

export type ChapterPlan = {
  id: string
  title: string
  /** e.g. "Club night · Tuesday", shown on the Next card. */
  location: string
  /** The chapter's opponent: friendlies, then the match. */
  opponent: string
  matchLabel: string
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

export const ACT_1: ActPlan = {
  act: 1,
  title: 'Club nights',
  chapters: [
    {
      id: 'c1',
      title: 'First proper club night',
      location: 'Club night · Tuesday',
      opponent: 'marjorie',
      matchLabel: 'Club match vs Marjorie',
    },
    {
      id: 'c2',
      title: 'The streamer',
      location: 'Club night · Tuesday',
      opponent: 'dex',
      matchLabel: 'Club match vs Dex',
    },
    {
      id: 'c3',
      title: 'Junior night',
      location: 'Club night · Thursday',
      opponent: 'oscar',
      matchLabel: 'Club match vs Oscar',
    },
    {
      id: 'c4',
      title: 'A quiet one',
      location: 'Club night · Tuesday',
      opponent: 'clive',
      matchLabel: 'Club match vs Clive',
    },
    {
      id: 'c5',
      title: 'By the book',
      location: 'Club night · Tuesday',
      opponent: 'priya',
      matchLabel: 'Club match vs Priya',
    },
    {
      id: 'c6',
      title: 'Subs are due',
      location: 'Club night · Tuesday',
      opponent: 'graham',
      matchLabel: 'Club match vs Graham',
    },
    {
      id: 'c7',
      title: 'No pressure, mate',
      location: 'Club night · Tuesday',
      opponent: 'toby',
      matchLabel: 'Club match vs Toby',
    },
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

/** Trial night: the four placement games, in order (design: "Trial night"). */
export const TRIAL_OPPONENTS = ['marjorie', 'dex', 'graham', 'clive']

/**
 * Then one last game "for fun" against Toby, who is also new that night. He
 * plays at full engine strength, so the player loses: the story's first sting.
 * It doesn't count towards the rating, and his rating is hidden ("unrated").
 */
export const TRIAL_FINALE = { opponent: 'toby', label: 'Trial night · one for fun vs Toby' }
