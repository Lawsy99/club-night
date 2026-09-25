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
    label: 'Assisted',
    summary: 'help on',
    evalBar: true,
    bestLine: true,
    hints: true,
    takebacks: Infinity,
    // "When a move gives away 2 pawns' worth of advantage or more, or allows mate"
    blunderWarning: { minLossCp: 200, allowsMate: true },
  },
  guided: {
    id: 'guided',
    label: 'Guided',
    summary: 'light help',
    evalBar: false,
    bestLine: false,
    hints: false,
    takebacks: 3,
    // "Only when a move loses a piece or allows mate". A minor piece is worth
    // about 3 pawns; 2.5 allows for the small compensation you often get back.
    blunderWarning: { minLossCp: 250, allowsMate: true },
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
