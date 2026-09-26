// Turns the dialogue spreadsheet (content/dialogue.csv, editable in Excel or
// Numbers) into src/data/dialogue.json for the app. Runs before every build.
//
// Columns: id, character, speaker (blank = the character), trigger, text,
// expression, acts (e.g. "1 2"), gameType (friendly/match), rematch,
// minRematch, losingStreak, flags (space-separated), weight, once (yes/blank).
import { readFileSync, writeFileSync } from 'node:fs'

/** Splits CSV text into rows, handling quoted fields with commas and "" quotes. */
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      if (row.some((f) => f !== '')) rows.push(row)
      row = []
      field = ''
    } else field += c
  }
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

const [header, ...rows] = parseCsv(readFileSync('content/dialogue.csv', 'utf8'))
const col = (name) => header.indexOf(name)
const number = (v) => (v === '' || v === undefined ? undefined : Number(v))

const lines = rows.map((r, i) => {
  const get = (name) => (r[col(name)] ?? '').trim()
  if (!get('id') || !get('character') || !get('trigger') || !get('text')) {
    throw new Error(`content/dialogue.csv row ${i + 2}: id, character, trigger and text are required`)
  }
  const conditions = {
    acts: get('acts') ? get('acts').split(/\s+/).map(Number) : undefined,
    gameType: get('gameType') || undefined,
    rematch: number(get('rematch')),
    minRematch: number(get('minRematch')),
    losingStreak: number(get('losingStreak')),
    flags: get('flags') ? get('flags').split(/\s+/) : undefined,
  }
  return {
    id: get('id'),
    character: get('character'),
    speaker: get('speaker') || undefined,
    trigger: get('trigger'),
    text: get('text'),
    expression: get('expression') || 'neutral',
    conditions: Object.fromEntries(Object.entries(conditions).filter(([, v]) => v !== undefined)),
    weight: number(get('weight')) ?? 1,
    once: get('once').toLowerCase() === 'yes',
  }
})

const ids = new Set()
for (const l of lines) {
  if (ids.has(l.id)) throw new Error(`content/dialogue.csv: duplicate id "${l.id}"`)
  ids.add(l.id)
}

writeFileSync('src/data/dialogue.json', JSON.stringify(lines, null, 1) + '\n')
console.log(`Dialogue: ${lines.length} lines.`)
