// The app's flow: Welcome → trial night → the path, with Home always showing
// what comes next. Loads and saves progress and the current game, and turns
// finished games into results on the path.
import { useEffect, useState } from 'react'
import { characterOpponentId } from '../data/opponents'
import { rateGame } from '../logic/glicko2'
import {
  newGameRecord,
  nextPlayerColour,
  outcomeOf,
  upgradeGameRecord,
  type GameRecord,
} from '../logic/gameRecord'
import {
  beginTrial,
  completeLesson,
  NEW_PROGRESS,
  nextStep,
  recordGame,
  type PathGame,
  type Progress,
} from '../logic/path'
import { replay } from '../logic/game'
import { averageCentipawnLoss, ratingCounts, reviewMoves } from '../logic/review'
import { newMilestones, noticeFor, type Milestone } from '../logic/milestones'
import { inferRepertoire } from '../logic/repertoire'
import { clubLadder, ladderChanges, type LadderNews } from '../logic/ladder'
import { LadderScreen } from './LadderScreen'
import { CalendarScreen } from './CalendarScreen'
import { SCOUTING_DEMOS } from '../data/scoutingDemos'
import { ACT_1 } from '../data/act1'
import { CHARACTERS } from '../data/characters'
import { rivalTarget } from '../logic/rival'
import { scoutingReport } from '../logic/scouting'
import { strengthFromAccuracy } from '../logic/trialNight'
import {
  type ArchivedGame,
  archiveGame,
  getArchivedGame,
  headToHead,
  listArchivedGames,
  loadCurrentGame,
  loadProgress,
  loadScreen,
  requestPersistentStorage,
  resetProgress,
  saveCurrentGame,
  loadSettings,
  saveProgress,
  saveScreen,
  saveSettings,
} from '../storage/db'
import { DEFAULT_SETTINGS, type Settings } from '../logic/settings'
import { BoardThemeContext } from '../components/boardTheme'
import { setSoundEnabled } from '../components/moveSound'
import { GameScreen } from './GameScreen'
import { HomeScreen } from './HomeScreen'
import { LessonScreen } from './LessonScreen'
import { MistakesDeckScreen } from './MistakesDeckScreen'
import { PastGamesScreen } from './PastGamesScreen'
import { PuzzleSetScreen } from './PuzzleSetScreen'
import { ReviewScreen } from './ReviewScreen'
import { SettingsScreen } from './SettingsScreen'
import { StatsScreen } from './StatsScreen'
import { WelcomeScreen } from './WelcomeScreen'

const VIEWS = [
  'home',
  'game',
  'review',
  'deck',
  'warmup',
  'history',
  'lesson',
  'puzzles',
  'stats',
  'settings',
  'ladder',
  'calendar',
] as const
type View = (typeof VIEWS)[number]

/**
 * Games that change the rating one at a time: not friendlies (design: they
 * never change it), not trial night (it sets the rating in one go at the end),
 * and not Toby's trial-night game (it doesn't count).
 */
const isRated = (g: PathGame | undefined) =>
  !!g && g.kind !== 'friendly' && g.kind !== 'coaching' && g.kind !== 'trial' && g.kind !== 'exhibition'

/**
 * The settings live above everything else, so every board follows the
 * chosen style and every move follows the sound setting.
 */
export function AppFlow() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)

  useEffect(() => {
    loadSettings()
      .then(setSettings)
      .catch(() => undefined)
  }, [])

  useEffect(() => setSoundEnabled(settings.sound), [settings.sound])

  const changeSettings = (s: Settings) => {
    setSettings(s)
    saveSettings(s).catch((err) => console.error('Save failed', err))
  }

  return (
    <BoardThemeContext.Provider value={settings.board}>
      <Flow settings={settings} onChangeSettings={changeSettings} />
    </BoardThemeContext.Provider>
  )
}

function Flow({ settings, onChangeSettings }: { settings: Settings; onChangeSettings: (s: Settings) => void }) {
  const [loaded, setLoaded] = useState(false)
  const [progress, setProgress] = useState<Progress>(NEW_PROGRESS)
  // The current (or most recently finished) game
  const [game, setGame] = useState<GameRecord | null>(null)
  const [view, setView] = useState<View>('home')
  const [pastGame, setPastGame] = useState<ArchivedGame | null>(null)
  const [lastChange, setLastChange] = useState<{ from: number; to: number } | null>(null)
  const [milestoneBanner, setMilestoneBanner] = useState<Milestone[]>([])
  // Who the player passed on the club ladder (or who passed them) in the last game.
  const [ladderNews, setLadderNews] = useState<LadderNews[]>([])

  useEffect(() => {
    requestPersistentStorage()
    Promise.all([loadProgress(), loadCurrentGame(), loadScreen()])
      .then(([savedProgress, saved, screen]) => {
        if (savedProgress) setProgress(savedProgress)
        const upgraded = saved ? upgradeGameRecord(saved) : null
        const current = upgraded && isResumable(upgraded) ? upgraded : null
        setGame(current)
        const unfinished = current && !outcomeOf(current)
        const awaitingResult = current && outcomeOf(current) && current.path && !current.resultRecorded
        if (unfinished) setView('game')
        else if (awaitingResult) setView(screen === 'review' ? 'review' : 'game')
        else if (VIEWS.includes(screen as View) && screen !== 'game' && screen !== 'review') setView(screen as View)
        else setView('home')
      })
      .catch(() => setGame(null))
      .finally(() => setLoaded(true))
  }, [])

  // Save the game after every change; finished games also go into the archive.
  useEffect(() => {
    if (!game) return
    saveCurrentGame(game).catch((err) => console.error('Save failed', err))
    if (outcomeOf(game)) archiveGame(game).catch((err) => console.error('Archive failed', err))
  }, [game])

  useEffect(() => {
    if (loaded) saveScreen(view).catch((err) => console.error('Save failed', err))
  }, [view, loaded])

  if (!loaded) return <main className="game-screen loading">Setting up the board…</main>

  const updateProgress = (next: Progress) => {
    setProgress(next)
    saveProgress(next).catch((err) => console.error('Save failed', err))
  }

  const startPathGame = async (pathGame: PathGame) => {
    setLastChange(null)
    setMilestoneBanner([])
    setLadderNews([])
    // Something for the characters to notice (e.g. the rating passing a hundred), said once.
    const notice = progress.notice ?? undefined
    if (notice) updateProgress({ ...progress, notice: null })
    const opponentId = characterOpponentId(pathGame.opponent)
    // Head-to-head so far, for dialogue ("Third time lucky…").
    const h2h = await headToHead(opponentId).catch(() => ({ played: 0, wins: 0, losses: 0, theirStreak: 0 }))
    const record = newGameRecord(nextPlayerColour(game), opponentId, pathGame.stage, pathGame.rating)

    // Toby studies the player's games (rival level 1): the weakest opening, once there's evidence.
    const target = pathGame.opponent === 'toby' ? await playerWeakness().catch(() => null) : null
    // What the player usually plays, from their recent games (for the "your opening" notes).
    const repertoire = await usualOpenings().catch(() => ({}))
    // Scouting report before matches and the first (assisted) friendly against someone.
    // Scouting report: before matches and cup games, and before the first
    // practice game against someone new (their first meeting).
    const scouted =
      pathGame.kind === 'match' ||
      pathGame.kind === 'cup-round' ||
      pathGame.kind === 'boss' ||
      (pathGame.kind === 'friendly' && h2h.played === 0 && !!SCOUTING_DEMOS[pathGame.opponent])
    const scouting = scouted
      ? scoutingReport({
          character: pathGame.opponent,
          playerColour: record.playerColour,
          record: { wins: h2h.wins, losses: h2h.losses },
          target,
        })
      : undefined

    setGame({
      ...record,
      path: pathGame,
      scouting,
      rivalPrefer: target && target.colour === record.playerColour ? target.opening : undefined,
      repertoire,
      talk: {
        rematch: h2h.played + 1,
        losingStreak: h2h.theirStreak,
        lines: 0,
        lastLineMove: null,
        startSaid: false,
        endSaid: false,
        notice,
      },
    })
    setView('game')
  }

  /** The finished game's result goes on the path once; draws are simply replayed. */
  const finishGame = async (finished: GameRecord) => {
    const outcome = outcomeOf(finished)
    if (!outcome || !finished.path) {
      setView('home')
      return
    }
    // (Toby's trial-night game isn't replayed: a draw just ends the night.)
    if (outcome.winner === null && finished.path.kind !== 'exhibition') {
      startPathGame(finished.path)
      return
    }
    if (!finished.resultRecorded) {
      const won = outcome.winner === finished.playerColour // (a draw here only for Toby's game)
      const archived = await getArchivedGame(finished.id).catch(() => null)
      const loss = archived?.evals ? averageCentipawnLoss(finished.moves, archived.evals, finished.playerColour) : null
      const accuracyStrength = loss === null ? null : strengthFromAccuracy(loss)
      let next = recordGame(progress, finished.path, won, accuracyStrength)
      if (isRated(finished.path) && progress.rating && next.rating) {
        setLastChange({ from: progress.rating.rating, to: next.rating.rating })
      }
      // Milestones: a small banner on Home, and the characters may notice next game.
      const reached = await gameMilestones(finished, won, progress, next, archived).catch(() => [])
      if (reached.length > 0) {
        next = {
          ...next,
          milestones: [...(next.milestones ?? []), ...reached.map((m) => m.id)],
          notice: noticeFor(reached) ?? next.notice,
        }
        setMilestoneBanner(reached)
      }
      setLadderNews(ladderChanges(clubLadder(progress), clubLadder(next)))
      updateProgress(next)
      setGame({ ...finished, resultRecorded: true })
    }
    setView('home')
  }

  const next = nextStep(progress)

  if (next.kind === 'welcome' && view !== 'deck' && view !== 'history') {
    return (
      <WelcomeScreen
        onStart={(experience, rating, name) => {
          updateProgress(beginTrial(progress, experience, rating, name))
          setView('home')
        }}
      />
    )
  }

  if (view === 'deck') return <MistakesDeckScreen onBack={() => setView('home')} />
  if (view === 'stats') return <StatsScreen progress={progress} onBack={() => setView('home')} />
  const ladder = clubLadder(progress, progress.playerName ?? 'You')
  if (view === 'ladder' && ladder) return <LadderScreen ladder={ladder} news={ladderNews} onBack={() => setView('home')} />
  if (view === 'calendar') return <CalendarScreen progress={progress} onBack={() => setView('home')} />
  if (view === 'settings') {
    return (
      <SettingsScreen settings={settings} onChange={onChangeSettings} onBack={() => setView('home')} />
    )
  }

  // The chapter's warm-up: done (or abandoned) either way, then on to the lesson.
  const finishWarmup = () => {
    if (next.kind === 'lesson') updateProgress({ ...progress, warmupDone: next.chapterId })
    setView('home')
  }
  if (view === 'warmup') return <MistakesDeckScreen warmup onBack={() => setView('home')} onDone={finishWarmup} />

  if (view === 'puzzles' && next.kind === 'play' && next.targetedPuzzles) {
    return (
      <PuzzleSetScreen
        title={next.targetedPuzzles.title}
        openings={next.targetedPuzzles.openings}
        count={6}
        playerRating={progress.rating?.rating ?? progress.baseline}
        onDone={() => setView('home')}
      />
    )
  }

  if (view === 'lesson' && next.kind === 'lesson') {
    return (
      <LessonScreen
        chapterId={next.chapterId}
        playerRating={progress.rating?.rating ?? progress.baseline}
        onBack={() => setView('home')}
        onDone={() => {
          updateProgress(completeLesson(progress))
          setView('home')
        }}
      />
    )
  }

  if (view === 'history') {
    if (pastGame) {
      return (
        <ReviewScreen
          key={pastGame.id}
          game={upgradeGameRecord(pastGame)}
          fromHistory
          onContinue={() => {
            setPastGame(null)
            window.scrollTo({ top: 0 })
          }}
        />
      )
    }
    return <PastGamesScreen onOpen={setPastGame} onBack={() => setView('home')} />
  }

  if (game && view === 'review') {
    const outcome = outcomeOf(game)
    const preview =
      !game.resultRecorded && isRated(game.path) && progress.rating && outcome && outcome.winner !== null
        ? {
            from: progress.rating.rating,
            to: rateGame(progress.rating, game.path!.rating, outcome.winner === game.playerColour ? 1 : 0).rating,
          }
        : null
    return <ReviewScreen key={game.id} game={game} ratingChange={preview} onContinue={() => void finishGame(game)} />
  }

  if (game && view === 'game') {
    return (
      <GameScreen
        key={game.id}
        game={game}
        setGame={setGame}
        playerRating={progress.rating ? Math.round(progress.rating.rating) : undefined}
        playerName={progress.playerName}
        chatter={settings.chatter}
        onReview={() => setView('review')}
        onContinue={() => void finishGame(game)}
      />
    )
  }

  return (
    <HomeScreen
      progress={progress}
      next={next}
      lastChange={lastChange}
      milestones={milestoneBanner}
      ladder={ladder}
      ladderNews={ladderNews}
      onOpenLadder={() => setView('ladder')}
      onOpenCalendar={() => setView('calendar')}
      onPlay={startPathGame}
      onStartLesson={() => setView('lesson')}
      onTargetedPuzzles={() => setView('puzzles')}
      onOpenHistory={() => setView('history')}
      onOpenStats={() => setView('stats')}
      onOpenSettings={() => setView('settings')}
      onSetName={(playerName) => updateProgress({ ...progress, playerName })}
      onStartWarmup={() => setView('warmup')}
      onSkipStep={() => {
        setLastChange(null)
        if (next.kind === 'lesson') updateProgress(completeLesson(progress))
        else if (next.kind === 'play') updateProgress(recordGame(progress, next.game, true, null))
      }}
      onReset={() => {
        resetProgress()
          .then(() => {
            setProgress(NEW_PROGRESS)
            setGame(null)
            setLastChange(null)
            setView('home')
          })
          .catch((err) => console.error('Reset failed', err))
      }}
    />
  )
}

/** The player's usual openings, from their last 30 finished games. */
async function usualOpenings() {
  const games = (await listArchivedGames()).slice(0, 30)
  return inferRepertoire(
    games.flatMap((g) => {
      try {
        return [{ sans: replay(g.moves.slice(0, 8)).history(), playerColour: g.playerColour }]
      } catch {
        return []
      }
    }),
  )
}

/** Which milestones this finished game reaches (see logic/milestones.ts for the rules). */
async function gameMilestones(
  finished: GameRecord,
  won: boolean,
  before: Progress,
  after: Progress,
  archived: ArchivedGame | null,
): Promise<Milestone[]> {
  const path = finished.path
  if (!path) return []
  const real = path.kind !== 'friendly' && path.kind !== 'exhibition' && path.kind !== 'coaching'
  const opponent = path.opponent
  const regulars = ACT_1.chapters.map((c) => c.opponent).filter((id) => id !== 'toby')
  // Regulars beaten in a real game, from the archive, plus this game.
  const beaten = new Set<string>()
  for (const g of await listArchivedGames()) {
    try {
      const o = outcomeOf(g)
      const kind = g.path?.kind
      if (o && o.winner === g.playerColour && kind && kind !== 'friendly' && kind !== 'exhibition') {
        beaten.add(g.levelId.replace(/^char:/, ''))
      }
    } catch {
      // unreadable old game: skip
    }
  }
  if (won && real) beaten.add(opponent)
  const evals = archived?.evals
  const reviewed = evals && evals.length === finished.moves.length + 1 ? reviewMoves(finished.moves, evals) : null
  const counts = reviewed ? ratingCounts(reviewed, finished.playerColour) : null
  const names = Object.fromEntries(CHARACTERS.map((c) => [c.id, c.name]))
  return newMilestones(
    {
      won: won && real,
      rated: isRated(path),
      opponent,
      opponentName: names[opponent] ?? null,
      opponentRating: path.rating,
      ratingBefore: before.rating ? Math.round(before.rating.rating) : null,
      ratingAfter: after.rating ? Math.round(after.rating.rating) : null,
      theirStreakBefore: finished.talk?.losingStreak ?? 0,
      regularsBeaten: [...beaten],
      regulars,
      fixedRatings: after.fixedRatings,
      errors: counts ? counts.mistake + counts.blunder : null,
    },
    before.milestones ?? [],
    names,
  )
}

/** The player's weakest opening from their archive, for Toby's targeting (null until 10 real games). */
async function playerWeakness() {
  const games = await listArchivedGames()
  const played = games.flatMap((g) => {
    try {
      const outcome = outcomeOf(g)
      if (!outcome || outcome.winner === null) return []
      return [
        {
          sans: replay(g.moves.slice(0, 16)).history(),
          playerColour: g.playerColour,
          won: outcome.winner === g.playerColour,
          rated: isRated(g.path),
        },
      ]
    } catch {
      return []
    }
  })
  return rivalTarget(played)
}

/** A saved game we can't replay (e.g. from an older version) is discarded. */
function isResumable(game: GameRecord): boolean {
  try {
    outcomeOf(game)
    return true
  } catch {
    return false
  }
}
