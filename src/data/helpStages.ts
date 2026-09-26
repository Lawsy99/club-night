// The three help stages, as set out in the design document ("The help stages").

export type HelpStageId = 'assisted' | 'guided' | 'real'

export type BlunderWarningRule = {
  /** Warn when a move gives away at least this much advantage, in centipawns (100 = one pawn). */
  minLossCp: number
  /** Always warn when a move allows a forced mate. */
  allowsMate: boolean
}

export type HelpStage = {
  id: HelpStageId
  label: string
  /** Short description shown under the game title. */
  summary: string
  evalBar: boolean
  bestLine: boolean
  hints: boolean
  /** Takebacks allowed per game (Infinity = unlimited). */
  takebacks: number
  blunderWarning: BlunderWarningRule | null
}

export const HELP_STAGES: Record<HelpStageId, HelpStage> = {
  assisted: {
    id: 'assisted',
    label: 'Coached',
    summary: 'full help',
    evalBar: true,
    bestLine: true,
    hints: true,
    takebacks: Infinity,
    // "When a move gives away 2 pawns' worth of advantage or more, or allows mate"
    blunderWarning: { minLossCp: 200, allowsMate: true },
  },
  // Practice night (Joseph, Sep 2026): you see how each move rated and the
  // analysis bar, and get three takebacks, but nothing that tells you what to
  // play. No hints, no best line, and no "are you sure?" warning before a
  // move (that was really just free extra takebacks).
  guided: {
    id: 'guided',
    label: 'Practice',
    summary: 'move feedback',
    evalBar: true,
    bestLine: false,
    hints: false,
    takebacks: 3,
    blunderWarning: null,
  },
  real: {
    id: 'real',
    label: 'Real',
    summary: 'no help',
    evalBar: false,
    bestLine: false,
    hints: false,
    takebacks: 0,
    blunderWarning: null,
  },
}

export const HELP_STAGE_ORDER: HelpStageId[] = ['assisted', 'guided', 'real']
