import { describe, expect, it } from 'vitest'
import {
  chatterAllowed,
  matchLineAllowed,
  mostImportant,
  rememberLine,
  selectLine,
  type DialogueContext,
  type DialogueLine,
} from './dialogue'

const line = (id: string, over: Partial<DialogueLine> = {}): DialogueLine => ({
  id,
  character: 'toby',
  trigger: 'game_start',
  text: id,
  expression: 'neutral',
  conditions: {},
  weight: 1,
  once: false,
  ...over,
})

const ctx: DialogueContext = {
  character: 'toby',
  trigger: 'game_start',
  act: 1,
  gameType: 'friendly',
  rematch: 1,
  losingStreak: 0,
  flags: [],
}
const empty = { recent: [], onceShown: [] }

describe('dialogue selection', () => {
  it("only picks this character's lines for this trigger", () => {
    const lines = [line('a'), line('b', { character: 'dex' }), line('c', { trigger: 'game_win' })]
    expect(selectLine(lines, ctx, empty)?.id).toBe('a')
  })

  it('respects conditions: act, game type, rematch number, flags', () => {
    const lines = [
      line('act2', { conditions: { acts: [2] } }),
      line('match', { conditions: { gameType: 'match' } }),
      line('third', { conditions: { rematch: 3 } }),
      line('flagged', { conditions: { flags: ['toby-left'] } }),
      line('any'),
    ]
    expect(selectLine(lines, ctx, empty)?.id).toBe('any')
    expect(selectLine(lines, { ...ctx, rematch: 3 }, empty, () => 0)?.id).toBe('third')
  })

  it("doesn't repeat until the set is used up", () => {
    const lines = [line('a'), line('b')]
    let history = rememberLine(empty, lines[0])
    expect(selectLine(lines, ctx, history)?.id).toBe('b')
    history = rememberLine(history, lines[1])
    expect(selectLine(lines, ctx, history)).not.toBeNull() // starts again
  })

  it('never shows a once-only line twice', () => {
    const lines = [line('first-meeting', { once: true })]
    const history = rememberLine(empty, lines[0])
    expect(selectLine(lines, ctx, history)).toBeNull()
  })

  it('picks the most important of several triggers', () => {
    expect(mostImportant(['castling', 'check_given', 'player_blunder'])).toBe('player_blunder')
    expect(mostImportant(['capture_minor', 'check_received'])).toBe('check_received')
  })

  it('allows matches two silent moments, 10 moves apart', () => {
    expect(matchLineAllowed({ linesSoFar: 0, moveNumber: 15, lastLineMove: null })).toBe(true)
    expect(matchLineAllowed({ linesSoFar: 1, moveNumber: 20, lastLineMove: 15 })).toBe(false)
    expect(matchLineAllowed({ linesSoFar: 1, moveNumber: 25, lastLineMove: 15 })).toBe(true)
    expect(matchLineAllowed({ linesSoFar: 2, moveNumber: 40, lastLineMove: 25 })).toBe(false)
  })

  it('matches lines by opening flags (plan hints)', () => {
    const lines = [
      line('london-plan', { trigger: 'plan_hint', conditions: { flags: ['opening:london'] } }),
      line('any-plan', { trigger: 'plan_hint' }),
    ]
    const hint = { ...ctx, trigger: 'plan_hint' as const }
    expect(selectLine(lines, { ...hint, flags: ['opening:french'] }, empty)?.id).toBe('any-plan')
    expect(selectLine(lines, { ...hint, flags: ['opening:london'] }, empty, () => 0)?.id).toBe('london-plan')
  })

  it('rations chatter: friendlies only, 3 a game, 6 moves apart', () => {
    const base = { gameType: 'friendly' as const, linesSoFar: 0, moveNumber: 10, lastLineMove: null }
    expect(chatterAllowed(base)).toBe(true)
    expect(chatterAllowed({ ...base, gameType: 'match' })).toBe(false)
    expect(chatterAllowed({ ...base, linesSoFar: 3 })).toBe(false)
    expect(chatterAllowed({ ...base, lastLineMove: 6 })).toBe(false)
    expect(chatterAllowed({ ...base, lastLineMove: 4 })).toBe(true)
  })
})
