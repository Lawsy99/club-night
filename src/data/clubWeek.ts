// The club week (Joseph, Sep 2026): each chapter is a week at Wexley, run
// the way a real club runs: a coaching night, a practice night, and a match.

export type Session = 'coaching' | 'practice' | 'match'

export const SESSIONS: Record<Session, { day: string; name: string; short: string }> = {
  coaching: { day: 'Tuesday', name: 'Coaching night', short: 'Coaching' },
  practice: { day: 'Thursday', name: 'Practice night', short: 'Practice' },
  match: { day: 'Saturday', name: 'Match day', short: 'Match' },
}

/** e.g. "Thursday · practice night", shown on the Next card and above the board. */
export function sessionLabel(s: Session): string {
  return `${SESSIONS[s].day} · ${SESSIONS[s].name.toLowerCase()}`
}
