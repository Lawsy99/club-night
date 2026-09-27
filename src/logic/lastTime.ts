// "Last time" (Sep 2026, honing the story): coming back after a few days,
// Home shows the last line of the story you saw, so the thread is picked up
// where it was left. Only after a real gap, and only until you play.
import { findCharacter } from '../data/characters'
import { SPEAKER_NAMES } from '../data/dialogue'
import { storyFor } from './storyContent'

/** Away at least this long before the reminder shows. */
export const AWAY_FOR_RECAP_MS = 2 * 24 * 60 * 60 * 1000

const LAST_OPEN_KEY = 'club-night-last-open'

let awayMs: number | null = null

/** How long since the app was last opened (0 on the first open), read once per launch. */
export function timeAway(now = Date.now()): number {
  if (awayMs !== null) return awayMs
  try {
    const last = Number(localStorage.getItem(LAST_OPEN_KEY))
    awayMs = last > 0 ? now - last : 0
    localStorage.setItem(LAST_OPEN_KEY, String(now))
  } catch {
    awayMs = 0
  }
  return awayMs
}

/** The last line of the most recent story moment, as it would be read ("Dex: ..."). */
export function lastStoryLine(storySeen: readonly string[] | undefined): string | null {
  for (const id of [...(storySeen ?? [])].reverse()) {
    const story = storyFor(id)
    if (story?.study) return 'Toby sent you his study. It was about you.'
    const line = story?.lines.at(-1)
    if (!line) continue
    if (!line.who) return line.text
    const name = findCharacter(line.who)?.name ?? SPEAKER_NAMES[line.who] ?? line.who
    return `${name}: “${line.text}”`
  }
  return null
}
