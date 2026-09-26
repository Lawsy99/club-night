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

/** Once the model is loaded, a prediction takes well under a second; this means it's stuck. */
const PREDICT_TIMEOUT_MS = 20_000
/** The first move may include the one-off download (about 44 MB). */
const DOWNLOAD_TIMEOUT_MS = 180_000
/** After a failure, leave Maia alone for a minute (the backup bot plays meanwhile). */
const RETRY_AFTER_MS = 60_000

class MaiaClient {
  private worker!: Worker
  private pending = new Map<number, Pending>()
  private nextId = 0
  private statusListeners = new Set<(s: MaiaStatus) => void>()
  private lastFailure = 0
  status: MaiaStatus = { state: 'idle' }

  constructor() {
    this.start()
  }

  private start() {
    this.worker = new Worker(new URL('./maiaWorker.ts', import.meta.url), { type: 'module' })
    this.worker.onmessage = (e: MessageEvent<MaiaResponse>) => {
      const msg = e.data
      if (msg.type === 'progress') this.setStatus({ state: 'downloading', loaded: msg.loaded, total: msg.total })
      else if (msg.type === 'ready') this.setStatus({ state: 'ready' })
      else if (msg.type === 'result') {
        this.pending.get(msg.id)?.resolve(msg)
        this.pending.delete(msg.id)
        if (this.status.state !== 'ready') this.setStatus({ state: 'ready' })
      } else if (msg.type === 'error') {
        this.lastFailure = Date.now()
        if (msg.id !== undefined) {
          this.pending.get(msg.id)?.reject(new Error(msg.message))
          this.pending.delete(msg.id)
        }
        this.setStatus({ state: 'error', message: msg.message })
      }
    }
    this.worker.onerror = (e) => this.fail(new Error(`Maia failed: ${e.message || 'could not start'}`))
  }

  /** Something went wrong: reject what's waiting and start a fresh worker for next time. */
  private fail(error: Error) {
    this.lastFailure = Date.now()
    this.setStatus({ state: 'error', message: error.message })
    for (const p of this.pending.values()) p.reject(error)
    this.pending.clear()
    this.worker.terminate()
    this.start()
  }

  /** True for a minute after a failure, so a bad connection doesn't stall every move. */
  get resting(): boolean {
    return Date.now() - this.lastFailure < RETRY_AFTER_MS
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
    if (this.resting) throw new Error('Maia is unavailable for a moment')
    const timeout = this.status.state === 'ready' ? PREDICT_TIMEOUT_MS : DOWNLOAD_TIMEOUT_MS
    this.load()
    const input = encodePosition(fen)
    const id = this.nextId++
    const result = await new Promise<MaiaResponse & { type: 'result' }>((resolve, reject) => {
      // If the worker goes quiet (iPhone can pause it in the background), give up and restart it.
      const timer = setTimeout(() => this.fail(new Error('Maia took too long')), timeout)
      const done = <T,>(fn: (v: T) => void) => (v: T) => {
        clearTimeout(timer)
        fn(v)
      }
      this.pending.set(id, { resolve: done(resolve), reject: done(reject) })
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
