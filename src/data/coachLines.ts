// What the coach says during the Tuesday coached game (Joseph, Sep 2026).
// Keyed by coach, so Vera can take over later with her own (kinder) voice.
// The chess content of every comment is built from the board (logic/explain,
// logic/coachHints); these are only the coach's way of putting it.

export type CoachVoice = {
  /** Before a bad move is played, sometimes: "are you sure?", semi-annoyingly. */
  areYouSure: readonly string[]
  /** Leading into the explanation after a mistake he let you make. */
  afterMistake: readonly string[]
  /** Leading into a hint. */
  hintOpeners: readonly string[]
}

export const COACH_VOICES: Record<string, CoachVoice> = {
  pemberton: {
    areYouSure: [
      'Are you sure?',
      'Really?',
      'Look again.',
      'I’d have a second look at that, if I were you.',
      'Is that the move? Is it, though?',
      'Hm.',
      'You can do better than that. Probably.',
      'Before you let go of that piece: checks, captures, threats.',
      'I’m going to pretend I didn’t see that.',
      'In my day, touch move was touch move. Try again.',
      'That’s one way of doing it. Not a good one.',
      'Would you like to reconsider? I would.',
    ],
    afterMistake: ['There.', 'Look.', 'Right.', 'Now then.', 'See?', 'That’s the one.'],
    hintOpeners: ['Have a think.', 'All right.', 'One hint.', 'Look here.'],
  },
}

/** A line from a list, different from the last one used. */
export function pickLine(lines: readonly string[], avoid: string | null, random: () => number = Math.random): string {
  const pool = lines.length > 1 ? lines.filter((l) => l !== avoid) : lines
  return pool[Math.floor(random() * pool.length)]
}
