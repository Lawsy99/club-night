// The story through each club week (Joseph, Sep 2026: "a payoff at the end
// of each week that moves things along", with little things progressing
// through the week). See docs/story-outline.md, section C.
//
// - Tuesday and Thursday: one line each, "Around the club", on Home once that
//   night's session is done. Seen or overheard; never explained.
// - Saturday: "On the way out", once you've won the best of three: two or
//   three lines that close the week and open the next question.
//
// House style: understated, plain observation, no narrator, no em dashes.

/** One line of a scene: someone speaking (their id), or a stage direction. */
export type StoryLine = { who?: string; text: string }

export type WeekStory = {
  tuesday: string
  thursday: string
  wayOut: StoryLine[]
}

export const WEEK_STORY: Record<string, WeekStory> = {
  c1: {
    tuesday: 'Pemberton’s example tonight is “from a game a member sent me”. He doesn’t say which member.',
    thursday: 'Marjorie, putting the boards out: “We used to need both rooms.”',
    wayOut: [
      { who: 'marjorie', text: 'You’ll be here Tuesdays, then. Here.' },
      { text: 'She gives you the key to the cupboard with the good sets.' },
      { text: 'Inside, a box of old scoresheets. The top one is signed V. Hart.' },
    ],
  },
  c2: {
    tuesday: 'Dex sits at the back of the coaching session, on his phone. Taking notes, he says.',
    thursday: 'A man called Terry opens with his king, and looks entirely serious about it.',
    wayOut: [
      { who: 'dex', text: 'Don’t clip that.' },
      { text: 'On your way out you hear your own voice, coming from his phone. It’s last Thursday.' },
    ],
  },
  w3: {
    tuesday: 'Pemberton says he’ll look at your game after. After, he’s with Toby.',
    thursday: 'Sheila’s raffle. First prize is a bottle of something Graham won’t name.',
    wayOut: [
      { who: 'graham', text: 'I’ve typed you up. The membership list is now fully in order.' },
      { text: 'Toby’s name is above yours. It’s dated the week before trial night.' },
    ],
  },
  c3: {
    tuesday: 'Neil asks Pemberton to coach Oscar. Pemberton’s Tuesdays are taken.',
    thursday: 'Oscar beats Ray in twenty moves, and doesn’t look up once.',
    wayOut: [
      { who: 'neil', text: 'He’ll want a rematch. He’ll want it now.' },
      { text: 'Oscar holds out his scoresheet. He wants to go over it with you. Not Pemberton.' },
    ],
  },
  w5: {
    tuesday: 'Dex asks you something about rook endings. Quietly, so nobody hears.',
    thursday: 'Dex shows you a comment under his last video. Whoever wrote it is very strong.',
    wayOut: [
      { who: 'dex', text: 'Eleven viewers. Twelve when you play.' },
      { text: 'He scrolls the list. One of the twelve is Toby.' },
    ],
  },
  c4: {
    tuesday: 'Clive comes to coaching for the first time in years. He sits at the back with his flask.',
    thursday: 'Clive offers everyone a draw at move twelve. Bill accepts.',
    wayOut: [
      { who: 'clive', text: 'Board one. When there was a proper board one.' },
      { text: 'He looks at the wall. There’s a clean rectangle where a team photo used to hang.' },
    ],
  },
  w7: {
    tuesday: 'Ray asks for the big room for junior night. Graham says he’ll table it.',
    thursday: 'The second room is full of juniors. First time in years.',
    wayOut: [
      { who: 'neil', text: 'Would you help out at junior night? He’d never ask. I’m asking.' },
      { text: 'On the rota, Pemberton is down for juniors now. Neil says it was Toby’s idea.' },
    ],
  },
  c5: {
    tuesday: 'Priya asks Pemberton about plans. He gives her the name of a book.',
    thursday: 'She has Ray’s copy. Every page is flagged.',
    wayOut: [
      { who: 'priya', text: 'What do you do when the book runs out?' },
      { text: 'She asks if you’ll go over games with her on Thursdays. Across the room, Toby looks up.' },
    ],
  },
  w9: {
    tuesday: 'Graham announces the knockout cup. Entries by the end of the month.',
    thursday: 'Clive puts his name down. “Haven’t in years.”',
    wayOut: [
      { who: 'clive', text: 'That photo. The 1998 team. We won the county.' },
      { who: 'bill', text: 'So did Vera. Top board.' },
    ],
  },
  c6: {
    tuesday: 'The pub wants eight pounds more a night. Graham has done a spreadsheet.',
    thursday: 'The spreadsheet goes round the tables. It’s been laminated.',
    wayOut: [
      { who: 'graham', text: 'Your win is recorded. Formally.' },
      { text: 'On the noticeboard, a draft league team in pencil. Board two: Toby.' },
    ],
  },
  w11: {
    tuesday: 'Priya has changed her openings.',
    thursday: 'It’s you she’s preparing for. Your name is at the top of her notes.',
    wayOut: [
      { who: 'priya', text: 'Next time I’ll have something for that.' },
      { text: 'At the door, Toby asks if he could have your games. For the study.' },
    ],
  },
  w12: {
    tuesday: 'The general meeting. Graham reads the accounts. Nobody asks a question.',
    thursday: 'Bill is talking about 1998 to anyone near the urn.',
    wayOut: [
      { who: 'marjorie', text: 'Vera? She just stopped coming. One week she was here, and then she wasn’t.' },
      { who: 'marjorie', text: 'Ask Bill. He was there.' },
    ],
  },
  c7: {
    tuesday: 'Pemberton is late for coaching. He was with Toby.',
    thursday: 'Toby sends you his Lichess study. It’s very thorough.',
    wayOut: [
      { who: 'toby', text: 'Good game! Want to go over it?' },
      { text: 'Pemberton’s scouting report on Toby is on the table. It’s two lines long.' },
    ],
  },
  w14: {
    tuesday: 'Graham explains the cup rules. It takes most of the evening.',
    thursday: 'Terry has entered the cup. So has everyone else.',
    wayOut: [
      { who: 'graham', text: 'The draw will be made in the proper manner.' },
      { text: 'You’re in the top half of the draw. Toby is in the bottom.' },
    ],
  },
  w15: {
    tuesday: 'Dex says he’s going to stream the cup final.',
    thursday: 'Forty people have said they’ll watch.',
    wayOut: [{ who: 'dex', text: 'Forty-one now. Don’t be rubbish.' }],
  },
}
