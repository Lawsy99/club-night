// The app's side of Maia: start the background worker, track the one-off
// download, and ask for a human-like prediction for a position.
import { decodePolicy, decodeValue, encodePosition } from './encoding'
import type { MaiaRequest, MaiaResponse } from './maiaWorker'

export type MaiaPrediction = {
  /** Legal moves with the chance a human at this rating plays each, best first. */
  policy: { move: string; p: number }[]
  /** Maia's feel for the side to move's winning chances, 0–1. */
  value: number
  /** How long the model took, for checking speed on the phone. */
  ms: number
}

export type MaiaStatus =
  | { state: 'idle' }
  | { state: 'downloading'; loaded: number; total: number }
  | { state: 'ready' }
  | { state: 'error'; message: string }

type Pending = { resolve: (r: MaiaResponse & { type: 'result' }) => void; reject: (e: Error) => void }

class MaiaClient {
  private worker = new Worker(new URL('./maiaWorker.ts', import.meta.url), { type: 'module' })
  private pending = new Map<number, Pending>()
  private nextId = 0
  private statusListeners = new Set<(s: MaiaStatus) => void>()
  status: MaiaStatus = { state: 'idle' }

  constructor() {
    this.worker.onmessage = (e: MessageEvent<MaiaResponse>) => {
      const msg = e.data
      if (msg.type === 'progress') this.setStatus({ state: 'downloading', loaded: msg.loaded, total: msg.total })
      else if (msg.type === 'ready') this.setStatus({ state: 'ready' })
      else if (msg.type === 'result') {
        this.pending.get(msg.id)?.resolve(msg)
        this.pending.delete(msg.id)
        if (this.status.state !== 'ready') this.setStatus({ state: 'ready' })
      } else if (msg.type === 'error') {
        if (msg.id !== undefined) {
          this.pending.get(msg.id)?.reject(new Error(msg.message))
          this.pending.delete(msg.id)
        } else {
          this.setStatus({ state: 'error', message: msg.message })
        }
      }
    }
    this.worker.onerror = (e) => {
      const error = new Error(`Maia failed: ${e.message || 'could not start'}`)
      this.setStatus({ state: 'error', message: error.message })
      for (const p of this.pending.values()) p.reject(error)
      this.pending.clear()
    }
  }

  private setStatus(status: MaiaStatus) {
    this.status = status
    for (const listen of this.statusListeners) listen(status)
  }

  onStatus(listen: (s: MaiaStatus) => void): () => void {
    this.statusListeners.add(listen)
    return () => this.statusListeners.delete(listen)
  }

  /** Starts the download (or loads from the phone's cache) ahead of time. */
  load() {
    if (this.status.state === 'idle' || this.status.state === 'error') {
      this.setStatus({ state: 'downloading', loaded: 0, total: 0 })
      this.worker.postMessage({ type: 'load' } satisfies MaiaRequest)
    }
  }

  async predict(fen: string, eloSelf: number, eloOppo: number): Promise<MaiaPrediction> {
    this.load()
    const input = encodePosition(fen)
    const id = this.nextId++
    const result = await new Promise<MaiaResponse & { type: 'result' }>((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.worker.postMessage({ type: 'infer', id, tokens: input.tokens, eloSelf, eloOppo } satisfies MaiaRequest, [
        input.tokens.buffer,
      ])
    })
    return {
      policy: decodePolicy(result.logitsMove, input),
      value: decodeValue(result.logitsValue),
      ms: result.ms,
    }
  }
}

let client: MaiaClient | null = null

/** The shared Maia, started the first time it's needed. */
export function getMaia(): MaiaClient {
  client ??= new MaiaClient()
  return client
}
