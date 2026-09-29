// The path: the player's progress through Act 1, and the one thing that comes
// next (design document, "The path", "How friendlies move you forward",
// "Stakes"). Pure state + functions; the Home screen asks `nextStep` and the
// game flow reports results back.
import { storyWeeksBefore, TRIAL_FINALE, TRIAL_OPPONENTS } from '../data/act1'
import { characterRating, findCharacter, LEAGUE_ONLY, PRACTICE_REGULARS, storyOffset } from '../data/characters'
import { MEMBERS } from '../data/members'
import { sessionLabel } from '../data/clubWeek'
import { findLesson } from '../data/lessons'
import { WEEK_STORY } from '../data/weekStory'
import { actNumber, actPlan, hasNextAct } from '../data/acts'
import { storyAfterFinal, storyAfterTrial, storyAfterWin } from './storyQueue'
import { rateGame, type PlayerRating } from './glicko2'
import type { MonthlyTest } from './monthlyTest'
import {
  firstOpponentRating,
  FULL_STRENGTH_RATING,
  nextTrialOpponentRating,
  START_DEVIATION,
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
  /** This week's Saturday match: first to two wins, however many losses (Joseph, Sep 2026). */
  series?: { wins: number; losses: number }
  /** Which version of the fixed characters' offsets fixedRatings came from. */
  fixedVersion?: number
  /** The starting rating set after trial night (the fixed characters are measured from it). */
  trialStart?: number
  /** Story moments waiting to play, in order ("wayout:c1", "scene:month-1"). */
  pendingStory?: string[]
  /** Story moments already played (the calendar can play them again). */
  storySeen?: string[]
  /** Pemberton's traps already used in coached games, so they don't repeat too soon. */
  scenariosUsed?: string[]
  /** Which act (season) the player is in; older saves are in Act 1. */
  act?: number
  /** Pemberton's monthly tests, oldest first (logic/monthlyTest.ts). */
  monthlyTests?: MonthlyTest[]
  /** Scouting demos and style lines already seen ("marjorie:w:0", "dex:style:1"), so none repeats. */
  scoutingSeen?: string[]
  /** (Older saves: best-of-threes lost in a week. No longer used; losses stay in `series`.) */
  seriesLost?: number
}

/**
 * Fixed ratings are set once after trial night. When their offsets change
 * (as in Sep 2026, bringing Marjorie and Clive closer), older saves are
 * brought up to date once, from the same starting point.
 */
export const FIXED_VERSION = 2

export function upgradeProgress(saved: Progress): Progress {
  // Saves from before Sep 2026 started with a jumpier rating: settle it.
  const p =
    saved.rating && saved.rating.deviation > START_DEVIATION
      ? { ...saved, rating: { ...saved.rating, deviation: START_DEVIATION } }
      : saved
  if (!p.rating || (p.fixedVersion ?? 1) >= FIXED_VERSION) return p
  const start = p.trialStart ?? p.baseline
  const fixedRatings = { ...p.fixedRatings }
  for (const id of ['marjorie', 'clive', 'graham']) {
    const c = findCharacter(id)
    if (c) fixedRatings[id] = characterRating(c, start)
  }
  return { ...p, fixedRatings, fixedVersion: FIXED_VERSION }
}

/** The next story moment has been played: off the queue, into the seen list. */
export function storyPlayed(p: Progress, id: string): Progress {
  return {
    ...p,
    pendingStory: (p.pendingStory ?? []).filter((s) => s !== id),
    storySeen: [...(p.storySeen ?? []).filter((s) => s !== id), id],
  }
}

/**
 * This week's "Around the club" line on Home (Joseph, Sep 2026): Tuesday's
 * once the coached game is done, Thursday's once practice night is.
 */
export function weekBeat(p: Progress): { day: 'Tuesday' | 'Thursday'; text: string } | null {
  if (p.stage !== 'act') return null
  const ch = actPlan(p).chapters[p.chapter]
  const story = ch ? WEEK_STORY[ch.id] : undefined
  if (!story) return null
  if (p.friendlies.played >= PRACTICE_GAMES) return { day: 'Thursday', text: story.thursday }
  if (p.coachingDone) return { day: 'Tuesday', text: story.tuesday }
  return null
}

/**
 * Saturday's match is first to two wins, with no limit on losses (Joseph,
 * Sep 2026: a mistake should be a chance to learn, not a reason to start the
 * week's match again). Every game is still rated, so losses still cost.
 */
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
  /** An extra game chosen from Home (e.g. another coached game), not the week's own. */
  extra?: boolean
  /**
   * A Saturday match played with Pemberton's help (three takebacks and the
   * live evaluation), offered after HELP_AFTER_LOSSES Saturday losses in a week
   * (Joseph, Sep 2026: so nobody gets stuck). Counts for the week, not the rating.
   */
  helped?: boolean
}

/** Games you have to win to move on: these are the ones that change your rating. */
export const MUST_WIN: StepKind[] = ['match', 'cup-round', 'boss']

/**
 * With the "Full help" setting on, Pemberton asks before every must-win game
 * whether you want his help (Joseph, Sep 2026). Taken, the game moves the
 * story on but doesn't count for the rating; on your own, it does.
 */
export function withHelpChoice(step: NextStep, fullHelp: boolean): NextStep {
  if (!fullHelp || step.kind !== 'play' || step.helpOffer || !MUST_WIN.includes(step.game.kind) || step.game.helped) return step
  return {
    ...step,
    helpOffer: { ...step.game, stage: 'assisted', helped: true },
    note: HELP_CHOICE_NOTE,
  }
}

/** Pemberton, before a must-win game with Full help on. */
export const HELP_CHOICE_NOTE =
  'I can sit in on this one, as usual. Or you play it on your own, and it counts on the ladder. Up to you.'

/** Saturday games lost in a week before Pemberton offers his help. */
export const HELP_AFTER_LOSSES = 3

export type NextStep =
  | { kind: 'welcome' }
  | { kind: 'lesson'; chapterId: string; chapterTitle: string; topic: string; location: string }
  | {
      kind: 'play'
      game: PathGame
      optionalFriendly: PathGame | null
      /**
       * Before a match: another game with Pemberton, as many as you like
       * (Joseph, Sep 2026: the coached game is one of the best parts).
       */
      extraCoaching?: PathGame | null
      note: string | null
      /** The same Saturday game with Pemberton's help, to take or leave (see PathGame.helped). */
      helpOffer?: PathGame | null
      /** After a third boss loss: puzzles from the boss's openings. */
      targetedPuzzles?: { title: string; openings: string[] } | null
    }
  /** The act is won. `nextAct`: another season is ready to start. */
  | { kind: 'act-complete'; nextAct: boolean }

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
  // Later acts set each scaling character's distance week by week.
  const actOffsets = actPlan(p).offsets?.[id]
  if (actOffsets && character.strength === 'scaling') {
    return rounded(you + actOffsets[Math.min(p.chapter, actOffsets.length - 1)])
  }
  // Act 1: the story's distance depends on how many story weeks have passed, not weeks in total.
  return rounded(you + storyOffset(character, actNumber(p) === 1 ? storyWeeksBefore(p.chapter) : 99))
}

/**
 * Early Saturdays are gentler (Joseph, Sep 2026: nobody should get stuck in
 * the first few weeks and stop seeing the story). In Act 1's first seven
 * weeks the week's person is at least this far below you: about four
 * best-of-threes in five won at −150, easing off by week 7. The rest of the
 * week stays hard: the stronger practice game, Toby turning up, and
 * Pemberton at your level.
 */
export const EARLY_MATCH_CAP = [-150, -150, -125, -125, -100, -100, -60]
/**
 * Every game you must win to move on (Saturday, the cup, the ladder, the
 * final) is played close to your level, a little above or below, and moves
 * with your rating week by week (Joseph, Sep 2026: never a far stronger
 * opponent standing in the way; fixed strengths are for practice night only).
 * What mixes it up is the style, not the number.
 */
export const MATCH_BELOW = -50
export const MATCH_ABOVE = 60

/** `rating` kept between you + lo and you + hi. */
function nearYou(p: Progress, rating: number, lo: number, hi: number): number {
  const you = p.rating ? p.rating.rating : p.baseline
  return Math.min(rounded(you + hi), Math.max(rounded(you + lo), rating))
}

/**
 * The week's person's strength, on Thursday and Saturday alike (one number
 * all week): their usual distance from you, eased early on (never more than
 * 50 further below than the cap either), then within the match band.
 */
export function weekOpponentRating(p: Progress, id: string): number {
  const base = opponentRating(p, id)
  const cap = actNumber(p) === 1 ? EARLY_MATCH_CAP[p.chapter] : undefined
  if (cap !== undefined) return nearYou(p, base, cap + MATCH_BELOW, cap)
  return nearYou(p, base, MATCH_BELOW, MATCH_ABOVE)
}

/**
 * A knockout round: in the band, and a little harder each round (the first at
 * least 50 below you, then 25 below, then level), so the draw still builds.
 */
export function roundRating(p: Progress, id: string, round: number): number {
  return nearYou(p, opponentRating(p, id), MATCH_BELOW + 25 * round, MATCH_ABOVE)
}

/** The final: at your level or a little above, following your rating. */
export function finalRating(p: Progress, id: string): number {
  return nearYou(p, opponentRating(p, id), 0, MATCH_ABOVE)
}

/**
 * The strength someone plays at against you right now, which is also their
 * number on the club ladder (Joseph, Sep 2026: one number everywhere; the
 * ladder shifting a little week to week is natural). The week's person and
 * the cup opponents are brought near your level; everyone else is as usual.
 */
export function clubRating(p: Progress, id: string): number {
  if (p.stage !== 'act') return opponentRating(p, id)
  const plan = actPlan(p)
  const ch = plan.chapters[p.chapter]
  if (ch) return id === ch.opponent ? weekOpponentRating(p, id) : opponentRating(p, id)
  const round = p.cup?.round ?? 0
  if (round < plan.gauntlet.rounds.length && plan.gauntlet.rounds[round].opponent === id) return roundRating(p, id, round)
  if (round >= plan.gauntlet.rounds.length && plan.gauntlet.boss.opponent === id) return finalRating(p, id)
  return opponentRating(p, id)
}

const nameOf = (id: string) => findCharacter(id)?.name ?? id
const rounded = (r: number) => Math.max(200, Math.round(r / 5) * 5)

export function nextStep(p: Progress): NextStep {
  if (p.stage === 'welcome') return { kind: 'welcome' }
  if (p.stage === 'act-complete') return { kind: 'act-complete', nextAct: hasNextAct(p) }

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

  const chapters = actPlan(p).chapters
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
    const coaching: PathGame = {
      kind: 'coaching',
      opponent: 'pemberton',
      rating: rounded(p.rating ? p.rating.rating : p.baseline),
      stage: 'assisted',
      label: 'A game with Coach Pemberton',
      location: sessionLabel('coaching'),
      chapter: ch.id,
    }
    if (!p.coachingDone) {
      return {
        kind: 'play',
        game: coaching,
        optionalFriendly: null,
        note: 'He plays at your level, and tells you what he thinks.',
      }
    }
    const rating = weekOpponentRating(p, ch.opponent)
    // Thursday, practice night: the week's person first, then whoever else is
    // in, one stronger and one weaker, as at a real club. Move feedback, the
    // analysis bar and three takebacks, but no advice on what to play.
    const friendly = (k: number): PathGame => {
      const opponent = practiceOpponent(p, k)
      return {
        kind: 'friendly',
        opponent,
        rating: clubRating(p, opponent),
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
    // Saturday: first to two wins against the week's person, however long it takes.
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
    // Three Saturday losses this week: Pemberton offers to sit in, to take
    // or leave, game by game (Joseph, Sep 2026: so nobody gets stuck on Saturday).
    const stuck = series.losses >= HELP_AFTER_LOSSES
    const toGo = SERIES_TO_WIN - series.wins
    return {
      kind: 'play',
      game: match,
      // One more practice game first, if wanted (against someone else who's in).
      optionalFriendly: gameNo === 1 ? friendly(Math.max(PRACTICE_GAMES, p.friendlies.played)) : null,
      extraCoaching: { ...coaching, label: 'Another game with Coach Pemberton', extra: true },
      helpOffer: stuck ? { ...match, stage: 'guided', helped: true } : null,
      note: stuck
        ? `${nameOf(ch.opponent)} has had ${series.losses === 3 ? 'three' : series.losses} off you this week. If you like, I’ll sit in on this one: three takebacks, and you can see how the position stands. It won’t count towards your rating. Your call.`
        : gameNo === 1
          ? `First to two wins against ${nameOf(ch.opponent)}. However many games it takes.`
          : series.losses > 0
            ? `${toGo === 1 ? 'One more win' : 'Two wins'} and the week’s yours. No limit on tries. Have a look at the last game first, if you haven’t.`
            : null,
    }
  }

  // The act's final week: the rounds (the cup; the last rungs of the ladder), then the final (the boss).
  const cup = p.cup ?? startCup(p).cup!
  const g = actPlan(p).gauntlet
  if (cup.round < g.rounds.length) {
    const round = g.rounds[cup.round]
    return {
      kind: 'play',
      game: {
        kind: 'cup-round',
        opponent: round.opponent,
        // Close to your level, a little harder each round (roundRating).
        rating: roundRating(p, round.opponent, cup.round),
        stage: 'real',
        label: round.label,
        location: g.location,
      },
      optionalFriendly: null,
      note: null,
    }
  }
  // The boss is level with you or a little ahead, and follows your rating
  // (Joseph, Sep 2026: every must-win game is close to your level). What
  // grows after a loss is the support, below.
  const bossRating = finalRating(p, g.boss.opponent)
  const boss: PathGame = { kind: 'boss', opponent: g.boss.opponent, rating: bossRating, stage: 'real', label: g.boss.label, location: g.location }
  // Support grows after boss losses (design: "Support after boss losses").
  const studyFriendly: PathGame | null =
    cup.bossAttempts >= 2 ? { ...boss, kind: 'friendly', stage: 'assisted', label: `Practice game vs ${nameOf(g.boss.opponent)}, with full help` } : null
  const targetedPuzzles =
    cup.bossAttempts >= 3 ? { title: `Puzzles from ${nameOf(g.boss.opponent)}'s openings`, openings: BOSS_OPENINGS[g.boss.opponent] ?? [] } : null
  return { kind: 'play', game: boss, optionalFriendly: studyFriendly, note: bossNote(cup.bossAttempts), targetedPuzzles }
}

/**
 * Has this week's match (Saturday) opened? After winning a guided practice
 * game, or three practice games, or straight away against someone already met.
 */
export function matchUnlocked(p: Progress): boolean {
  const ch = actPlan(p).chapters[p.chapter]
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
  const ch = actPlan(p).chapters[p.chapter]
  if (!ch) return 'marjorie'
  if (k === 0) return ch.opponent
  // Every now and then, your rival turns up (not in his own week).
  if (k === 1 && p.chapter % 4 === 2 && ch.opponent !== 'toby') return 'toby'
  // Terry is in most Thursdays; you're guaranteed a game with him every
  // third week (starting in week 2), and he's in the mix otherwise.
  if (k === 2 && p.chapter % 3 === 1) return 'terry'
  const you = p.rating ? p.rating.rating : p.baseline
  // (Malcolm only comes for the league and the ladder, never practice night.)
  const pool = [...new Set([...p.met, ...PRACTICE_REGULARS.map((c) => c.id)])].filter(
    (id) => id !== ch.opponent && id !== 'toby' && !LEAGUE_ONLY.some((c) => c.id === id),
  )
  // One stronger than you, one weaker, as at a real club (if there are any).
  const stronger = pool.filter((id) => clubRating(p, id) > you)
  const weaker = pool.filter((id) => clubRating(p, id) <= you)
  const from = k === 1 ? (stronger.length ? stronger : pool) : weaker.length ? weaker : pool
  // A different starting point each week, then the next along.
  return from[(p.chapter * 5 + k) % from.length]
}

/** The opening families each boss plays (for the targeted puzzle set). */
const BOSS_OPENINGS: Record<string, string[]> = { toby: ['najdorf', 'catalan', 'nimzo'] }

function bossNote(attempts: number): string | null {
  if (attempts === 0) return null
  if (attempts === 1) return 'He’ll go for the Najdorf again against e4. Look back at where it went wrong last time.'
  if (attempts === 2) return 'You can study him first: a practice game against him, with full help.'
  return 'Pemberton has put together puzzles from his openings. The practice game is still there too.'
}

/** The cup's starting state (the boss's strength itself comes from finalRating). */
function startCup(p: Progress): Progress {
  const boss = actPlan(p).gauntlet.boss.opponent
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
 * The next season (act): the week count carries on, the characters keep
 * their fixed ratings, and the story picks up where the last final left it.
 */
export function startNextAct(p: Progress): Progress {
  if (p.stage !== 'act-complete' || !hasNextAct(p)) return p
  return {
    ...p,
    act: actNumber(p) + 1,
    stage: 'act',
    chapter: 0,
    lessonDone: false,
    coachingDone: false,
    friendlies: { played: 0, wonGuided: false },
    matchLost: false,
    series: { wins: 0, losses: 0 },
    cup: null,
    warmupDone: undefined,
  }
}

/**
 * Records a finished game (draws are replayed, so only wins and losses come
 * here). `accuracyStrength` is the strength the moves suggested, if analysed.
 */
/**
 * What a draw means (Joseph, Sep 2026):
 * - practice and the coached game: it counts as played, and the week moves on;
 * - Saturday's match: it doesn't count either way (the score stands);
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
    return { ...placed, stage: 'act', pendingStory: [...(placed.pendingStory ?? []), ...storyAfterTrial()] }
  }

  // The coached game: a lesson, never rated. Win or lose, Tuesday is done.
  if (game.kind === 'coaching') return { ...p, coachingDone: true }

  if (game.kind === 'friendly') {
    // Friendlies never change the rating; every practice game this week counts.
    const ch = actPlan(p).chapters[p.chapter]
    const inChapter = !!ch && (game.chapter ? game.chapter === ch.id : game.opponent === ch.opponent)
    return {
      ...p,
      friendlies: inChapter
        ? { played: p.friendlies.played + 1, wonGuided: p.friendlies.wonGuided || (won && game.stage === 'guided') }
        : p.friendlies,
    }
  }

  // Real games change the rating; a match played with Pemberton's help doesn't.
  let next = game.helped ? p : rateReal(p, game.rating, won)
  if (game.kind === 'match') {
    // First to two wins takes the week; each game is rated. Losses just add a game.
    const before = next.series ?? { wins: 0, losses: 0 }
    const series = { wins: before.wins + (won ? 1 : 0), losses: before.losses + (won ? 0 : 1) }
    if (series.wins >= SERIES_TO_WIN) {
      const met = next.met.includes(game.opponent) ? next.met : [...next.met, game.opponent]
      const weekId = actPlan(p).chapters[p.chapter]?.id
      next = {
        ...next,
        met,
        // The week's closing moment (and the month's cutscene) play next.
        pendingStory: [...(next.pendingStory ?? []), ...(weekId ? storyAfterWin(weekId) : [])],
        chapter: next.chapter + 1,
        lessonDone: false,
        coachingDone: false,
        friendlies: { played: 0, wonGuided: false },
        matchLost: false,
        series: { wins: 0, losses: 0 },
        seriesLost: 0,
      }
      if (next.chapter >= actPlan(p).chapters.length) next = startCup(next)
    } else {
      next = { ...next, series, matchLost: next.matchLost || !won }
    }
    return next
  }
  const cup = next.cup ?? startCup(next).cup!
  if (game.kind === 'cup-round') {
    return { ...next, cup: won ? { ...cup, round: cup.round + 1 } : cup }
  }
  // Boss: win the act, or straight to a rematch (Joseph, Sep 2026: no replaying
  // the earlier rounds). His strength follows yours (finalRating); bossRating
  // is only kept as a record of the strongest version you've faced.
  return won
    ? { ...next, stage: 'act-complete', pendingStory: [...(next.pendingStory ?? []), ...storyAfterFinal(actNumber(p))] }
    : { ...next, cup: { ...cup, bossAttempts: cup.bossAttempts + 1, bossRating: Math.max(cup.bossRating, game.rating) } }
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
    ratingHistory: withHistory(p, start),
  }
}

/**
 * A rated game: the new rating, and a point on the graph. (The old "safety
 * valve", which nudged a baseline after lopsided runs, was removed in Sep
 * 2026: opponents are now either fixed or follow your rating, so it no
 * longer did anything useful.)
 */
function rateReal(p: Progress, opponentRatingValue: number, won: boolean): Progress {
  const rating = p.rating ? rateGame(p.rating, opponentRatingValue, won ? 1 : 0) : p.rating
  return { ...p, rating, ratingHistory: withHistory(p, rating) }
}
