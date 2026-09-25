// Act 1, "Club nights": the fixed path from after trial night to the
// knockout cup final (design document, "The path" and "Stakes").
// PLACEHOLDER TEXT: titles and locations are stand-ins until the Act 1 story
// outline is written (phase 6). Lessons arrive in phase 5.

export type ChapterPlan = {
  id: string
  title: string
  /** e.g. "Club night · Tuesday", shown on the Next card. */
  location: string
  /** Lesson topic (phase 5); shown as a placeholder step until then. */
  lesson: string
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
      lesson: "The London System's plan, and how to break it",
      opponent: 'marjorie',
      matchLabel: 'Club match vs Marjorie',
    },
    {
      id: 'c2',
      title: 'The streamer',
      location: 'Club night · Tuesday',
      lesson: 'Meeting a gambit calmly',
      opponent: 'dex',
      matchLabel: 'Club match vs Dex',
    },
    {
      id: 'c3',
      title: 'Junior night',
      location: 'Club night · Thursday',
      lesson: 'Staying calm against fast, confident play',
      opponent: 'oscar',
      matchLabel: 'Club match vs Oscar',
    },
    {
      id: 'c4',
      title: 'A quiet one',
      location: 'Club night · Tuesday',
      lesson: 'Creating winning chances in a level position',
      opponent: 'clive',
      matchLabel: 'Club match vs Clive',
    },
    {
      id: 'c5',
      title: 'By the book',
      location: 'Club night · Tuesday',
      lesson: 'What to do once the opening theory runs out',
      opponent: 'priya',
      matchLabel: 'Club match vs Priya',
    },
    {
      id: 'c6',
      title: 'Subs are due',
      location: 'Club night · Tuesday',
      lesson: 'Classical, principled positions',
      opponent: 'graham',
      matchLabel: 'Club match vs Graham',
    },
    {
      id: 'c7',
      title: 'No pressure, mate',
      location: 'Club night · Tuesday',
      lesson: 'Fixing your own weak spots',
      opponent: 'toby',
      matchLabel: 'Club match vs Toby',
    },
  ],
  gauntlet: {
    title: 'The club knockout cup',
    location: 'The back room of the Red Lion',
    rounds: [
      { opponent: 'oscar', label: 'Cup round 1 vs Oscar' },
      { opponent: 'clive', label: 'Cup round 2 vs Clive' },
      { opponent: 'graham', label: 'Cup semi-final vs Graham' },
    ],
    boss: { opponent: 'toby', label: 'Cup final vs Toby' },
  },
}

/** Trial night: the five placement games, in order (design: "Trial night"). */
export const TRIAL_OPPONENTS = ['marjorie', 'dex', 'graham', 'clive', 'toby']
