// The backup file (design document, "Keeping it safe"): everything saved on
// the phone, in one file, so progress survives a new phone or a cleared
// browser. This checks a file before anything is overwritten.

export type Backup = {
  app: 'club-night'
  version: 1
  exportedAt: number
  /** The small named values: progress, settings, the game in progress… */
  state: Record<string, unknown>
  games: unknown[]
  cards: unknown[]
}

export type BackupSummary = { exportedAt: number; games: number; cards: number; rating: number | null; name: string | null }

/** Reads a backup file's text, or throws an Error with a plain-English reason. */
export function parseBackup(text: string): Backup {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error("That file isn't a Club Night backup (it couldn't be read).")
  }
  const b = data as Partial<Backup>
  if (!b || typeof b !== 'object' || b.app !== 'club-night') {
    throw new Error("That file isn't a Club Night backup.")
  }
  if (b.version !== 1) throw new Error('That backup is from a newer version of the app. Update the app first.')
  if (!b.state || typeof b.state !== 'object' || !Array.isArray(b.games) || !Array.isArray(b.cards)) {
    throw new Error('That backup is incomplete, so nothing was changed.')
  }
  const hasIds = (xs: unknown[]) => xs.every((x) => !!x && typeof x === 'object' && typeof (x as { id?: unknown }).id === 'string')
  if (!hasIds(b.games) || !hasIds(b.cards)) throw new Error('That backup looks damaged, so nothing was changed.')
  return b as Backup
}

/** What's in a backup, to confirm before restoring it. */
export function summarise(b: Backup): BackupSummary {
  const progress = b.state.progress as { rating?: { rating?: number } | null; playerName?: string } | undefined
  const rating = progress?.rating?.rating
  return {
    exportedAt: b.exportedAt,
    games: b.games.length,
    cards: b.cards.length,
    rating: typeof rating === 'number' ? Math.round(rating) : null,
    name: progress?.playerName ?? null,
  }
}

/** e.g. "club-night-backup-2026-09-26.json" */
export function backupFileName(at: number): string {
  return `club-night-backup-${new Date(at).toISOString().slice(0, 10)}.json`
}
