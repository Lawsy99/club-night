import { describe, expect, it } from 'vitest'
import { backupFileName, parseBackup, summarise, type Backup } from './backup'

const good: Backup = {
  app: 'club-night',
  version: 1,
  exportedAt: Date.UTC(2026, 8, 26),
  state: { progress: { rating: { rating: 1234.6 }, playerName: 'Joseph' } },
  games: [{ id: 'g1' }],
  cards: [{ id: 'c1' }, { id: 'c2' }],
}

describe('backup', () => {
  it('accepts a real backup and summarises it', () => {
    const parsed = parseBackup(JSON.stringify(good))
    expect(summarise(parsed)).toEqual({ exportedAt: good.exportedAt, games: 1, cards: 2, rating: 1235, name: 'Joseph' })
  })

  it('refuses anything else, with a plain reason', () => {
    expect(() => parseBackup('not json')).toThrow("isn't a Club Night backup")
    expect(() => parseBackup(JSON.stringify({ app: 'other' }))).toThrow("isn't a Club Night backup")
    expect(() => parseBackup(JSON.stringify({ ...good, version: 2 }))).toThrow('newer version')
    expect(() => parseBackup(JSON.stringify({ ...good, games: 'x' }))).toThrow('incomplete')
    expect(() => parseBackup(JSON.stringify({ ...good, games: [{}] }))).toThrow('damaged')
  })

  it('names the file by date', () => {
    expect(backupFileName(good.exportedAt)).toBe('club-night-backup-2026-09-26.json')
  })
})
