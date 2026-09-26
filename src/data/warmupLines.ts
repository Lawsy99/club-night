// What Pemberton says on the Home screen when Tuesday's warm-ups are waiting.
// One line per week, so it changes from week to week but doesn't flicker
// while you come and go (Joseph, Sep 2026: the single line got repetitive).
// Kept count-neutral: there may be one, two or three positions.

export const WARMUP_LINES: readonly string[] = [
  'Your mistakes from last week. Find the better move.',
  'Before the lesson, a few positions you got wrong. Get them right this time.',
  'I went through your games. We need to talk about these.',
  'These are yours. I didn’t have to look far.',
  'Same position, second chance. There won’t be a third.',
  'Coat off. Warm-ups first, from your own games.',
  'Nobody else has seen these. Let’s keep it that way.',
  'Look properly this time. Checks, captures, threats.',
  'You’ll recognise these. You were there.',
  'Five minutes on last week before we start this one.',
  'I’ve set these up from your games. Take your time.',
  'Every player makes these. Good players only make them once.',
  'A few moments from last week. You know what happened next.',
  'Tea’s brewing. Do these while it stews.',
]

/** The first week: the only games so far are from trial night. */
export const FIRST_WARMUP_LINE = 'Something from trial night. Let’s see what you do with it now you’ve had a week.'

/** This week's line: steady within a week, different from last week's. */
export function warmupLine(week: number): string {
  if (week === 0) return FIRST_WARMUP_LINE
  // Stepping by a number with no common factor with the list length visits
  // every line before repeating, and never shows the same one two weeks running.
  const step = 5
  const n = WARMUP_LINES.length
  return WARMUP_LINES[(((week * step) % n) + n) % n]
}
