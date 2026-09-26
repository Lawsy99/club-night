// The club noticeboard on Home: one line from a member about what's coming
// up, in their voice (Character Tone Guide; story outline draft 3). Keyed by
// where the player is on the path. Understated: the player joins the dots.

export type Notice = { speaker: string; text: string }

export const NOTICEBOARD: Record<string, Notice> = {
  trial: { speaker: 'Marjorie', text: "New members' night. Tea's fifty pence. Graham will want your name spelt properly." },
  // Halfway through trial night: the first sign of Vera (the honours board).
  'trial-honours': { speaker: 'Marjorie', text: 'That’s the honours board. V. Hart, mostly, for a good while. Board two. Honestly. Thirty years.' },
  // Before Toby's game at the end of trial night.
  'trial-finale': { speaker: 'Graham', text: "Toby isn't on the membership list yet. Strictly speaking, that game is unofficial." },
  c1: { speaker: 'Graham', text: 'Reminder: subs are due. Not now. After.' },
  c2: { speaker: 'Graham', text: 'Filming on club nights requires the committee’s permission. Forms are available. From me.' },
  w3: { speaker: 'Sheila', text: 'Raffle tickets on the side. Top prize is a bottle of something.' },
  c3: { speaker: 'Neil', text: "Junior night Thursday. Ray says Oscar's ahead of schedule. We'd prefer Mr Pemberton." },
  w5: { speaker: 'Graham', text: 'The committee has approved one camera, on a trial basis. The committee is me.' },
  w7: { speaker: 'Ray', text: 'Junior night will run late on Thursday. Please keep the big room clear.' },
  w9: { speaker: 'Bill', text: 'Anyone for a game on Tuesday? I’ll be in from seven, as usual.' },
  w11: { speaker: 'Priya', text: 'Chapter nine: I was right. Page 214, if anyone wants to check.' },
  w12: { speaker: 'Graham', text: 'General meeting, Tuesday, half past seven. Agenda attached. Tea from Marjorie.' },
  w14: { speaker: 'Graham', text: 'Minutes of the general meeting are up. Item four: the urn.' },
  w15: { speaker: 'Marjorie', text: 'Cup draw goes up on Saturday. I’m doing the draw again. Nobody else offered.' },
  // (Background members appear here and in passing lines, never labelled.)
  c4: { speaker: 'Coach Pemberton', text: "Going over Toby's game after club tonight. Anyone else's after, if there's time." },
  c5: { speaker: 'Priya', text: "Has anyone got the new edition? Chapter nine's changed." },
  c6: { speaker: 'Graham', text: "The pub want another eight pounds a night. I've done a spreadsheet." },
  // After Graham's chapter: the pencilled team sheet (favouritism, never stated).
  c7: { speaker: 'Graham', text: 'Draft league team, in pencil. Board two: Toby. Other boards to follow.' },
  cup: { speaker: 'Marjorie', text: "Knockout cup draw's up. I did the draw. Malcolm sends his apologies. He always does." },
  final: { speaker: 'Coach Pemberton', text: "Final's Saturday. I'll look at yours after. Toby's had a very interesting Najdorf." },
  // The act's last beat: the ladder goes up, and Toby is already at the top.
  complete: { speaker: 'Graham', text: 'The club ladder is now up. Toby has kindly agreed to start at the top.' },
}
