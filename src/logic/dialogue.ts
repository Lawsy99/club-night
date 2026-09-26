// The dialogue engine (design document, "Dialogue system"): picks a short
// pre-written line by what just happened, who's speaking, and the history
// between the player and that character.

export type Trigger =
  | 'game_start'
  | 'game_win' // the character won
  | 'game_loss' // the character lost
  | 'draw_replay'
  | 'player_blunder'
  | 'bot_blunder'
  | 'strong_move'
  | 'capture_queen'
  | 'capture_rook'
  | 'capture_minor'
  | 'check_given'
  | 'check_received'
  | 'castling'
  | 'en_passant'
  | 'promotion'
  | 'clearly_winning'
  | 'clearly_losing'
  /**
   * The character says what they're planning. Not used in games since Sep
   * 2026 (fixed text often wasn't true on the board); kept for the file format.
   */
  | 'plan_hint'
  /** Matches: a stage direction at a key moment, to build tension (no chatter). */
  | 'tension'
  /** The character has just blundered and the player has a big move available. */
  | 'opportunity'
  /**
   * A long think: a small stage direction. Not used in games since Sep 2026
   * (idle, unrelated to the game); kept for the file format.
   */
  | 'long_think'
  /**
   * Competitive games: the player has found a great move, or blundered.
   * Stage directions only (no move ratings are shown in these games).
   */
  | 'match_great'
  | 'match_blunder'
  /** Toby's full-strength game at the end of trial night: before it, and after he wins. */
  | 'exhibition_start'
  | 'exhibition_win'

export type Expression = 'neutral' | 'pleased' | 'annoyed' | 'surprised' | 'smug'

export type DialogueLine = {
  id: string
  /** Whose game this line belongs to. */
  character: string
  /** Someone else saying it (e.g. Neil at Oscar's games); blank = the character. */
  speaker?: string
  trigger: Trigger
  text: string
  expression: Expression
  conditions: {
    acts?: number[]
    gameType?: 'friendly' | 'match'
    /** Exact rematch number (2 = second game against them), or "4+" style minimum. */
    rematch?: number
    minRematch?: number
    /** Only if the character has beaten the player this many times in a row. */
    losingStreak?: number
    flags?: string[]
  }
  weight: number
  once: boolean
}

export type DialogueContext = {
  character: string
  trigger: Trigger
  act: number
  gameType: 'friendly' | 'match'
  /** Games played against this character, counting this one. */
  rematch: number
  /** The character's current winning run against the player. */
  losingStreak: number
  flags: readonly string[]
  /** Lines containing {name} are only used when we know it. */
  playerName?: string
  /** Chatter set to Off: only story beats. */
  storyOnly?: boolean
}

/** A line's text with the player's name filled in. */
export function fillName(text: string, playerName: string | undefined): string {
  return playerName ? text.replaceAll('{name}', playerName) : text
}

export type DialogueHistory = {
  /** Recently used line ids, newest last. */
  recent: string[]
  /** "Once only" lines already shown. */
  onceShown: string[]
}

/**
 * The design's five steps: lines for this character and trigger; keep those
 * whose conditions match; drop recently used ones (until the set is used
 * up); drop once-only lines already shown; pick one at random, weighted.
 */
export function selectLine(
  lines: readonly DialogueLine[],
  ctx: DialogueContext,
  history: DialogueHistory,
  random: () => number = Math.random,
): DialogueLine | null {
  const matching = lines.filter((l) => l.character === ctx.character && l.trigger === ctx.trigger && conditionsMet(l, ctx))
  let available = matching.filter((l) => !(l.once && history.onceShown.includes(l.id)))
  if (available.length === 0) return null
  // Story beats (lines tied to a chapter or a kind of game) come before general chatter.
  const story = available.filter(isStoryBeat)
  if (story.length > 0) available = story
  else if (ctx.storyOnly) return null
  const fresh = available.filter((l) => !history.recent.includes(l.id))
  // Nothing repeats until the whole set has been used; then it starts again.
  const pool = fresh.length > 0 ? fresh : available
  const total = pool.reduce((sum, l) => sum + l.weight, 0)
  let roll = random() * total
  for (const line of pool) {
    roll -= line.weight
    if (roll <= 0) return line
  }
  return pool[pool.length - 1]
}

/**
 * A line written for a particular moment in the story ("chapter:c3",
 * "kind:boss"), or noticing the player's progress ("notice:rating").
 */
function isStoryBeat(line: DialogueLine): boolean {
  return !!line.conditions.flags?.some((f) => f.startsWith('chapter:') || f.startsWith('kind:') || f.startsWith('notice:'))
}

function conditionsMet(line: DialogueLine, ctx: DialogueContext): boolean {
  const c = line.conditions
  if (!ctx.playerName && line.text.includes('{name}')) return false
  if (c.acts && !c.acts.includes(ctx.act)) return false
  if (c.gameType && c.gameType !== ctx.gameType) return false
  if (c.rematch !== undefined && c.rematch !== ctx.rematch) return false
  if (c.minRematch !== undefined && ctx.rematch < c.minRematch) return false
  if (c.losingStreak !== undefined && ctx.losingStreak < c.losingStreak) return false
  if (c.flags && !c.flags.every((f) => ctx.flags.includes(f))) return false
  return true
}

/** Records that a line was shown. */
export function rememberLine(history: DialogueHistory, line: DialogueLine): DialogueHistory {
  return {
    recent: [...history.recent.filter((id) => id !== line.id), line.id].slice(-60),
    onceShown: line.once ? [...history.onceShown, line.id] : history.onceShown,
  }
}

/**
 * When several things happen at once, the most important wins (design:
 * a blunder, turnaround or queen capture beats a check, which beats the rest).
 */
const PRIORITY: Trigger[] = [
  'player_blunder',
  'bot_blunder',
  'capture_queen',
  'clearly_losing',
  'clearly_winning',
  'strong_move',
  'check_given',
  'check_received',
  'capture_rook',
  'promotion',
  'en_passant',
  'capture_minor',
  'castling',
]

export function mostImportant(triggers: readonly Trigger[]): Trigger | null {
  for (const t of PRIORITY) if (triggers.includes(t)) return t
  return triggers[0] ?? null
}

/**
 * In-game chatter (friendlies only): up to 2 lines a game, at least 10 moves
 * apart (revised Sep 2026, Joseph: far too many lines; they should be rare
 * enough to be welcome). The long-think stage direction counts too.
 */
export const CHATTER_LIMIT = 2
export const CHATTER_GAP_MOVES = 10

/** Routine events (a check, a swap, castling) only prompt a remark this often. */
export const ROUTINE_REMARK_CHANCE = 0.2

/** Blunders, a lost queen, the game turning: always worth a word (budget allowing). */
export function isBigMoment(trigger: Trigger): boolean {
  return ['player_blunder', 'bot_blunder', 'capture_queen', 'clearly_losing', 'clearly_winning', 'strong_move'].includes(trigger)
}

/**
 * Matches (revised Sep 2026, Joseph's decision): no chatter, but up to two
 * silent stage directions at key moments, at least 10 moves apart.
 */
export const MATCH_LINE_LIMIT = 2
export const MATCH_LINE_GAP_MOVES = 10
/** Move numbers where a quiet, level match gets a moment of tension. */
export const TENSION_MOVES = [15, 25, 35]

export function matchLineAllowed(options: { linesSoFar: number; moveNumber: number; lastLineMove: number | null }): boolean {
  if (options.linesSoFar >= MATCH_LINE_LIMIT) return false
  return options.lastLineMove === null || options.moveNumber - options.lastLineMove >= MATCH_LINE_GAP_MOVES
}


export function chatterAllowed(options: {
  gameType: 'friendly' | 'match'
  linesSoFar: number
  moveNumber: number
  lastLineMove: number | null
}): boolean {
  if (options.gameType !== 'friendly') return false
  if (options.linesSoFar >= CHATTER_LIMIT) return false
  return options.lastLineMove === null || options.moveNumber - options.lastLineMove >= CHATTER_GAP_MOVES
}
