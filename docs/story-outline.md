# Club Night: Story Outline (draft 5)

27 Sep 2026 · drafted by Claude, reviewed with Joseph.

Draft 5 is the honing pass on Acts 1 and 2. The aim was a story that pulls you back: a few mysteries that pay off in stages, so every few weeks something clicks into place, and each payoff opens the next question. The new section "The threads" maps them. Decisions made in this pass, for Joseph to check, are marked *(new)*.

## How the story is told

The aim is simple, sophisticated and clean: something that draws you back, which a game on Lichess doesn't.

- **Understatement.** Say less than you mean. The player works out what's going on; nobody explains it.
- **Plain observation.** Stage directions describe only what you could see across the table. They never say what it means, and they're never a punchline.
- **No narrator.** No "somehow", no "which is worse", no winks at the player.
- **Character, not jokes.** The humour comes from people being exactly themselves, played straight. That includes Terry.
- **Small and specific.** A tea urn, a scoresheet, a clock on the wall. Real club life.
- **Short.** One line per moment.
- **No em dashes, anywhere.**

## Where the story lives in the app

| Where | What | Source |
| --- | --- | --- |
| Before and after games | One line from your opponent. Story weeks have their own lines, which take priority | `content/dialogue.csv` (flags `kind:` and `chapter:`) |
| During games | Only reactions to the board: your blunder, a strong move, a capture, check. At most two a game | `content/dialogue.csv` |
| Home, under the week | The week's note to start with, then "Around the club · Tuesday" and "· Thursday": one line each, seen or overheard | `src/data/act1.ts`, `act2.ts`, `weekStory.ts` |
| After you win Saturday's best of three | "On the way out": two or three lines that close the week and open the next question | `src/data/weekStory.ts` |
| Every fourth week, and each act's end | A cutscene: one drawn place, three to five lines, tap through, skippable | `src/data/cutscenes.ts`, `src/components/SceneArt.tsx` |
| The club calendar | Every week of the season, and "Moments" to watch again | |

There are no act numbers on screen. The seasons simply carry on: Week 17 follows cup week, and Month 5 follows Month 4.

## The threads *(new)*

Each thread is planted early, pays off part-way, and leaves one question for later. No thread is ever explained by a narrator; the player puts it together.

| Thread | Planted | Pays off | Still open |
| --- | --- | --- | --- |
| **Vera Hart** | Trial night: the honours board stops at V. Hart. Week 1: in the cupboard, a scoresheet, Hart against Pemberton. Hart won | Week 9: the 1998 county team, Vera on top board. Week 12: the photo found face down in the cupboard. Month 3: the honours board reads Pemberton six years, then Hart ten, then nothing. "She beat everyone. That was the trouble." Cup: your name, in gold, under hers | Why she stopped coming (Act 3: she was his wife) |
| **The coach and Toby** | Trial night: the coach watches your game from behind Toby's chair, and says "Tuesday, then" only to Toby. Week 3: Toby's name is on the list before trial night | Week 14: the county arbiter and Toby "go back a long way". Act 2, week 27: Dex finds a county junior prize-giving photo, Pemberton's hand on the boy's shoulder. "He's never been new." | Why Pemberton brought him to Wexley at all |
| **Oscar** | Week 4: he wants to go over his game with you, not Pemberton | Week 7: Toby's name is already next to his on the junior rota. Week 11: he sits next to you at coaching. Cup: he asks for your scoresheet | Act 2: Toby arranges Pemberton's lessons for him; Kingsbridge asks about him. The split: he sets up a board and waits for you |
| **The study** | Week 11: Toby asks for your games, "for the study" | Act 2, week 25: the study arrives, built from your real games in Pemberton's words, signed "P." Its last chapter: "Be friendly. They play worse when they like you." | Toby, at the ladder final: "I think I sent you the wrong one. Silly me." |
| **The green coat** *(new)* | Act 2, Castlebury: a woman at the back watches Pemberton, not the chess, and leaves before the end | The split, the last line of Act 2: at ten to eight, the door goes. Someone in a green coat | Act 3 opens on her |
| **The club's money and room** | Week 10: eight pounds more a night | Act 2: solvent until March; the pub gives notice; St Anne's, damp, free on Tuesdays | Act 3: the move |
| **Dex's stream** | Week 2: your voice from his phone | Twelve viewers, then forty-one for the final, then two hundred, then new faces at the door | He stops streaming Wexley once he finds out about Toby |

**The cup's history** *(new)*: the knockout cup is the club's honour. Pemberton won it six years running, then Vera won it ten years running, and it hasn't been held since 2009. Graham revives it in week 9. Winning it puts your name on the board after hers.

**Toby** *(new)*: a former county junior that Pemberton coached. Nothing about him is a lie, exactly. He did join the same night as you.

## The acts at a glance

| Act | Setting | The story | Ends with |
| --- | --- | --- | --- |
| 1: Club nights *(built)* | Trial night, then sixteen weeks learning the ropes | You and Toby both join. He beats you easily on the first night and everyone likes him. The club is short of money and members. | The knockout cup final: Toby. Then the ladder goes up, Toby's name already at the top |
| 2: The club ladder *(built)* | Ladder challenges and the league team, over another sixteen weeks | Toby is made captain. Dex's stream is found out and brings new faces. Toby sends you the wrong study. The pub wants the room back. | The top of the ladder: Toby. Then **the split**: Toby and Pemberton leave for Kingsbridge |
| 3: Vera *(outline)* | Rebuilding; the county league | Vera Hart arrives and becomes the coach. She was Pemberton's wife. New members arrive; Kingsbridge beats everyone. | The county championship final: Wexley against Kingsbridge. You play Toby |
| 4: The tour *(outline)* | The club abroad, country by country | From somewhere nobody thinks of for chess to the strongest chess countries. | A real last game against Toby, then his excuses |

## Act 1: Club nights (as built)

**Trial night.** Marjorie introduces you around; Graham takes your name. Four placement games (Marjorie, Dex, Graham, Clive), with names only and no ratings. Then Toby, also new, asks for a quick game "just for fun". He plays at full strength and wins easily. "Beginner's luck, honestly." The honours board says V. Hart, year after year, then stops. *Cutscene (new): closing time. Everyone likes Toby already. The coach watched your game from behind Toby's chair; Marjorie: "Don't call him Coach, he likes it too much." At the door he shakes Toby's hand: "Tuesday, then."*

**The week, every week:**

- **Tuesday:** warm-ups from your own games, the lesson, and a coached game with Pemberton. Sometimes he announces a trap first.
- **Thursday:** three practice games.
- **Saturday:** a best of three against the week's person.

Seven story weeks each introduce someone. The club weeks between them are ordinary weeks with people you already know.

| Week | Who | Saturday's way out, and the hook |
| --- | --- | --- |
| 1 | Marjorie | She gives you the cupboard key. A scoresheet: Hart against Pemberton. Hart won |
| 2 | Dex | "Don't clip that." Your own voice, coming from his phone |
| 3 | Marjorie | Graham types you onto the list. Toby's name is above yours, dated before trial night |
| 4 | Oscar | "He'll want a rematch." Oscar wants to go over it with you, not Pemberton. *Cutscene: Pemberton's chair* |
| 5 | Dex | "Eleven viewers. Twelve when you play." One of them is Toby |
| 6 | Clive | "Board one. When there was a proper board one." A clean rectangle where a photo hung |
| 7 | Oscar | Neil asks you to help at junior night. There's already a name next to Oscar's on the rota: Toby |
| 8 | Priya | "What do you do when the book runs out?" Toby looks up. *Cutscene: Dex in the car park* |
| 9 | Clive | The 1998 team won the county. "So did Vera. Top board." |
| 10 | Graham | Your win, recorded formally. A draft team sheet in pencil: board two, Toby |
| 11 | Priya | "Next time I'll have something for that." Toby asks for your games, for the study |
| 12 | Marjorie | The 1998 photo, face down behind the scoresheets. "That's Vera. She just stopped coming. Ask Bill." *Cutscene: the photo rehung; the honours board, Pemberton then Hart; "She beat everyone. That was the trouble."* |
| 13 | Toby | "Good game! Want to go over it?" A two-line scouting report. (Thursday: he lends you his Caro-Kann book. He plays the Najdorf.) |
| 14 | Graham | The draw, "in the proper manner". You and Toby in opposite halves. (Thursday: the county arbiter and Toby go back a long way.) |
| 15 | Dex | "Forty-one now. Don't be rubbish." |
| 16 | The cup | Clive, Oscar, Priya, then Toby, each with a line of their own. *Cutscene (new): Bill with gold paint, your name under V. Hart; Oscar asks for your scoresheet; Pemberton stops at the board, only for a moment. Then the ladder: one name already typed at the top* |

**The favouritism** is obvious by the end of the act and never said out loud. On its own, each moment can be explained away:

- Pemberton watches Toby's trial game, not yours.
- His example positions come "from a member".
- His Tuesdays are taken.
- "I'll look at yours after." He doesn't.
- Toby is pencilled in on board two.
- The scouting report on Toby is two lines long.

## Act 2: The club ladder (as built)

The ladder goes up the week after the cup, with Toby at the top. Pemberton makes him captain. Saturdays are now **ladder challenges**: the person just above you, or someone below challenging you. Each story week's person is set just above you, so Saturday is a real climb. The fixed members (Marjorie, Clive, Graham, Ray, Malcolm) stay where trial night put them, and you climb past them for good. Toby stays ahead of you all season.

New to the cast as opponents: **Ray**, who teaches the juniors, is tired by nine o'clock and never beats himself. **Malcolm**, board one, hardly speaks and never offers a draw.

| Week | Title | Who | Tuesday / Thursday | Saturday's way out, and the hook |
| --- | --- | --- | --- | --- |
| 17 | The ladder goes up | Graham | The ladder, Toby on top: "It saves time" / eleven rules, and a part (b) | "Challenge upheld. Formally." The team: Toby captain, you first reserve |
| 18 | Captain | Priya | Toby takes the juniors' warm-up / Priya's notes, one copy for you | "I've started a notebook on you." First fixture: Castlebury, at home |
| 19 | Subs, again | Clive | A receipt book / Clive challenges you | "We used to beat Castlebury." Castlebury win, three to one. The room is "charming" |
| 20 | Board four | Ray | Ray late: junior night / Ray watching, arms folded | "You'll do." Pemberton will think about it. *Cutscene: the team sheet, your name added in someone else's hand* |
| 21 | The Terry | Terry | Terry asks for coaching; Tuesdays taken / "It has a name now" | "The Terry. It needs work." Dex: "Did you see the numbers?" |
| 22 | Going live | Dex | Graham finds the stream / two hundred watched the cup final | "Don't make it a thing." Three new faces at the door |
| 23 | New faces | Marjorie | Tea for eleven, cups borrowed / the second room's lights on | "We used to have eleven." The subs tin, still short |
| 24 | Away at Castlebury | Oscar | Pemberton finally coaches Oscar: Toby arranged it / two inches and a hundred points | "He's on the team. Board four." You're first reserve again. *Cutscene: Castlebury's hall; a woman in a green coat watches Pemberton (new)* |
| 25 | Notes | Priya | Pemberton goes through Toby's game all session / Toby asked Priya for your games | "He asked very nicely." Toby: "Sending you my study, mate." *Then the study itself opens (new)* |
| 26 | The study | Malcolm | Pemberton's coaching is very good tonight; you recognise the phrases / you try the study on yourself. It works | Malcolm: "Whoever wrote that knows your game. Use it." Nobody mentions it |
| 27 | Off air | Dex | A short coached game: a lift to catch / Dex stops streaming Wexley | *(new)* Dex: "Found something." A county junior prize-giving, Pemberton's hand on the boy's shoulder. "He's never been new." |
| 28 | Extraordinary general meeting | Graham | The rent is going up again; laminated / nine people, a motion carried | "Solvent. Until March." Toby and Pemberton left early. *Cutscene: the kitchen* |
| 29 | Kingsbridge | Oscar | A Kingsbridge card on the board / Toby's car in their car park | Kingsbridge asked about Oscar. Neil hasn't said no |
| 30 | Notice | Clive | The pub wants the room back / Clive has a list of church halls | "St Anne's. Damp, but free on Tuesdays." Tuesdays won't suit Pemberton |
| 31 | One rung left | Terry | Pemberton came from Kingsbridge / Terry enters you "as moral support" | "Whatever happens, the king walked." |
| 32 | Top of the ladder | Priya, Malcolm, then Toby | Toby: "Did the study help? I think I sent you the wrong one. Silly me." | *Cutscene, the split: a week later. Pemberton's chair isn't there. "Kingsbridge. Both of them. Lovely hall, apparently." Nobody sets up the second room; Oscar sets up a board in this one and waits for you. At ten to eight, the door goes. Someone in a green coat.* |

**The study** (week 25 to 26) is the act's turn. It's the wrong study, sent to you: Pemberton's notes on how to beat you, prepared for Toby. *Built (new):* it opens as a document, "Prep: {name}", in four chapters written from your real games: the openings you play most and how you score in them, the mistake that turns up in the most games, the part of the game where you're weakest, and "On the night: Be friendly. Offer to go over games. They play worse when they like you." Signed "Keep this to yourself. P." It's the most useful thing anyone has told you, and it's a betrayal. It can be read again from the calendar.

**Coming back after a few days** *(new)*: Home shows "Last time" and the last line of the story you saw, until you play.

**Act 2 lessons** follow the learning plan:

- Openings as Black, against 1.e4 and 1.d4.
- Defence first.
- Key squares, and holding a draw a pawn down (the opposition, and the Philidor for stronger players).
- The ideas behind tactics: in-between moves, luring a piece in, x-rays, clearance, zugzwang, passed pawns, mate in three, the smothered mate.

## Act 3: Vera (outline, for later)

- **She arrives** on a Tuesday, the week after the split, and sits in Pemberton's chair without comment. V. Hart from the honours board.
- **She becomes the coach.** Warm but spare, exacting about the right things: "Good. Now tell me why." Her "are you sure?" is gentler and rarer. The coach's lines are kept per coach in the code, so she slots in.
- **The twist:** she was Pemberton's wife. It's revealed sideways, for example by Bill: "She beat him in the cup final, the year they got married. He didn't come for a month." Nobody says "divorce".
- **The club moves** to St Anne's (damp, free on Tuesdays).
- **The league season:** Wexley against other clubs, each with its own character and way of playing. Kingsbridge beats everyone by a lot. Somewhere in the season you play Pemberton himself, for Kingsbridge, at full strength. He doesn't coach you. That's the point.
- **The end:** the county championship final, Wexley against Kingsbridge. You play Toby. Vera sits on your side of the room, mirroring Pemberton at the Act 1 cup final.

### Act 3 week by week *(new, draft for Joseph)*

**The backstory, as the player pieces it together.** Pemberton won the cup six years running. In 2000 Vera beat him in the final (the scoresheet in the cupboard), and they married that year. She won the cup for ten years. In 2009, as captain, he put her on board two for the county final against Kingsbridge. Wexley lost, she never came back, and nobody held the cup again. Nobody tells the player this in one go; Bill gives the first half, Clive the second.

**Saturdays become league matches** against other clubs, each with one new character on your board, and a few club weeks in between. That brings new faces, which was open question 2.

**The other clubs:**

- **Castlebury**: Hugh, a retired solicitor. Queen's Gambit, courteous, relentless.
- **Denholme Miners' Welfare**: Shaz. Plays fast, plays blitz after, "Clock's running, love."
- **St Barnabas**: the Reverend Lowe. King's Indian, surprisingly vicious.
- **The University**: Kasia. A PhD student, all theory and no small talk. She plays the Najdorf, like Toby.
- **Kingsbridge**: Pemberton, Toby, and a junior squad in matching jumpers.

| Week | Title | Who | Tuesday / Thursday | Saturday's way out, and the hook |
| --- | --- | --- | --- | --- |
| 33 | Green coat | Marjorie | Vera sits in Pemberton's chair and watches your warm-ups. "Good. Now tell me why." / She asks Graham for the fixture list | She stops at the honours board, at your name under hers. "Hm." |
| 34 | Last night at the Red Lion | Clive | Vera lets you find things / Clive unscrews the honours board. "It's ours. I checked." | Marjorie turns the lights off. Graham's last notice, laminated: "Moved." *Cutscene: the empty back room* |
| 35 | St Anne's | Graham | Damp; the urn works on Tuesdays / Dex streams "new venue content" | Vera pins up the team. Board one: Malcolm. Board two: you. "Board two. Don't let anyone tell you it's a demotion." |
| 36 | Castlebury | Hugh | Vera scouts Hugh in one sentence / Priya copies it into her notebook | Hugh, at St Anne's: "Charming. Is that damp?" Wexley win. First league win in years |
| 37 | Why | Priya | "Now tell me why." Priya loves it / Priya's notebook is now mostly Vera | Bill: "She beat him in the cup final, the year they got married. He didn't come for a month." *Cutscene: Bill and the photo* |
| 38 | Denholme | Shaz | A cash bar and a jukebox / Dex streams it; three hundred watch | Shaz: "Come back when you're quicker." A Kingsbridge result in the paper: four nil, again |
| 39 | Oscar | Oscar | Kingsbridge ask about Oscar again / Neil says it's Oscar's decision | Oscar, first thing he's ever said to you unprompted: "I said no." |
| 40 | St Barnabas | the Reverend | The tea is better than ours / The Reverend's King's Indian | "I'll pray for you. After the ending." Kingsbridge have asked to host the county final |
| 41 | Board two | Malcolm | Vera and Malcolm talk quietly about 2009 / Clive, to nobody: "County final, 2009. He put her on board two. She never came back." | Vera hangs the honours board at St Anne's. "It's crooked." It isn't. *Cutscene* |
| 42 | The University | Kasia | Kasia sends her team list with opening preferences / Vera: "Take her out of book early. She hates it." | "You're out of book at move nine. So am I, apparently." Semi-final booked |
| 43 | Kingsbridge | Pemberton | Away at Kingsbridge: lovely hall / Pemberton is on your board. He doesn't coach | He shakes your hand. "You've been taught well." He looks across the room at Vera. She's looking at your board. *Cutscene: the Kingsbridge hall* |
| 44 | Juniors | Oscar | Kingsbridge juniors, matching jumpers / Oscar wins board one | Neil hangs Oscar's scoresheet on the fridge. He tells you so twice |
| 45 | The draw | Graham | The final draw "in the proper manner" / Kingsbridge in the final. Of course | Vera's team sheet. Board one: you. Malcolm: "Past time." |
| 46 | Board one | Toby | Toby sends a card. "Can't wait, mate!" / Vera: "He'll do. Board three." | Toby is board one for Kingsbridge. |
| 47 | The night before | Terry | Terry has prepared something for the final. For moral support / Vera: "Is the urn still broken?" | Marjorie gets the good set out. "For luck. It's never been lucky." |
| 48 | The county final | Hugh, Kasia, then Toby | | Vera sits on your side of the room, as Pemberton sat on Toby's. *Cutscene, after: the county trophy on the table at St Anne's. The last time it came to Wexley, she was holding it. Someone fetches a camera. Then a letter from the Bermuda Chess Association.* |

**The thread payoffs in Act 3:** Vera (arrives, coaches, the marriage, 2009, the county trophy); the team place (board two, then board one); Oscar ("I said no."); the honours board (moved to St Anne's, rehung "crooked"); Pemberton (a full-strength game, then "You've been taught well."); Toby (board one for Kingsbridge, then the final); the new team photo, in the same rectangle.

**Characters to build for Act 3:** Vera as coach (her lessons, warm-ups, coached game and "are you sure?"), Hugh, Shaz, the Reverend Lowe and Kasia as opponents (portraits, styles, opening books, dialogue), and Pemberton as an opponent at full strength.

## Act 4: The tour (outline, for later)

- The club goes touring as a team. Each stop is a small arc: a local club, its characters, a match.
- The countries get stronger as you go. It starts somewhere nobody thinks of for chess (Bermuda, say) and ends among the strongest (for example Uzbekistan, the USA, and the traditional chess powers).
- Local characters are warm and specific, never national stereotypes. They're funny the way the Wexley cast is: by being exactly themselves.
- It ends with a real last game against Toby, and his excuses.

## How long it runs

Each act is a season of sixteen weeks, and each week is seven or eight games plus a lesson. That's about 120 games an act: 20 to 30 hours of chess. Four acts is 80 to 120 hours, so no extra act is needed. Act 4's tour can run as long as it's fun, since stops are easy to add.

## Decisions made in draft 5, for Joseph to check

1. **The study's contents** are built from your real games (it was open question 1).
2. **Vera is glimpsed** once in Act 2, at Castlebury, as a woman in a green coat, and Act 2 ends as she walks in. The act ends on a cliffhanger, which also carries players over while Act 3 is being built (it was open question 4).
3. **Pemberton held the cup before Vera**, six years, and she took it from him. The honours board shows it without anyone saying so.
4. **Toby is a former county junior Pemberton coached.** Revealed in week 27 by Dex, with a photo.
5. **The team place** (first reserve all of Act 2) is left unresolved on purpose: in Act 3, Vera picks you for board one.

## Still open

1. **Losing at the top.** Losing the Act 2 final to Toby sends you back two rungs to climb again, as the cup did. Is that right for a ladder, or should you simply get another go the following week?
2. **Where Act 2's Saturdays sit.** They are currently all ladder challenges. Should a few be league matches against other clubs, which would bring new faces before Act 3?
