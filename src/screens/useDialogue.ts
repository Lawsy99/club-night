// What the opponent says on the game screen: a line before the game, a few
// during friendlies, and one after. Lines fade after about 4 seconds or on
// tap (start and end lines stay until tapped).
import { useCallback, useEffect, useRef, useState } from 'react'
import { DIALOGUE, SPEAKER_NAMES } from '../data/dialogue'
import { fillName, rememberLine, selectLine, type DialogueHistory, type Expression, type Trigger } from '../logic/dialogue'
import { loadDialogueHistory, saveDialogueHistory } from '../storage/db'

export type SpokenLine = {
  text: string
  /** Someone other than the opponent (e.g. Neil), by display name. */
  speaker: string | null
  /** Whose face to show (character or speaker id), and how they look saying it. */
  face: string
  expression: Expression
  key: number
}

type Options = {
  character: string | undefined
  gameType: 'friendly' | 'match'
  act: number
  rematch: number
  losingStreak: number
  playerName?: string
  /** Chatter set to Off: only story beats are said. */
  storyOnly?: boolean
}

const FADE_MS = 4000

export function useDialogue({ character, gameType, act, rematch, losingStreak, playerName, storyOnly = false }: Options) {
  const [line, setLine] = useState<SpokenLine | null>(null)
  const history = useRef<DialogueHistory | null>(null)
  const counter = useRef(0)

  useEffect(() => {
    loadDialogueHistory()
      .then((h) => (history.current = h))
      .catch(() => (history.current = { recent: [], onceShown: [] }))
  }, [])

  // In-game chatter fades; start and end lines stay until tapped.
  const [persist, setPersist] = useState(false)
  useEffect(() => {
    if (!line || persist) return
    const t = window.setTimeout(() => setLine(null), FADE_MS)
    return () => window.clearTimeout(t)
  }, [line, persist])

  /** Says something for this trigger, if there's a fitting line. Returns whether it did. */
  const speak = useCallback(
    (trigger: Trigger, stay = false, flags: readonly string[] = []): boolean => {
      if (!character) return false
      const h = history.current ?? { recent: [], onceShown: [] }
      const chosen = selectLine(
        DIALOGUE,
        { character, trigger, act, gameType, rematch, losingStreak, flags, playerName, storyOnly },
        h,
      )
      if (!chosen) return false
      history.current = rememberLine(h, chosen)
      saveDialogueHistory(history.current).catch(() => undefined)
      setPersist(stay)
      setLine({
        text: fillName(chosen.text, playerName),
        speaker: chosen.speaker ? (SPEAKER_NAMES[chosen.speaker] ?? chosen.speaker) : null,
        face: chosen.speaker ?? chosen.character,
        expression: chosen.expression,
        key: ++counter.current,
      })
      return true
    },
    [character, act, gameType, rematch, losingStreak, playerName, storyOnly],
  )

  const dismiss = useCallback(() => setLine(null), [])
  return { line, speak, dismiss }
}
