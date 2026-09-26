// Runs Stockfish in a Web Worker (a background thread), so the board never
// freezes while it thinks. One engine is shared by the whole app, and
// searches are queued so only one runs at a time.
import { parseBestMove, parseInfoLine, type PvLine } from './uci'

export type SearchOptions = {
  /** Stop after this many milliseconds. */
  movetime?: number
  /** Stop at this depth (whichever limit comes first). */
  depth?: number
  /** How many alternative lines to report (1 = just the best). */
  multiPv?: number
  /** Stockfish's built-in weakening, 0 (weakest) to 20 (full strength). */
  skillLevel?: number
}

export type SearchResult = {
  bestMove: string | null
  /** Final lines, best first. */
  lines: PvLine[]
}

// The lite single-threaded build: small, and needs no special server
// headers, which GitHub Pages can't provide. It finds its .wasm file itself.
const ENGINE_URL = `${import.meta.env.BASE_URL}stockfish/stockfish-19-lite-single.js`

class StockfishEngine {
  private worker: Worker
  private listeners = new Set<(line: string) => void>()
  private queue: Promise<unknown>
  private currentSkill = 20
  private failure: Error | null = null
  private failListeners = new Set<(err: Error) => void>()

  constructor() {
    this.worker = new Worker(ENGINE_URL)
    this.worker.onmessage = (e: MessageEvent<string>) => {
      for (const listen of [...this.listeners]) listen(e.data)
    }
    // If the engine can't load (e.g. a failed download), fail loudly rather
    // than leaving the app "thinking" forever.
    this.worker.onerror = (e) => this.breakDown(new Error(`Chess engine failed: ${e.message || 'could not load'}`))
    this.queue = this.guard(this.handshake())
  }

  /** Wraps a promise so it rejects if the engine crashes meanwhile. */
  private guard<T>(work: Promise<T>): Promise<T> {
    if (this.failure) return Promise.reject(this.failure)
    return new Promise<T>((resolve, reject) => {
      const fail = (err: Error) => reject(err)
      this.failListeners.add(fail)
      work.then(resolve, reject).finally(() => this.failListeners.delete(fail))
    })
  }

  /** Waits for the engine to say it's ready to take commands. */
  private async handshake() {
    await this.sendAndWait('uci', (l) => l === 'uciok')
    await this.sendAndWait('isready', (l) => l === 'readyok')
  }

  private send(command: string) {
    this.worker.postMessage(command)
  }

  private sendAndWait(command: string, isDone: (line: string) => boolean): Promise<void> {
    return new Promise((resolve) => {
      const listen = (line: string) => {
        if (!isDone(line)) return
        this.listeners.delete(listen)
        resolve()
      }
      this.listeners.add(listen)
      this.send(command)
    })
  }

  /** True once the engine has crashed or stalled; getEngine then starts a new one. */
  get failed(): boolean {
    return this.failure !== null
  }

  /** Marks the engine as broken, failing whatever is waiting on it. */
  private breakDown(error: Error) {
    if (this.failure) return
    this.failure = error
    for (const fail of [...this.failListeners]) fail(error)
    this.worker.terminate()
  }

  /** Searches a position. Queued behind any search already running. */
  search(fen: string, options: SearchOptions = {}): Promise<SearchResult> {
    const run = () => this.guard(this.withWatchdog(this.runSearch(fen, options), options))
    const result = this.queue.then(run, run)
    this.queue = result.catch(() => undefined)
    return result
  }

  /**
   * No search here takes more than a few seconds, even on a phone. If one
   * goes quiet (iPhone can freeze a background worker), treat the engine as
   * broken so the next request gets a fresh one instead of waiting forever.
   */
  private withWatchdog<T>(work: Promise<T>, options: SearchOptions): Promise<T> {
    const limit = (options.movetime ?? 0) + 25_000
    const timer = setTimeout(() => this.breakDown(new Error('The chess engine stopped responding')), limit)
    return work.finally(() => clearTimeout(timer))
  }

  private async runSearch(fen: string, options: SearchOptions): Promise<SearchResult> {
    const skill = options.skillLevel ?? 20
    if (skill !== this.currentSkill) {
      this.send(`setoption name Skill Level value ${skill}`)
      this.currentSkill = skill
    }
    this.send(`setoption name MultiPV value ${options.multiPv ?? 1}`)
    await this.sendAndWait('isready', (l) => l === 'readyok')

    const lines = new Map<number, PvLine>()
    return new Promise((resolve) => {
      const listen = (line: string) => {
        const info = parseInfoLine(line)
        if (info) {
          // Deeper lines replace shallower ones; at equal depth, keep the fuller line.
          const known = lines.get(info.rank)
          if (
            !known ||
            info.depth > known.depth ||
            (info.depth === known.depth && info.pv.length >= known.pv.length)
          ) {
            lines.set(info.rank, info)
          }
          return
        }
        const best = parseBestMove(line)
        if (best === undefined) return
        this.listeners.delete(listen)
        resolve({ bestMove: best, lines: [...lines.values()].sort((a, b) => a.rank - b.rank) })
      }
      this.listeners.add(listen)
      this.send(`position fen ${fen}`)
      const limits = [
        options.depth !== undefined ? `depth ${options.depth}` : '',
        options.movetime !== undefined ? `movetime ${options.movetime}` : '',
      ].join(' ')
      this.send(`go ${limits.trim() || 'depth 12'}`)
    })
  }
}

let engine: StockfishEngine | null = null

/** The shared engine, started the first time it's needed (and again if it broke). */
export function getEngine(): StockfishEngine {
  if (engine?.failed) engine = null
  engine ??= new StockfishEngine()
  return engine
}
