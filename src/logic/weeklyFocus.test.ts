import { describe, expect, it } from 'vitest'
import { chooseFocus, focusCheck } from './weeklyFocus'
import type { ErrorKind } from './explain'

const games = (...g: ErrorKind[][]) => g

describe('the weekly focus', () => {
  it('picks the habit behind most of your recent mistakes', () => {
    const f = chooseFocus('1:c2', 0, games(['fork'], ['lost-material', 'undefended'], ['fork']), null)
    expect(f.id).toBe('their-threats')
    expect(f.baseline).toBe(1)
    expect(f.verdict).toBeNull()
  })

  it('starts a new player on loose pieces', () => {
    expect(chooseFocus('1:c1', 0, [], null)).toMatchObject({ id: 'loose-pieces', baseline: null })
  })

  it('moves on once last week’s habit has halved, and says so', () => {
    const prev = chooseFocus('1:c2', 0, games(['undefended', 'undefended'], ['undefended']), null)
    const next = chooseFocus('1:w3', 1, games(['fork'], ['undefended']), { focus: prev, since: games([], ['fork']) })
    expect(next.id).toBe('their-threats')
    expect(next.verdict).toBe('Last week, loose pieces: none in 2 games. That’ll do. On to something else.')
  })

  it('stays on a habit that hasn’t improved', () => {
    const prev = chooseFocus('1:c2', 0, games(['undefended'], ['undefended']), null)
    const next = chooseFocus('1:w3', 1, games(['undefended'], ['undefended']), { focus: prev, since: games(['undefended'], ['undefended']) })
    expect(next.id).toBe('loose-pieces')
    expect(next.verdict).toMatch(/still about one a game\. We’ll stay on it/)
  })

  it('checks a game against the focus, naming the moves', () => {
    const focus = { id: 'loose-pieces' as const, baseline: 2 }
    expect(focusCheck(focus, [])).toBe('Loose pieces, this week’s job: none this game. You were averaging about two. That’s the habit working.')
    expect(focusCheck(focus, [{ ply: 22, kind: 'undefended' }, { ply: 9, kind: 'fork' }])).toBe(
      'Loose pieces, this week’s job: one this game, on move 12. Down from about two a game. Getting there.',
    )
    expect(focusCheck({ id: 'loose-pieces', baseline: 1 }, [{ ply: 14, kind: 'undefended' }, { ply: 30, kind: 'undefended' }])).toBe(
      'Loose pieces, this week’s job: two this game, on moves 8 and 16. Before every move, check that everything of yours is defended.',
    )
  })
})
