// A small wooden "tock" for each move, made on the fly with the browser's
// audio (no sound files to download). A capture is a slightly heavier
// double knock. Off when the player turns sound off in Settings.

let enabled = true
let audio: AudioContext | null = null

export function setSoundEnabled(on: boolean) {
  enabled = on
}

/** iPhone only lets a page make sound after a tap, so wake the audio on the first one. */
function context(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null
  audio ??= new AudioContext()
  if (audio.state === 'suspended') void audio.resume().catch(() => undefined)
  return audio
}

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', () => void context(), { once: true, capture: true })
}

function knock(ctx: AudioContext, at: number, pitch: number, volume: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(pitch, at)
  osc.frequency.exponentialRampToValueAtTime(pitch * 0.6, at + 0.08)
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(volume, at + 0.004)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.09)
  osc.connect(gain).connect(ctx.destination)
  osc.start(at)
  osc.stop(at + 0.1)
}

export function playMoveSound(capture: boolean) {
  if (!enabled) return
  const ctx = context()
  if (!ctx || ctx.state !== 'running') return
  const now = ctx.currentTime
  knock(ctx, now, capture ? 520 : 660, capture ? 0.35 : 0.25)
  if (capture) knock(ctx, now + 0.05, 440, 0.25)
}
