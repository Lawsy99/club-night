// The club noticeboard on Home: one line from a member about what's coming
// up, in their voice (Character Tone Guide; story outline draft 3). Keyed by
// where the player is on the path. Understated: the player joins the dots.

export type Notice = { speaker: string; text: string }

export const NOTICEBOARD: Record<string, Notice> = {
  trial: { speaker: 'Marjorie', text: "New members' night. Tea's fifty pence. Graham will want your name spelt properly." },
  // Halfway through trial night: the first sign of Vera (the honours board).
  'trial-honours': { speaker: 'Marjorie', text: 'That’s the honours board. One name, mostly, for a good while. Board two. Honestly. Thirty years.' },
  // Before Toby's game at the end of trial night.
  'trial-finale': { speaker: 'Graham', text: "Toby isn't on the membership list yet. Strictly speaking, that game is unofficial." },
  c1: { speaker: 'Graham', text: 'Reminder: subs are due. Not now. After.' },
  c2: { speaker: 'Marjorie', text: 'Dex is filming again. Try not to be in it.' },
  c3: { speaker: 'Neil', text: "Junior night Thursday. Oscar's coach says he's ahead of schedule." },
  c4: { speaker: 'Coach Pemberton', text: "Going over Toby's game after club tonight. Anyone else's after, if there's time." },
  c5: { speaker: 'Priya', text: "Has anyone got the new edition? Chapter nine's changed." },
  c6: { speaker: 'Graham', text: "The pub want another eight pounds a night. I've done a spreadsheet." },
  // After Graham's chapter: the pencilled team sheet (favouritism, never stated).
  c7: { speaker: 'Graham', text: 'Draft league team, in pencil. Board two: Toby. Other boards to follow.' },
  cup: { speaker: 'Marjorie', text: "Knockout cup draw's up. I did the draw. It's all above board." },
  final: { speaker: 'Coach Pemberton', text: "Final's Tuesday. I'll look at yours after. Toby's had a very interesting Najdorf." },
  // The act's last beat: the ladder goes up, and Toby is already at the top.
  complete: { speaker: 'Graham', text: 'The club ladder is now up. Toby has kindly agreed to start at the top.' },
}
