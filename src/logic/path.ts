// The path: the player's progress through Act 1, and the one thing that comes
// next (design document, "The path", "How friendlies move you forward",
// "Stakes"). Pure state + functions; the Home screen asks `nextStep` and the
// game flow reports results back.
import { ACT_1, storyWeeksBefore, TRIAL_FINALE, TRIAL_OPPONENTS } from '../data/act1'
import { characterRating, findCharacter, PRACTICE_REGULARS, storyOffset } from '../data/characters'
import { MEMBERS } from '../data/members'
import { sessionLabel } from '../data/clubWeek'
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
  /** This week's coached game against Pemberton (Tuesday, after the lesson) is done. */
  coachingDone?: boolean
  /** This week's Saturday match: best of three (Joseph, Sep 2026). */
  series?: { wins: number; losses: number }
  /** Which version of the fixed characters' offsets fixedRatings came from. */
  fixedVersion?: number
  /** The starting rating set after trial night (the fixed characters are measured from it). */
  trialStart?: number
}

/**
 * Fixed ratings are set once after trial night. When their offsets change
 * (as in Sep 2026, bringing Marjorie and Clive closer), older saves are
 * brought up to date once, from the same starting point.
 */
export const FIXED_VERSION = 2

export function upgradeProgress(p: Progress): Progress {
  if (!p.rating || (p.fixedVersion ?? 1) >= FIXED_VERSION) return p
  const start = p.trialStart ?? p.baseline
  const fixedRatings = { ...p.fixedRatings }
  for (const id of ['marjorie', 'clive', 'graham']) {
    const c = findCharacter(id)
    if (c) fixedRatings[id] = characterRating(c, start)
  }
  return { ...p, fixedRatings, fixedVersion: FIXED_VERSION }
}

/** Saturday's match is best of three: first to two. */
export const SERIES_TO_WIN = 2

export type RatingPoint = { at: number; rating: number }

/** Plenty for a graph; older points are dropped. */
const MAX_HISTORY = 300

function withHistory(p: Progress, rating: PlayerRating | null, at = Date.now()): RatingPoint[] | undefined {
  if (!rating) return p.ratingHistory
  return [...(p.ratingHistory ?? []), { at, rating: Math.round(rating.rating) }].slice(-MAX_HISTORY)
}

/**
 * Should coaching night start with warm-ups? Whenever any of the player's
 * past errors are waiting to be put right: part of the week, not optional.
 */
export function wantsWarmup(p: Progress, next: NextStep, waiting: number): boolean {
  return next.kind === 'lesson' && waiting > 0 && p.warmupDone !== next.chapterId
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

/**
 * 'exhibition': trial night's last game, against Toby at full strength (unrated).
 * 'coaching': Tuesday's game against Pemberton, at the player's level, full help (unrated).
 */
export type StepKind = 'trial' | 'exhibition' | 'coaching' | 'friendly' | 'match' | 'cup-round' | 'boss'

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
  // The story's distance depends on how many story weeks have passed, not weeks in total.
  return rounded(you + storyOffset(character, storyWeeksBefore(p.chapter)))
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
        location: sessionLabel('coaching'),
      }
    }
    // Tuesday, after the lesson: a game against Pemberton, who plays at your
    // level, with every kind of help (Joseph, Sep 2026: what a good coach does).
    if (!p.coachingDone) {
      return {
        kind: 'play',
        game: {
          kind: 'coaching',
          opponent: 'pemberton',
          rating: rounded(p.rating ? p.rating.rating : p.baseline),
          stage: 'assisted',
          label: 'A game with Coach Pemberton',
          location: sessionLabel('coaching'),
          chapter: ch.id,
        },
        optionalFriendly: null,
        note: 'He plays at your level. Full help: hints, takebacks, the best line.',
      }
    }
    const rating = opponentRating(p, ch.opponent)
    // Thursday, practice night: the week's person first, then whoever else is
    // in, one stronger and one weaker, as at a real club. Move feedback, the
    // analysis bar and three takebacks, but no advice on what to play.
    const friendly = (k: number): PathGame => {
      const opponent = practiceOpponent(p, k)
      return {
        kind: 'friendly',
        opponent,
        rating: opponentRating(p, opponent),
        stage: 'guided',
        label: k < PRACTICE_GAMES ? `Practice game ${k + 1} of ${PRACTICE_GAMES} vs ${nameOf(opponent)}` : `Practice game vs ${nameOf(opponent)}`,
        location: sessionLabel('practice'),
        chapter: ch.id,
      }
    }
    const unlocked = matchUnlocked(p)
    if (!unlocked) {
      return { kind: 'play', game: friendly(p.friendlies.played), optionalFriendly: null, note: null }
    }
    // Saturday: best of three against the week's person.
    const series = p.series ?? { wins: 0, losses: 0 }
    const gameNo = series.wins + series.losses + 1
    const score = gameNo === 1 ? '' : ` · ${series.wins}–${series.losses}`
    const match: PathGame = {
      kind: 'match',
      opponent: ch.opponent,
      rating,
      stage: 'real',
      label: `${ch.matchLabel}, game ${gameNo}${score}`,
      location: sessionLabel('match'),
      chapter: ch.id,
    }
    return {
      kind: 'play',
      game: match,
      // One more practice game first, if wanted (against someone else who's in).
      optionalFriendly: gameNo === 1 ? friendly(Math.max(PRACTICE_GAMES, p.friendlies.played)) : null,
      note: p.matchLost
        ? 'Best of three again. Warm up with a practice game first, if you like.'
        : gameNo === 1
          ? `Best of three against ${nameOf(ch.opponent)}.`
          : null,
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

/**
 * Has this week's match (Saturday) opened? After winning a guided practice
 * game, or three practice games, or straight away against someone already met.
 */
export function matchUnlocked(p: Progress): boolean {
  const ch = ACT_1.chapters[p.chapter]
  if (!ch) return false
  return p.friendlies.played >= PRACTICE_GAMES
}

/** Practice night is three games (Joseph, Sep 2026). */
export const PRACTICE_GAMES = 3

/**
 * Who you play in practice game k this week: the week's person first; after
 * that, whoever else is in: regulars you've already met, and the background
 * members who come on Thursdays (Sheila, Bill). Picked in a fixed order, so
 * reopening the app never changes who's next.
 */
export function practiceOpponent(p: Progress, k: number): string {
  const ch = ACT_1.chapters[p.chapter]
  if (!ch) return 'marjorie'
  if (k === 0) return ch.opponent
  // Every now and then, your rival turns up (not in his own week).
  if (k === 1 && p.chapter % 4 === 2 && ch.opponent !== 'toby') return 'toby'
  // Terry is in most Thursdays; you're guaranteed a game with him every
  // third week (starting in week 2), and he's in the mix otherwise.
  if (k === 2 && p.chapter % 3 === 1) return 'terry'
  const you = p.rating ? p.rating.rating : p.baseline
  const pool = [...new Set([...p.met, ...PRACTICE_REGULARS.map((c) => c.id)])].filter(
    (id) => id !== ch.opponent && id !== 'toby',
  )
  // One stronger than you, one weaker, as at a real club (if there are any).
  const stronger = pool.filter((id) => opponentRating(p, id) > you)
  const weaker = pool.filter((id) => opponentRating(p, id) <= you)
  const from = k === 1 ? (stronger.length ? stronger : pool) : weaker.length ? weaker : pool
  // A different starting point each week, then the next along.
  return from[(p.chapter * 5 + k) % from.length]
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
/**
 * What a draw means (Joseph, Sep 2026):
 * - practice and the coached game: it counts as played, and the week moves on;
 * - the best of three: it doesn't count either way (the series score stands);
 * - knockout games (trial night, the cup, the final): replayed, someone has to win.
 * Toby's trial-night game just ends the night.
 */
export type DrawRule = 'counts' | 'void' | 'replay' | 'ends'

export function drawRule(kind: PathGame['kind']): DrawRule {
  if (kind === 'friendly' || kind === 'coaching') return 'counts'
  if (kind === 'match') return 'void'
  if (kind === 'exhibition') return 'ends'
  return 'replay'
}

export function recordGame(p: Progress, game: PathGame, won: boolean, accuracyStrength: number | null): Progress {
  if (game.kind === 'trial') return recordTrialGame(p, game, won, accuracyStrength)
  // Toby's trial-night game: whatever happened, the night is over. No rating change.
  if (game.kind === 'exhibition') {
    if (p.stage !== 'trial' || !p.trial) return p
    // (Saved by an older version mid-trial: four games but no rating yet.)
    const placed = p.rating ? p : settleTrial(p, p.trial.games)
    return { ...placed, stage: 'act' }
  }

  // The coached game: a lesson, never rated. Win or lose, Tuesday is done.
  if (game.kind === 'coaching') return { ...p, coachingDone: true }

  if (game.kind === 'friendly') {
    // Friendlies never change the rating; every practice game this week counts.
    const ch = ACT_1.chapters[p.chapter]
    const inChapter = !!ch && (game.chapter ? game.chapter === ch.id : game.opponent === ch.opponent)
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
    // Best of three: each game is rated; first to two takes the week.
    const before = next.series ?? { wins: 0, losses: 0 }
    const series = { wins: before.wins + (won ? 1 : 0), losses: before.losses + (won ? 0 : 1) }
    if (series.wins >= SERIES_TO_WIN) {
      const met = next.met.includes(game.opponent) ? next.met : [...next.met, game.opponent]
      next = {
        ...next,
        met,
        chapter: next.chapter + 1,
        lessonDone: false,
        coachingDone: false,
        friendlies: { played: 0, wonGuided: false },
        matchLost: false,
        series: { wins: 0, losses: 0 },
      }
      if (next.chapter >= ACT_1.chapters.length) next = startCup(next)
    } else if (series.losses >= SERIES_TO_WIN) {
      // Lost the series: it's played again from 0–0.
      next = { ...next, matchLost: true, series: { wins: 0, losses: 0 } }
    } else {
      next = { ...next, series }
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
    fixedVersion: FIXED_VERSION,
    trialStart: baseline,
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
