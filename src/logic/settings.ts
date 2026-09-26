// The player's settings (design document, "Chatter setting" and "Screens").

/**
 * Full: everything. Quiet: lines before and after the game only.
 * Off: story beats only.
 */
export type Chatter = 'full' | 'quiet' | 'off'

export type Settings = {
  chatter: Chatter
}

export const DEFAULT_SETTINGS: Settings = { chatter: 'full' }

export const CHATTER_OPTIONS: { value: Chatter; label: string; detail: string }[] = [
  { value: 'full', label: 'Full', detail: 'Lines before, during and after games.' },
  { value: 'quiet', label: 'Quiet', detail: 'Before and after the game only.' },
  { value: 'off', label: 'Off', detail: 'Story moments only.' },
]
