// Builds the app's puzzle set from the Lichess puzzle database (public domain,
// https://database.lichess.org/#puzzles). Run on a computer, not in the app:
//
//   node scripts/buildPuzzles.mjs path/to/lichess_db_puzzle.csv.zst
//
// Picks about 30,000 well-tested puzzles, balanced across themes, openings
// and difficulty, and writes public/puzzles/puzzles.json.
import { createReadStream, mkdirSync, writeFileSync } from 'node:fs'
import { Decompress } from 'fzstd'

const input = process.argv[2]
if (!input) throw new Error('Usage: node scripts/buildPuzzles.mjs lichess_db_puzzle.csv.zst')

// Only puzzles lots of people have played and liked, with a settled rating.
const MIN_PLAYS = 300
const MIN_POPULARITY = 80
const MAX_DEVIATION = 90

// Difficulty bins of 100 rating points; each theme/opening gets a share of each bin.
const binOf = (rating) => Math.max(4, Math.min(28, Math.floor(rating / 100)))
const PER_THEME_PER_BIN = 45
const PER_OPENING_PER_BIN = 25

/** Themes the lessons and the mistakes deck use (Lichess theme names). */
const THEMES = [
  'fork', 'pin', 'skewer', 'discoveredAttack', 'hangingPiece', 'trappedPiece', 'capturingDefender',
  'deflection', 'attraction', 'doubleCheck', 'backRankMate', 'mateIn1', 'mateIn2', 'mateIn3',
  'smotheredMate', 'defensiveMove', 'quietMove', 'intermezzo', 'clearance', 'interference',
  'xRayAttack', 'zugzwang', 'sacrifice', 'exposedKing', 'kingsideAttack', 'advancedPawn',
  'promotion', 'rookEndgame', 'pawnEndgame', 'bishopEndgame', 'knightEndgame', 'queenEndgame',
  'endgame', 'middlegame', 'opening', 'equality', 'advantage', 'crushing',
]

/** Opening families (from Lichess's OpeningTags), for the characters' openings. */
const OPENINGS = [
  ['london', /London_System/],
  ['kings-gambit', /^Kings_Gambit/],
  ['danish', /^Danish_Gambit/],
  ['englund', /^Englund_Gambit/],
  ['stafford', /Stafford_Gambit/],
  ['italian', /^Italian_Game/],
  ['ruy-lopez', /^Ruy_Lopez/],
  ['qgd', /^Queens_Gambit_Declined/],
  ['french', /^French_Defense/],
  ['petroff', /^(Petrovs_Defense|Russian_Game)/],
  ['catalan', /^Catalan_Opening/],
  ['najdorf', /Najdorf/],
  ['sicilian', /^Sicilian_Defense/],
  ['nimzo', /^Nimzo-Indian_Defense/],
  ['caro-kann', /^Caro-Kann_Defense/],
  ['slav', /^(Slav_Defense|Semi-Slav_Defense)/],
  ['kings-indian', /^Kings_Indian_Defense/],
  ['english', /^English_Opening/],
  ['dutch', /^Dutch_Defense/],
  ['colle', /Colle_System/],
]

const themeCounts = new Map()
const openingCounts = new Map()
const chosen = []
let rows = 0

function consider(line) {
  const [id, fen, moves, rating, deviation, popularity, plays, themes, , openingTags] = line.split(',')
  if (id === 'PuzzleId' || !fen) return
  if (Number(plays) < MIN_PLAYS || Number(popularity) < MIN_POPULARITY || Number(deviation) > MAX_DEVIATION) return
  const r = Number(rating)
  const bin = binOf(r)
  const themeList = themes.split(' ')
  const opening = OPENINGS.find(([, re]) => (openingTags ?? '').split(' ').some((t) => re.test(t)))?.[0] ?? ''

  let keep = false
  for (const t of themeList) {
    if (!THEMES.includes(t)) continue
    const key = `${t}:${bin}`
    if ((themeCounts.get(key) ?? 0) < PER_THEME_PER_BIN) keep = true
  }
  const openingKey = `${opening}:${bin}`
  if (opening && (openingCounts.get(openingKey) ?? 0) < PER_OPENING_PER_BIN) keep = true
  if (!keep) return

  for (const t of themeList) if (THEMES.includes(t)) themeCounts.set(`${t}:${bin}`, (themeCounts.get(`${t}:${bin}`) ?? 0) + 1)
  if (opening) openingCounts.set(openingKey, (openingCounts.get(openingKey) ?? 0) + 1)
  // Compact row: id, position, moves (the first is the opponent's), rating, themes, opening family.
  chosen.push([id, fen, moves, r, themeList.filter((t) => THEMES.includes(t)).join(' '), opening])
}

const decoder = new TextDecoder()
let buffer = ''
const decompress = new Decompress((chunk, final) => {
  buffer += decoder.decode(chunk, { stream: !final })
  let nl
  while ((nl = buffer.indexOf('\n')) >= 0) {
    consider(buffer.slice(0, nl))
    buffer = buffer.slice(nl + 1)
    rows++
  }
})

createReadStream(input)
  .on('data', (c) => decompress.push(new Uint8Array(c)))
  .on('end', () => {
    decompress.push(new Uint8Array(0), true)
    if (buffer) consider(buffer)
    mkdirSync('public/puzzles', { recursive: true })
    writeFileSync('public/puzzles/puzzles.json', JSON.stringify(chosen))
    console.log(`Read ${rows} puzzles, kept ${chosen.length}.`)
  })
