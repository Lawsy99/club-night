// What a game is, in a word or two, for labels (the game screen, Past
// games). Players never see the internal stage names ("real", "guided").
import type { GameRecord } from './gameRecord'

const KIND_LABELS: Record<string, string> = {
  trial: 'Trial night',
  exhibition: 'Just for fun',
  coaching: 'Coached',
  friendly: 'Practice',
  match: 'Best of three',
  'cup-round': 'Knockout cup',
  boss: 'Cup final',
}

const STAGE_LABELS: Record<string, string> = { assisted: 'Coached', guided: 'Practice', real: 'Match' }

export function gameKindLabel(game: Pick<GameRecord, 'path' | 'stage'>): string {
  return (game.path && KIND_LABELS[game.path.kind]) ?? STAGE_LABELS[game.stage] ?? 'Game'
}
