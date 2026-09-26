import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { COACH_SCENARIOS } from '../data/coachScenarios'
import { findScenario, pickScenario, scenarioMove, scenarioState, scenarioVerdict } from './coachScenario'
import { parseLine } from './openingBook'

describe("Pemberton's traps", () => {
  it('are all legal, and start with his move when he has White', () => {
    for (const s of COACH_SCENARIOS) {
      const setup = parseLine(s.setup)
      // The set-up ends on his own move, so the trap is set when you reply.
      const lastMover = setup.length % 2 === 1 ? 'w' : 'b'
      expect(lastMover, s.id).toBe(s.coachColour)
      for (const line of s.punish ?? []) {
        const moves = parseLine(line)
        expect(moves.slice(0, setup.length), `${s.id}: punish follows the set-up`).toEqual(setup)
      }
    }
  })

  it('mating punishments really are mate', () => {
    for (const s of COACH_SCENARIOS) {
      for (const line of (s.punish ?? []).filter((l) => l.endsWith('#'))) {
        const chess = new Chess()
        for (const uci of parseLine(line)) chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
        expect(chess.isCheckmate(), line).toBe(true)
      }
    }
  })

  it('suit the rating and the colours', () => {
    expect(pickScenario(700, 'w', [])?.id).toBe('scholars')
    expect(pickScenario(700, 'b', [])?.id).toBe('blackburne')
    expect(pickScenario(700, 'b', ['blackburne'])?.id).toBe('englund')
    expect(pickScenario(2000, 'b', [])?.id).toBe('marshall')
  })

  it('plays the line, follows up if you take the bait, and judges afterwards', () => {
    const s = findScenario('blackburne')!
    expect(scenarioMove(s, ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4'])).toBe('c6d4')
    // You take the pawn: he follows up with Qg5.
    expect(scenarioMove(s, ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'c6d4', 'f3e5'])).toBe('d8g5')
    expect(scenarioState(s, ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'c6d4'])).toBe('following')
    // No Italian: avoided.
    expect(scenarioState(s, ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5'])).toBe('avoided')
    // You castle instead of taking: judged a few moves later.
    const castled = ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'c6d4', 'e1g1']
    expect(scenarioState(s, castled)).toBe('waiting')
    expect(scenarioState(s, [...castled, 'a7a6', 'a2a3', 'a6a5', 'b2b3', 'h7h6', 'c2c3'])).toBe('judge')
    expect(scenarioVerdict(-40)).toBe('escaped')
    expect(scenarioVerdict(-400)).toBe('fell')
  })
})
