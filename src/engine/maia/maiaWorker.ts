// Runs Maia-3 in a Web Worker (a background thread), so the board never
// freezes. Downloads the model once, keeps it in the browser's cache for
// offline play, and answers "what would a human at this rating play?".
import * as ort from 'onnxruntime-web/wasm'

const BASE = import.meta.env.BASE_URL
const MODEL_URL = `${BASE}maia/maia3_simplified.onnx`
/** Bump when the model file changes, so phones fetch the new one. */
const CACHE_NAME = 'club-night-maia-v1'

// Single-threaded: multi-threading needs special server headers that GitHub
// Pages can't send, and it's the most reliable option on iPhone. (The
// runtime's .wasm file is bundled by Vite alongside this worker.)
ort.env.wasm.numThreads = 1

export type MaiaRequest =
  | { type: 'load' }
  | { type: 'infer'; id: number; tokens: Float32Array; eloSelf: number; eloOppo: number }

export type MaiaResponse =
  | { type: 'progress'; loaded: number; total: number }
  | { type: 'ready' }
  | { type: 'result'; id: number; logitsMove: Float32Array; logitsValue: Float32Array; ms: number }
  | { type: 'error'; id?: number; message: string }

let session: ort.InferenceSession | null = null
let loading: Promise<void> | null = null

const post = (msg: MaiaResponse, transfer: Transferable[] = []) =>
  (self as unknown as Worker).postMessage(msg, transfer)

async function fetchModel(): Promise<ArrayBuffer> {
  const cache = await caches.open(CACHE_NAME).catch(() => null)
  const cached = await cache?.match(MODEL_URL)
  if (cached) return cached.arrayBuffer()

  // Stream the download so the screen can show progress.
  const response = await fetch(MODEL_URL)
  if (!response.ok || !response.body) throw new Error(`Couldn't download Maia (${response.status})`)
  const total = Number(response.headers.get('Content-Length')) || 45_700_000
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let loaded = 0
  let lastReport = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    loaded += value.length
    if (loaded - lastReport > 500_000) {
      post({ type: 'progress', loaded, total })
      lastReport = loaded
    }
  }
  const buffer = new Uint8Array(loaded)
  let offset = 0
  for (const chunk of chunks) {
    buffer.set(chunk, offset)
    offset += chunk.length
  }
  // Keep it for next time (and for offline play). If the phone refuses to
  // store it, Maia still works this session; it just downloads again later.
  await cache?.put(MODEL_URL, new Response(buffer.slice())).catch(() => undefined)
  return buffer.buffer
}

function load(): Promise<void> {
  loading ??= (async () => {
    const model = await fetchModel()
    session = await ort.InferenceSession.create(model)
  })().catch((err) => {
    loading = null // allow a retry
    throw err
  })
  return loading
}

self.onmessage = async (e: MessageEvent<MaiaRequest>) => {
  const msg = e.data
  try {
    if (msg.type === 'load') {
      await load()
      post({ type: 'ready' })
    } else {
      await load()
      const started = performance.now()
      const result = await session!.run({
        tokens: new ort.Tensor('float32', msg.tokens, [1, 64, 12]),
        elo_self: new ort.Tensor('float32', Float32Array.from([msg.eloSelf]), [1]),
        elo_oppo: new ort.Tensor('float32', Float32Array.from([msg.eloOppo]), [1]),
      })
      const logitsMove = new Float32Array(result.logits_move.data as Float32Array)
      const logitsValue = new Float32Array(result.logits_value.data as Float32Array)
      post(
        { type: 'result', id: msg.id, logitsMove, logitsValue, ms: Math.round(performance.now() - started) },
        [logitsMove.buffer, logitsValue.buffer],
      )
    }
  } catch (err) {
    post({ type: 'error', id: msg.type === 'infer' ? msg.id : undefined, message: (err as Error).message })
  }
}
