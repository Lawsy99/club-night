// The path: the player's progress through Act 1, and the one thing that comes
// next (design document, "The path", "How friendlies move you forward",
// "Stakes"). Pure state + functions; the Home screen asks `nextStep` and the
// game flow reports results back.
import { ACT_1, TRIAL_FINALE, TRIAL_OPPONENTS } from '../data/act1'
import { characterRating, findCharacter, storyOffset } from '../data/characters'
import { MEMBERS } from '../data/members'
import { findLesson } from '../data/lessons'
import { rateGame, type PlayerRating } from './glicko2'
import { valveAdjustment, type RealGameResult } from './safetyValve'
import {
  firstOpponentRating,
  FULL_STRENGTH_RATING,
  nextTrialOpponentRating,
  TRIAL_LENGTH,
  trialEstimate,
  type Experience,
  type TrialGame,
} from './trialNight'

export type Progress = {
  version: 1
  stage: 'welcome' | 'trial' | 'act' | 'act-complete'
  trial: { first: number; games: TrialGame[] } | null
  rating: PlayerRating | null
  /** The act's baseline: scaling opponents are measured from it. */
  baseline: number
  /** Fixed characters' ratings, set once from the Act 1 baseline. */
  fixedRatings: Record<string, number>
  /** Index into the act's chapters; equal to their count once the cup begins. */
  chapter: number
  lessonDone: boolean
  /** Friendlies against the current chapter's opponent. */
  friendlies: { played: number; wonGuided: boolean }
  /** Characters whose chapter the player has finished: met, so their friendlies become optional later. */
  met: string[]
  /** Match lost at least once in this chapter (a guided friendly is then offered). */
  matchLost: boolean
  cup: { round: number; bossRating: number; bossAttempts: number } | null
  /** Real games since the safety valve last moved (or the act began). */
  recentReal: RealGameResult[]
  /** The player's name, as given to Graham on trial night (older saves may lack it). */
  playerName?: string
  /** The chapter whose mistakes-deck warm-up has been done (or skipped). */
  warmupDone?: string
  /** The rating after each change, oldest first, for the stats graph (older saves start empty). */
  ratingHistory?: RatingPoint[]
  /** Milestones reached (ids from logic/milestones.ts), each shown once. */
  milestones?: string[]
  /** Something for the next opponent to notice ("rating"), said once at the start of the next game. */
  notice?: string | null
}

export type RatingPoint = { at: number; rating: number }

/** Plenty for a graph; older points are dropped. */
const MAX_HISTORY = 300

function withHistory(p: Progress, rating: PlayerRating | null, at = Date.now()): RatingPoint[] | undefined {
  if (!rating) return p.ratingHistory
  return [...(p.ratingHistory ?? []), { at, rating: Math.round(rating.rating) }].slice(-MAX_HISTORY)
}

/** A chapter opens with a warm-up when at least this many deck cards are due. */
export const WARMUP_MIN_DUE = 3

/** Should this chapter start with a warm-up from the mistakes deck? */
export function wantsWarmup(p: Progress, next: NextStep, dueCount: number): boolean {
  return next.kind === 'lesson' && dueCount >= WARMUP_MIN_DUE && p.warmupDone !== next.chapterId
}

export const NEW_PROGRESS: Progress = {
  version: 1,
  stage: 'welcome',
  trial: null,
  rating: null,
  baseline: 1000,
  fixedRatings: {},
  chapter: 0,
  lessonDone: false,
  friendlies: { played: 0, wonGuided: false },
  met: [],
  matchLost: false,
  cup: null,
  recentReal: [],
}

/** 'exhibition': trial night's last game, against Toby at full strength (unrated). */
export type StepKind = 'trial' | 'exhibition' | 'friendly' | 'match' | 'cup-round' | 'boss'

/** What a game counts as on the path. Stored with the game. */
export type PathGame = {
  kind: StepKind
  opponent: string
  rating: number
  stage: 'assisted' | 'guided' | 'real'
  label: string
  location: string
  /** The chapter this game belongs to (for its story lines), if any. */
  chapter?: string
}

export type NextStep =
  | { kind: 'welcome' }
  | { kind: 'lesson'; chapterId: string; chapterTitle: string; topic: string; location: string }
  | {
      kind: 'play'
      game: PathGame
      optionalFriendly: PathGame | null
      note: string | null
      /** After a third boss loss: puzzles from the boss's openings. */
      targetedPuzzles?: { title: string; openings: string[] } | null
    }
  | { kind: 'act-complete' }


/**
 * An opponent's strength right now, which is also their rating on the club
 * ladder. Fixed characters keep the number set after trial night, so the
 * player climbs past them. Scaling ones sit a set distance from the player's
 * current rating, chosen by the story for each chapter (Joseph, Sep 2026:
 * a fixed path, e.g. Toby always ahead, however fast the player improves).
 */
export function opponentRating(p: Progress, id: string): number {
  if (p.fixedRatings[id] !== undefined) return p.fixedRatings[id]
  // A background member on a save from before they existed: from today's baseline.
  const member = MEMBERS.find((m) => m.id === id)
  if (member) return rounded(p.baseline + member.offset)
  const character = findCharacter(id)
  if (!character) return p.baseline
  const you = p.rating ? p.rating.rating : p.baseline
  return rounded(you + storyOffset(character, p.chapter))
}

const nameOf = (id: string) => findCharacter(id)?.name ?? id
const rounded = (r: number) => Math.max(200, Math.round(r / 5) * 5)

export function nextStep(p: Progress): NextStep {
  if (p.stage === 'welcome') return { kind: 'welcome' }
  if (p.stage === 'act-complete') return { kind: 'act-complete' }

  if (p.stage === 'trial' && p.trial) {
    const n = p.trial.games.length
    if (n >= TRIAL_LENGTH) {
      return {
        kind: 'play',
        game: {
          kind: 'exhibition',
          opponent: TRIAL_FINALE.opponent,
          rating: FULL_STRENGTH_RATING,
          stage: 'real',
          label: TRIAL_FINALE.label,
          location: 'The Red Lion',
        },
        optionalFriendly: null,
        note: "Just for fun: it doesn't count towards your rating.",
      }
    }
    const opponent = TRIAL_OPPONENTS[n]
    return {
      kind: 'play',
      game: {
        kind: 'trial',
        opponent,
        rating: nextTrialOpponentRating(p.trial.games, p.trial.first),
        stage: 'real',
        label: `Trial night · game ${n + 1} of ${TRIAL_LENGTH} vs ${nameOf(opponent)}`,
        location: 'The Red Lion',
      },
      optionalFriendly: null,
      note: null,
    }
  }

  const chapters = ACT_1.chapters
  if (p.chapter < chapters.length) {
    const ch = chapters[p.chapter]
    if (!p.lessonDone) {
      return {
        kind: 'lesson',
        chapterId: ch.id,
        chapterTitle: ch.title,
        topic: findLesson(ch.id)?.title ?? ch.title,
        location: ch.location,
      }
    }
    const rating = opponentRating(p, ch.opponent)
    const friendly = (stage: 'assisted' | 'guided'): PathGame => ({
      kind: 'friendly',
      opponent: ch.opponent,
      rating,
      stage,
      label: `Friendly vs ${nameOf(ch.opponent)}`,
      location: ch.location,
      chapter: ch.id,
    })
    const match: PathGame = {
      kind: 'match',
      opponent: ch.opponent,
      rating,
      stage: 'real',
      label: ch.matchLabel,
      location: ch.location,
      chapter: ch.id,
    }
    const met = p.met.includes(ch.opponent)
    const unlocked = met || p.friendlies.wonGuided || p.friendlies.played >= 3
    if (!unlocked) {
      // First friendly against someone new is assisted; after that, guided.
      return { kind: 'play', game: friendly(p.friendlies.played === 0 ? 'assisted' : 'guided'), optionalFriendly: null, note: null }
    }
    return {
      kind: 'play',
      game: match,
      optionalFriendly: friendly('guided'),
      note: p.matchLost ? 'Replay the match, or warm up with a friendly first.' : null,
    }
  }

  // The knockout cup: three rounds, then the final (the boss).
  const cup = p.cup ?? startCup(p).cup!
  const g = ACT_1.gauntlet
  if (cup.round < g.rounds.length) {
    const round = g.rounds[cup.round]
    return {
      kind: 'play',
      game: {
        kind: 'cup-round',
        opponent: round.opponent,
        // At their club rating, as on the ladder (the draw is ordered so it gets harder).
        rating: opponentRating(p, round.opponent),
        stage: 'real',
        label: round.label,
        location: g.location,
      },
      optionalFriendly: null,
      note: cup.bossAttempts > 0 ? `Qualifying again for the final (attempt ${cup.bossAttempts + 1}).` : null,
    }
  }
  // The boss stays ahead of the player however they've improved, and never
  // gets easier after a loss (design: "Boss strengths ... never drop").
  const bossRating = Math.max(cup.bossRating, opponentRating(p, g.boss.opponent))
  const boss: PathGame = { kind: 'boss', opponent: g.boss.opponent, rating: bossRating, stage: 'real', label: g.boss.label, location: g.location }
  // Support grows after boss losses; the boss never gets easier (design: "Support after boss losses").
  const studyFriendly: PathGame | null =
    cup.bossAttempts >= 2 ? { ...boss, kind: 'friendly', stage: 'assisted', label: `Assisted friendly vs ${nameOf(g.boss.opponent)}` } : null
  const targetedPuzzles =
    cup.bossAttempts >= 3 ? { title: `Puzzles from ${nameOf(g.boss.opponent)}'s openings`, openings: BOSS_OPENINGS[g.boss.opponent] ?? [] } : null
  return { kind: 'play', game: boss, optionalFriendly: studyFriendly, note: bossNote(cup.bossAttempts), targetedPuzzles }
}

/** The opening families each boss plays (for the targeted puzzle set). */
const BOSS_OPENINGS: Record<string, string[]> = { toby: ['najdorf', 'catalan', 'nimzo'] }

function bossNote(attempts: number): string | null {
  if (attempts === 0) return null
  if (attempts === 1) return 'Scouting report (placeholder): he plays the Najdorf against 1.e4. Watch the phase where you lost last time.'
  if (attempts === 2) return 'You can study him first in an assisted friendly.'
  return 'A targeted puzzle set on his openings is ready, and the study friendly is still available.'
}

/** The boss plays at their club rating when the cup starts, then stays fixed (never drops after a loss). */
function startCup(p: Progress): Progress {
  const boss = ACT_1.gauntlet.boss.opponent
  return { ...p, cup: p.cup ?? { round: 0, bossRating: rounded(opponentRating(p, boss)), bossAttempts: 0 } }
}

// --- Events -----------------------------------------------------------------

export function beginTrial(p: Progress, experience: Experience, statedRating?: number, playerName?: string): Progress {
  return {
    ...p,
    stage: 'trial',
    trial: { first: firstOpponentRating(experience, statedRating), games: [] },
    playerName: playerName ?? p.playerName,
  }
}

export function completeLesson(p: Progress): Progress {
  return { ...p, lessonDone: true }
}

/**
 * Records a finished game (draws are replayed, so only wins and losses come
 * here). `accuracyStrength` is the strength the moves suggested, if analysed.
 */
export function recordGame(p: Progress, game: PathGame, won: boolean, accuracyStrength: number | null): Progress {
  if (game.kind === 'trial') return recordTrialGame(p, game, won, accuracyStrength)
  // Toby's trial-night game: whatever happened, the night is over. No rating change.
  if (game.kind === 'exhibition') {
    if (p.stage !== 'trial' || !p.trial) return p
    // (Saved by an older version mid-trial: four games but no rating yet.)
    const placed = p.rating ? p : settleTrial(p, p.trial.games)
    return { ...placed, stage: 'act' }
  }

  if (game.kind === 'friendly') {
    // Friendlies never change the rating; they always count towards progress.
    const inChapter = p.chapter < ACT_1.chapters.length && game.opponent === ACT_1.chapters[p.chapter].opponent
    return {
      ...p,
      friendlies: inChapter
        ? { played: p.friendlies.played + 1, wonGuided: p.friendlies.wonGuided || (won && game.stage === 'guided') }
        : p.friendlies,
    }
  }

  // Real games: rating, then the safety valve (never during the cup).
  let next = rateReal(p, game.rating, won, accuracyStrength)
  if (game.kind === 'match') {
    if (won) {
      const met = next.met.includes(game.opponent) ? next.met : [...next.met, game.opponent]
      next = { ...next, met, chapter: next.chapter + 1, lessonDone: false, friendlies: { played: 0, wonGuided: false }, matchLost: false }
      if (next.chapter >= ACT_1.chapters.length) next = startCup(next)
    } else {
      next = { ...next, matchLost: true }
    }
    return next
  }
  const cup = next.cup ?? startCup(next).cup!
  if (game.kind === 'cup-round') {
    return { ...next, cup: won ? { ...cup, round: cup.round + 1 } : cup }
  }
  // Boss: win the act, or back to qualifying (boss strength stays fixed).
  return won
    ? { ...next, stage: 'act-complete' }
    : { ...next, cup: { ...cup, round: 0, bossAttempts: cup.bossAttempts + 1, bossRating: Math.max(cup.bossRating, game.rating) } }
}

function recordTrialGame(p: Progress, game: PathGame, won: boolean, accuracyStrength: number | null): Progress {
  if (!p.trial) return p
  const games = [...p.trial.games, { opponentRating: game.rating, won, accuracyStrength }]
  if (games.length < TRIAL_LENGTH) return { ...p, trial: { ...p.trial, games } }
  return settleTrial(p, games)
}

/**
 * Placement done: starting rating, the Act 1 baseline, and the fixed
 * characters. The night isn't over yet: Toby's game comes next (stage stays 'trial').
 */
function settleTrial(p: Progress, games: TrialGame[]): Progress {
  if (!p.trial) return p
  const { start } = trialEstimate(games, p.trial.first)
  const baseline = Math.round(start.rating)
  const fixedRatings: Record<string, number> = {}
  for (const id of ['marjorie', 'clive', 'graham']) {
    const c = findCharacter(id)
    if (c) fixedRatings[id] = characterRating(c, baseline)
  }
  // Background members on the club ladder: set once, like the fixed characters.
  for (const m of MEMBERS) fixedRatings[m.id] = rounded(baseline + m.offset)
  return {
    ...p,
    trial: { ...p.trial, games },
    rating: start,
    baseline,
    fixedRatings,
    recentReal: [],
    ratingHistory: withHistory(p, start),
  }
}

function rateReal(p: Progress, opponentRatingValue: number, won: boolean, accuracyStrength: number | null): Progress {
  const rating = p.rating ? rateGame(p.rating, opponentRatingValue, won ? 1 : 0) : p.rating
  const ratingHistory = withHistory(p, rating)
  const recentReal = [...p.recentReal, { won, accuracyStrength }]
  const inCup = p.chapter >= ACT_1.chapters.length
  const shift = inCup ? 0 : valveAdjustment(recentReal, p.baseline)
  return shift
    ? { ...p, rating, ratingHistory, baseline: p.baseline + shift, recentReal: [] }
    : { ...p, rating, ratingHistory, recentReal: recentReal.slice(-10) }
}
