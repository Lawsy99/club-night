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
      { text: 'Inside, a box of old scoresheets. The top one is Hart against Pemberton. Hart won.' },
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
      { text: 'On the junior night rota, there’s already a name next to Oscar’s. Toby.' },
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
    tuesday: 'Graham announces the knockout cup. The first since 2009.',
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
    tuesday: 'Oscar has started coming to Tuesday coaching. He sits next to you, not at the front.',
    thursday: 'Priya has changed her openings. Your name is at the top of her notes.',
    wayOut: [
      { who: 'priya', text: 'Next time I’ll have something for that.' },
      { text: 'At the door, Toby asks if he could have your games. For the study.' },
    ],
  },
  w12: {
    tuesday: 'The general meeting. Graham reads the accounts. Nobody asks a question.',
    thursday: 'Bill is talking about 1998 to anyone near the urn.',
    wayOut: [
      { text: 'Behind the box of scoresheets in the cupboard, a frame, face down. The 1998 team.' },
      { text: 'Clive, with hair. On top board, holding the county trophy and not smiling: V. Hart.' },
      { who: 'marjorie', text: 'That’s Vera. She just stopped coming. Ask Bill.' },
    ],
  },
  c7: {
    tuesday: 'Pemberton is late for coaching. He was with Toby.',
    thursday: 'Toby lends you his book on the Caro-Kann. He’s written in the margins. He plays the Najdorf.',
    wayOut: [
      { who: 'toby', text: 'Good game! Want to go over it?' },
      { text: 'Pemberton’s scouting report on Toby is on the table. It’s two lines long.' },
    ],
  },
  w14: {
    tuesday: 'Graham explains the cup rules. It takes most of the evening. Terry enters during rule six.',
    thursday: 'The county arbiter comes to oversee the draw. He and Toby seem to go back a long way.',
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

  // --- Act 2: the club ladder (docs/story-outline.md, "Act 2 in detail") ---
  'a2-1': {
    tuesday: 'Pemberton has pinned up the ladder. Toby’s name is at the top. “It saves time.”',
    thursday: 'Graham reads out the ladder rules. There are eleven. Rule seven has a part (b).',
    wayOut: [
      { who: 'graham', text: 'Challenge upheld. Formally.' },
      { text: 'Pemberton reads out the league team. Captain: Toby. You’re first reserve.' },
    ],
  },
  'a2-2': {
    tuesday: 'Toby takes the juniors’ warm-up. Pemberton watches him, not them.',
    thursday: 'Priya brings two copies of her notes. One is for you.',
    wayOut: [
      { who: 'priya', text: 'I’ve started a notebook on you. It’s a compliment.' },
      { text: 'Toby pins up the team’s first fixture: Castlebury, at home.' },
    ],
  },
  'a2-3': {
    tuesday: 'Graham collects subs with a receipt book. He writes each one out in full.',
    thursday: 'Clive challenges you. “It’s in the rules, apparently.”',
    wayOut: [
      { who: 'clive', text: 'Castlebury. We used to beat Castlebury.' },
      { text: 'Castlebury win, three to one. On the way out, they say the room is charming.' },
    ],
  },
  'a2-4': {
    tuesday: 'Ray is late for coaching. Junior night overran again.',
    thursday: 'Ray watches your practice games, arms folded. Not unkindly.',
    wayOut: [
      { who: 'ray', text: 'You’ll do. I’ll tell Pemberton you’re ready for board four.' },
      { text: 'Pemberton says he’ll think about it.' },
    ],
  },
  'a2-5': {
    tuesday: 'Terry asks Pemberton for some coaching. Pemberton’s Tuesdays are taken.',
    thursday: 'Terry has prepared something for you. It has a name now.',
    wayOut: [
      { who: 'terry', text: 'The Terry. It needs work.' },
      { text: 'Dex, packing up: “Did you see the numbers?” He doesn’t say which numbers.' },
    ],
  },
  'a2-6': {
    tuesday: 'Graham has found the stream. There is to be a meeting about it.',
    thursday: 'Dex, very quietly: two hundred people watched the cup final.',
    wayOut: [
      { who: 'dex', text: 'Don’t make it a thing.' },
      { text: 'On Thursday there are three new faces at the door. One of them says she saw it online.' },
    ],
  },
  'a2-7': {
    tuesday: 'Marjorie makes tea for eleven. She has to borrow cups from the bar.',
    thursday: 'The lights are on in the second room for the first time this year.',
    wayOut: [
      { who: 'marjorie', text: 'Eleven. We used to have eleven, you know. Every week.' },
      { text: 'Graham counts the subs tin twice. It’s still short.' },
    ],
  },
  'a2-8': {
    tuesday: 'Pemberton gives Oscar a lesson at last. Toby arranged it.',
    thursday: 'Oscar has grown two inches and a hundred points.',
    wayOut: [
      { who: 'neil', text: 'He’s on the team. Board four. He’s eleven.' },
      { text: 'You’re first reserve again.' },
    ],
  },
  'a2-9': {
    tuesday: 'Pemberton goes through Toby’s game from Castlebury, move by move, for the whole session.',
    thursday: 'Priya says Toby asked her for your games. She said no.',
    wayOut: [
      { who: 'priya', text: 'He asked very nicely. That’s what worried me.' },
      { text: 'A message from Toby that evening: “Sending you my study, mate. Hope it helps.”' },
    ],
  },
  'a2-10': {
    tuesday: 'Pemberton’s coaching is very good tonight. You recognise some of the phrases.',
    thursday: 'You try the study’s advice against yourself, in your head. It works.',
    wayOut: [
      { who: 'malcolm', text: 'Whoever wrote that knows your game. Use it.' },
      { text: 'Toby hasn’t mentioned the study. Neither has Pemberton.' },
    ],
  },
  'a2-11': {
    tuesday: 'Pemberton keeps your coached game short tonight. He has a lift to catch.',
    thursday: 'Dex has stopped streaming Wexley games. “Doesn’t feel right. For now.”',
    wayOut: [
      { who: 'dex', text: 'Found something. Don’t make it a thing.' },
      { text: 'A county junior prize-giving, years ago. A boy with a trophy nearly as big as he is. Pemberton’s hand on his shoulder.' },
      { who: 'dex', text: 'He’s never been new.' },
    ],
  },
  'a2-12': {
    tuesday: 'The room hire is going up again. Graham calls an extraordinary general meeting. Laminated.',
    thursday: 'Nine people come to the meeting. The motion is carried. Nobody is sure what it was.',
    wayOut: [
      { who: 'graham', text: 'The club is solvent. Until March.' },
      { text: 'Toby left the meeting early. Pemberton left just after.' },
    ],
  },
  'a2-13': {
    tuesday: 'A Kingsbridge club card is pinned to the noticeboard. Nobody admits putting it there.',
    thursday: 'Ray saw Toby’s car in the Kingsbridge car park. On a Thursday.',
    wayOut: [
      { who: 'neil', text: 'Kingsbridge asked about Oscar. Juniors, they said. Proper coaching.' },
      { text: 'Neil hasn’t said no.' },
    ],
  },
  'a2-14': {
    tuesday: 'The pub gives notice. From the spring, the back room is wanted for functions.',
    thursday: 'Clive has been looking at church halls. He has a list.',
    wayOut: [
      { who: 'clive', text: 'St Anne’s. Damp, but free on Tuesdays.' },
      { text: 'Pemberton says Tuesdays at St Anne’s won’t suit him.' },
    ],
  },
  'a2-15': {
    tuesday: 'Pemberton is late for coaching. He came from Kingsbridge.',
    thursday: 'Terry has entered you for the top of the ladder. As moral support, he says.',
    wayOut: [
      { who: 'terry', text: 'Whatever happens, the king walked.' },
      { text: 'Two rungs left. Then Toby.' },
    ],
  },
}
