// Everything is saved on the device in IndexedDB (the browser's built-in
// database). No accounts, no servers.
import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { DialogueHistory } from '../logic/dialogue'
import { outcomeOf as outcomeOfRecord, type GameRecord } from '../logic/gameRecord'
import { planAdditions, type MistakeCard } from '../logic/mistakesDeck'
import type { PlayerRating } from '../logic/glicko2'
import type { Progress } from '../logic/path'
import type { PositionEval } from '../logic/review'
import { DEFAULT_SETTINGS, type Settings } from '../logic/settings'
import type { Backup } from '../logic/backup'

/** A finished game in the archive, with its review analysis once done. */
export type ArchivedGame = GameRecord & {
  finishedAt: number
  /** One engine evaluation per position (moves.length + 1), once analysed. */
  evals?: PositionEval[]
}

interface ClubNightDB extends DBSchema {
  /** Small named values: the game in progress, which screen was open, progress on the path. */
  state: {
    key: 'currentGame' | 'screen' | 'baseline' | 'progress' | 'puzzles' | 'dialogue' | 'settings'
    value: GameRecord | string | number | Progress | PuzzleProgress | DialogueHistory | Settings
  }
  /** Every finished game. */
  games: {
    key: string
    value: ArchivedGame
    indexes: { finishedAt: number }
  }
  /** The mistakes deck. */
  cards: {
    key: string
    value: MistakeCard
  }
}

let dbPromise: Promise<IDBPDatabase<ClubNightDB>> | null = null

function db() {
  dbPromise ??= openDB<ClubNightDB>('club-night', 3, {
    upgrade(database, oldVersion) {
      // Each block adds what that version introduced, so older saves upgrade in place.
      if (oldVersion < 1) database.createObjectStore('state')
      if (oldVersion < 2) {
        database.createObjectStore('games', { keyPath: 'id' }).createIndex('finishedAt', 'finishedAt')
      }
      if (oldVersion < 3) database.createObjectStore('cards', { keyPath: 'id' })
    },
    // If another copy of the app (e.g. an old tab) is holding the database
    // open on an older version, let go so the upgrade isn't stuck.
    blocking() {
      dbPromise?.then((d) => d.close())
      dbPromise = null
    },
  })
  return dbPromise
}

export async function loadCurrentGame(): Promise<GameRecord | null> {
  return ((await (await db()).get('state', 'currentGame')) as GameRecord | undefined) ?? null
}

export async function saveCurrentGame(game: GameRecord): Promise<void> {
  await (await db()).put('state', game, 'currentGame')
}

/** The player's progress along the path (rating, act, chapter, cup…). */
export async function loadProgress(): Promise<Progress | null> {
  const value = await (await db()).get('state', 'progress')
  return value && typeof value === 'object' && 'stage' in value ? (value as Progress) : null
}

export async function saveProgress(progress: Progress): Promise<void> {
  await (await db()).put('state', progress, 'progress')
}

/** Puzzle rating (tracked separately from the playing rating) and puzzles already seen. */
export type PuzzleProgress = { rating: PlayerRating; seen: string[] }

export async function loadPuzzleProgress(): Promise<PuzzleProgress | null> {
  const value = await (await db()).get('state', 'puzzles')
  return value && typeof value === 'object' && 'seen' in value ? (value as PuzzleProgress) : null
}

export async function savePuzzleProgress(p: PuzzleProgress): Promise<void> {
  // Remember the most recent 3,000 seen, plenty to avoid repeats.
  await (await db()).put('state', { ...p, seen: p.seen.slice(-3000) }, 'puzzles')
}

/** Recently used dialogue lines and once-only lines already shown. */
export async function loadDialogueHistory(): Promise<DialogueHistory> {
  const value = await (await db()).get('state', 'dialogue')
  return value && typeof value === 'object' && 'recent' in value ? (value as DialogueHistory) : { recent: [], onceShown: [] }
}

export async function saveDialogueHistory(history: DialogueHistory): Promise<void> {
  await (await db()).put('state', history, 'dialogue')
}

/** Head-to-head against one opponent: games played, wins, losses, and their current winning run. */
export async function headToHead(
  opponentId: string,
): Promise<{ played: number; wins: number; losses: number; theirStreak: number }> {
  const games = (await listArchivedGames()).filter((g) => g.levelId === opponentId) // newest first
  const lost = (g: ArchivedGame) => g.resignedBy === g.playerColour || lostOnBoard(g)
  const won = (g: ArchivedGame) => !lost(g) && wonOnBoardOrByResignation(g)
  let theirStreak = 0
  for (const g of games) {
    if (!lost(g)) break
    theirStreak++
  }
  return { played: games.length, wins: games.filter(won).length, losses: games.filter(lost).length, theirStreak }
}

function wonOnBoardOrByResignation(g: ArchivedGame): boolean {
  try {
    const o = outcomeOfRecord(g)
    return o !== null && o.winner === g.playerColour
  } catch {
    return false
  }
}

function lostOnBoard(g: ArchivedGame): boolean {
  try {
    const o = outcomeOfRecord(g)
    return o !== null && o.winner !== null && o.winner !== g.playerColour
  } catch {
    return false
  }
}

/** Playtest tool: forget progress and the current game (the archive and deck stay). */
export async function resetProgress(): Promise<void> {
  const database = await db()
  await database.delete('state', 'progress')
  await database.delete('state', 'currentGame')
  await database.delete('state', 'screen')
}

/** Which screen was open, so a closed app reopens in the same place. */
export async function loadScreen(): Promise<string | null> {
  return ((await (await db()).get('state', 'screen')) as string | undefined) ?? null
}

export async function saveScreen(screen: string): Promise<void> {
  await (await db()).put('state', screen, 'screen')
}

/** Adds a finished game to the archive (keeping any analysis already saved). */
export async function archiveGame(game: GameRecord): Promise<void> {
  const database = await db()
  const existing = await database.get('games', game.id)
  await database.put('games', { ...existing, ...game, finishedAt: existing?.finishedAt ?? Date.now() })
}

/** Every finished game, newest first. */
export async function listArchivedGames(): Promise<ArchivedGame[]> {
  const games = await (await db()).getAllFromIndex('games', 'finishedAt')
  return games.reverse()
}

export async function getArchivedGame(id: string): Promise<ArchivedGame | null> {
  return (await (await db()).get('games', id)) ?? null
}

export async function saveGameAnalysis(id: string, evals: PositionEval[]): Promise<void> {
  const database = await db()
  const existing = await database.get('games', id)
  if (existing) await database.put('games', { ...existing, evals })
}

/**
 * Adds cards to the deck, following the deck's rules (no duplicates, a size
 * limit that retires the oldest). Existing cards keep their schedule.
 */
export async function addCardsIfNew(cards: MistakeCard[]): Promise<void> {
  const tx = (await db()).transaction('cards', 'readwrite')
  const { add, retire } = planAdditions(await tx.store.getAll(), cards)
  for (const card of [...add, ...retire]) await tx.store.put(card)
  await tx.done
}

export async function loadCards(): Promise<MistakeCard[]> {
  return (await db()).getAll('cards')
}

export async function saveCard(card: MistakeCard): Promise<void> {
  await (await db()).put('cards', card)
}

// --- Settings ----------------------------------------------------------------

export async function loadSettings(): Promise<Settings> {
  const value = await (await db()).get('state', 'settings')
  return value && typeof value === 'object' && 'chatter' in value ? { ...DEFAULT_SETTINGS, ...(value as Settings) } : DEFAULT_SETTINGS
}

export async function saveSettings(settings: Settings): Promise<void> {
  await (await db()).put('state', settings, 'settings')
}

// --- Backup (design document, "Keeping it safe") ------------------------------

/** Everything on the device, in one object, for the backup file. */
export async function exportAll(): Promise<Backup> {
  const database = await db()
  const keys = await database.getAllKeys('state')
  const state: Record<string, unknown> = {}
  for (const key of keys) state[key] = await database.get('state', key)
  return {
    app: 'club-night',
    version: 1,
    exportedAt: Date.now(),
    state,
    games: await database.getAll('games'),
    cards: await database.getAll('cards'),
  }
}

/** Replaces everything on the device with a backup (already checked by parseBackup). */
export async function importAll(backup: Backup): Promise<void> {
  const database = await db()
  const tx = database.transaction(['state', 'games', 'cards'], 'readwrite')
  await Promise.all([tx.objectStore('state').clear(), tx.objectStore('games').clear(), tx.objectStore('cards').clear()])
  for (const [key, value] of Object.entries(backup.state)) {
    await tx.objectStore('state').put(value as never, key as never)
  }
  for (const game of backup.games) await tx.objectStore('games').put(game as ArchivedGame)
  for (const card of backup.cards) await tx.objectStore('cards').put(card as MistakeCard)
  await tx.done
}

/**
 * Asks the browser not to clear our data when the device is short of space.
 * (Home-screen apps on iPhone are already protected from Safari's clean-up;
 * this is a belt-and-braces request, and it's fine if the browser says no.)
 */
export async function requestPersistentStorage(): Promise<void> {
  try {
    await navigator.storage?.persist?.()
  } catch {
    // Not supported: nothing to do.
  }
}
