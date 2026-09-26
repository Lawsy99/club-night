// The hidden playtest tools (five taps on the version line on Home). Kept on
// this phone only, until hidden again. Also shows engine timings in games.
const PLAYTEST_KEY = 'club-night-playtest'

export function playtestOn(): boolean {
  try {
    return localStorage.getItem(PLAYTEST_KEY) === 'on'
  } catch {
    return false
  }
}

export function setPlaytestOn(on: boolean): void {
  try {
    if (on) localStorage.setItem(PLAYTEST_KEY, 'on')
    else localStorage.removeItem(PLAYTEST_KEY)
  } catch {
    // Storage blocked: the tools just won't be remembered.
  }
}
