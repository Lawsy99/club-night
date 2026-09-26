// The dialogue library, generated from content/dialogue.csv by
// scripts/buildDialogue.mjs (edit the spreadsheet, not the JSON).
import type { DialogueLine } from '../logic/dialogue'
import LINES from './dialogue.json'

export const DIALOGUE: DialogueLine[] = LINES as DialogueLine[]

/** Display names for speakers who aren't opponents. */
export const SPEAKER_NAMES: Record<string, string> = {
  neil: 'Neil (Oscar’s dad)',
  pemberton: 'Coach Pemberton',
  marjorie: 'Marjorie',
  ray: 'Ray',
  sheila: 'Sheila',
  bill: 'Bill',
  malcolm: 'Malcolm',
}
