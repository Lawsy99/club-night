// The club noticeboard on Home: one line from a member about what's coming
// up, in their voice (Character Tone Guide). PLACEHOLDER until the Act 1
// story outline is agreed; keyed by where the player is on the path.

export type Notice = { speaker: string; text: string }

export const NOTICEBOARD: Record<string, Notice> = {
  trial: { speaker: 'Marjorie', text: "New members' night. Tea's fifty pence. Graham will want your name spelt properly." },
  // Before Toby's game at the end of trial night.
  'trial-finale': { speaker: 'Graham', text: "Toby isn't on the membership list yet. Strictly speaking, that game is unofficial." },
  c1: { speaker: 'Graham', text: 'Reminder: subs are due. Not now. After.' },
  c2: { speaker: 'Marjorie', text: 'Dex is filming again. Try not to be in it.' },
  c3: { speaker: 'Neil', text: "Junior night Thursday. Oscar's coach says he's ahead of schedule." },
  c4: { speaker: 'Marjorie', text: "Clive's brought his flask. It'll be a long one." },
  c5: { speaker: 'Priya', text: "Has anyone got the new edition? Chapter nine's changed." },
  c6: { speaker: 'Graham', text: "The pub want another eight pounds a night. I've done a spreadsheet." },
  c7: { speaker: 'Toby', text: 'Anyone fancy going over games after? No worries if not.' },
  cup: { speaker: 'Marjorie', text: "Knockout cup draw's up. I did the draw. It's all above board." },
  final: { speaker: 'Coach Pemberton', text: "Final's Tuesday. I'll look at yours after. Toby's had a very interesting Najdorf." },
  complete: { speaker: 'Marjorie', text: 'Well, the engraver needed it by Friday.' },
}
