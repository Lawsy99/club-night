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
  /** Hints per game (the coach's nudges in words). */
  hints: number
  /** Takebacks allowed per game (Infinity = unlimited). */
  takebacks: number
  blunderWarning: BlunderWarningRule | null
}

export const HELP_STAGES: Record<HelpStageId, HelpStage> = {
  assisted: {
    id: 'assisted',
    // The coached game (Joseph, Sep 2026): the analysis bar; three takebacks,
    // which also pay for taking back a move Pemberton queries; three hints,
    // in his words; no best-line button. He comments on your mistakes.
    label: 'Coached',
    summary: 'with Pemberton',
    evalBar: true,
    bestLine: false,
    hints: 3,
    takebacks: 3,
    // "When a move gives away 2 pawns' worth of advantage or more, or allows
    // mate". He only steps in some of the time (see COACH_STEPS_IN).
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
    hints: 0,
    takebacks: 3,
    blunderWarning: null,
  },
  real: {
    id: 'real',
    label: 'Real',
    summary: 'no help',
    evalBar: false,
    bestLine: false,
    hints: 0,
    takebacks: 0,
    blunderWarning: null,
  },
}

/**
 * How often Pemberton queries a bad move before it's played. Not every time:
 * he lets you make some mistakes, and talks about them afterwards.
 */
export const COACH_STEPS_IN = 0.6

export const HELP_STAGE_ORDER: HelpStageId[] = ['assisted', 'guided', 'real']
