// Settings (design document, "Screens"): how much the characters talk, and
// the backup: export everything to one file, or restore from one.
import { useRef, useState } from 'react'
import { BUILD_LABEL } from '../buildInfo'
import { backupFileName, parseBackup, summarise } from '../logic/backup'
import { CHATTER_OPTIONS, type Settings } from '../logic/settings'
import { exportAll, importAll } from '../storage/db'
import './SettingsScreen.css'

type Props = {
  settings: Settings
  onChange: (s: Settings) => void
  onBack: () => void
}

export function SettingsScreen({ settings, onChange, onBack }: Props) {
  const [message, setMessage] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  async function exportBackup() {
    setMessage(null)
    try {
      const backup = await exportAll()
      const name = backupFileName(backup.exportedAt)
      const file = new File([JSON.stringify(backup)], name, { type: 'application/json' })
      // On iPhone the share sheet is the natural way to keep a file ("Save to Files").
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Club Night backup' })
      } else {
        const url = URL.createObjectURL(file)
        const link = document.createElement('a')
        link.href = url
        link.download = name
        link.click()
        setTimeout(() => URL.revokeObjectURL(url), 10_000)
      }
      setMessage(`Backup made: ${backup.games.length} games and ${backup.cards.length} deck cards.`)
    } catch (err) {
      // Closing the share sheet counts as an error; that's not worth a message.
      if ((err as Error).name !== 'AbortError') setMessage(`Couldn't make the backup: ${(err as Error).message}`)
    }
  }

  async function importBackup(file: File) {
    setMessage(null)
    try {
      const backup = parseBackup(await file.text())
      const s = summarise(backup)
      const who = s.name ? `${s.name}, ` : ''
      const rating = s.rating !== null ? `rating ${s.rating}, ` : ''
      const when = new Date(s.exportedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      const ok = window.confirm(
        `Restore the backup from ${when}? (${who}${rating}${s.games} games, ${s.cards} deck cards)\n\nEverything on this phone will be replaced.`,
      )
      if (!ok) return
      await importAll(backup)
      window.location.reload()
    } catch (err) {
      setMessage((err as Error).message)
    }
  }

  return (
    <main className="settings-screen">
      <header className="settings-header">
        <button type="button" className="settings-back" onClick={onBack}>
          ‹ Back
        </button>
        <h1>Settings</h1>
      </header>

      <section>
        <h2>Chatter</h2>
        <p className="settings-note">How much the other players say.</p>
        <div className="settings-options" role="radiogroup" aria-label="Chatter">
          {CHATTER_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={settings.chatter === o.value}
              className={settings.chatter === o.value ? 'selected' : undefined}
              onClick={() => onChange({ ...settings, chatter: o.value })}
            >
              <strong>{o.label}</strong>
              <span>{o.detail}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2>Backup</h2>
        <p className="settings-note">
          Everything is saved on this phone only. Make a backup now and then, and keep the file somewhere safe (Save to
          Files works well). It also moves your progress to a new phone.
        </p>
        <button type="button" className="settings-action primary" onClick={() => void exportBackup()}>
          Make a backup
        </button>
        <button type="button" className="settings-action" onClick={() => fileInput.current?.click()}>
          Restore from a backup
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = '' // so choosing the same file again still works
            if (file) void importBackup(file)
          }}
        />
        {message && (
          <p className="settings-message" role="status">
            {message}
          </p>
        )}
      </section>

      <p className="build-stamp">Version: {BUILD_LABEL}</p>
    </main>
  )
}
