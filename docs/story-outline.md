# Club Night: Story Outline (draft 4)

26 Sep 2026 · drafted by Claude, reviewed with Joseph.

Draft 4 replaces draft 3: everything decided is folded in, Act 1 is described as built, Act 2 is written in detail (and built), and Acts 3 and 4 are outlined. Open questions for Joseph are at the end.

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

## The acts at a glance

| Act | Setting | The story | Ends with |
| --- | --- | --- | --- |
| 1: Club nights *(built)* | Trial night, then sixteen weeks learning the ropes | You and Toby both join. He beats you easily on the first night and everyone likes him. The club is short of money and members. | The knockout cup final: Toby. Then the ladder goes up, Toby's name already at the top |
| 2: The club ladder *(built)* | Ladder challenges and the league team, over another sixteen weeks | Toby is made captain. Dex's stream is found out and brings new faces. Toby sends you the wrong study. The pub wants the room back. | The top of the ladder: Toby. Then **the split**: Toby and Pemberton leave for Kingsbridge |
| 3: Vera *(outline)* | Rebuilding; the county league | Vera Hart arrives and becomes the coach. She was Pemberton's wife. New members arrive; Kingsbridge beats everyone. | The county championship final: Wexley against Kingsbridge. You play Toby |
| 4: The tour *(outline)* | The club abroad, country by country | From somewhere nobody thinks of for chess to the strongest chess countries. | A real last game against Toby, then his excuses |

## Act 1: Club nights (as built)

**Trial night.** Marjorie introduces you around; Graham takes your name. Four placement games (Marjorie, Dex, Graham, Clive), with names only and no ratings. Then Toby, also new, asks for a quick game "just for fun". He plays at full strength and wins easily. "Beginner's luck, honestly." The honours board says V. Hart, year after year, then stops.

**The week, every week:**

- **Tuesday:** warm-ups from your own games, the lesson, and a coached game with Pemberton. Sometimes he announces a trap first.
- **Thursday:** three practice games.
- **Saturday:** a best of three against the week's person.

Seven story weeks each introduce someone. The club weeks between them are ordinary weeks with people you already know.

| Week | Who | Saturday's way out, and the hook |
| --- | --- | --- |
| 1 | Marjorie | She gives you the cupboard key. A scoresheet signed V. Hart |
| 2 | Dex | "Don't clip that." Your own voice, coming from his phone |
| 3 | Marjorie | Graham types you onto the list. Toby's name is above yours, dated before trial night |
| 4 | Oscar | "He'll want a rematch." Oscar wants to go over it with you, not Pemberton. *Cutscene: Pemberton's chair* |
| 5 | Dex | "Eleven viewers. Twelve when you play." One of them is Toby |
| 6 | Clive | "Board one. When there was a proper board one." A clean rectangle where a photo hung |
| 7 | Oscar | Neil asks you to help at junior night. Pemberton is running it now: Toby's idea |
| 8 | Priya | "What do you do when the book runs out?" Toby looks up. *Cutscene: Dex in the car park* |
| 9 | Clive | The 1998 team won the county. "So did Vera. Top board." |
| 10 | Graham | Your win, recorded formally. A draft team sheet in pencil: board two, Toby |
| 11 | Priya | "Next time I'll have something for that." Toby asks for your games, for the study |
| 12 | Marjorie | "She just stopped coming." "Ask Bill." *Cutscene: Bill at the honours board* |
| 13 | Toby | "Good game! Want to go over it?" A two-line scouting report |
| 14 | Graham | The draw, "in the proper manner". You and Toby in opposite halves |
| 15 | Dex | "Forty-one now. Don't be rubbish." |
| 16 | The cup | Clive, Oscar, Priya, then Toby. *Cutscene: a new sheet on the noticeboard, "Club ladder", one name already typed at the top* |

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
| 18 | Captain | Priya | Toby takes the juniors' warm-up / Priya's notes, one copy for you | "I've started a notebook on you." First fixture: away at Castlebury |
| 19 | Subs, again | Clive | A receipt book / Clive challenges you | "We used to beat Castlebury." Lost, one to three |
| 20 | Board four | Ray | Ray late: junior night / Ray watching, arms folded | "You'll do." Pemberton will think about it. *Cutscene: the team sheet, your name added in someone else's hand* |
| 21 | The Terry | Terry | Terry asks for coaching; Tuesdays taken / "It has a name now" | "The Terry. It needs work." Dex: "Did you see the numbers?" |
| 22 | Going live | Dex | Graham finds the stream / two hundred watched the cup final | "Don't make it a thing." Three new faces at the door |
| 23 | New faces | Marjorie | Tea for eleven, cups borrowed / the second room's lights on | "We used to have eleven." The subs tin, still short |
| 24 | The first league match | Oscar | Pemberton finally coaches Oscar: Toby arranged it / two inches and a hundred points | "He's on the team. Board four." You're first reserve again. *Cutscene: Castlebury's hall* |
| 25 | Notes | Priya | Pemberton goes through Toby's game all session / Toby asked Priya for your games | "He asked very nicely." Toby: "Sending you my study, mate." |
| 26 | The study | Malcolm | "Prep: {name}", in Pemberton's words / it's all there, and it's right | Malcolm: "Whoever wrote that knows your game. Use it." Nobody mentions it |
| 27 | Off air | Dex | A short coached game: a lift to catch / Dex stops streaming Wexley | "You're better than the study says." The rent is going up again |
| 28 | Extraordinary general meeting | Graham | Laminated / nine people, a motion carried | "Solvent. Until March." Toby and Pemberton left early. *Cutscene: the kitchen* |
| 29 | Kingsbridge | Oscar | A Kingsbridge card on the board / Toby's car in their car park | Kingsbridge asked about Oscar. Neil hasn't said no |
| 30 | Notice | Clive | The pub wants the room back / Clive has a list of church halls | "St Anne's. Damp, but free on Tuesdays." Tuesdays won't suit Pemberton |
| 31 | One rung left | Terry | Pemberton came from Kingsbridge / Terry enters you "as moral support" | "Whatever happens, the king walked." |
| 32 | Top of the ladder | Priya, Malcolm, then Toby | | *Cutscene, the split: a week later. Pemberton's chair isn't there. "Kingsbridge. Both of them. Lovely hall, apparently." Nobody sets up the second room.* |

**The study** (week 26) is the act's turn. It's the wrong study, sent to you: Pemberton's notes on how to beat you, prepared for Toby. The notes are about your real weaknesses, so the study is useful as well as a betrayal. *Not yet built:* making its contents come from your actual games. The rival system already finds your weakest opening, so the study screen could show it in Pemberton's words.

**Act 2 lessons** follow the learning plan:

- Openings as Black, against 1.e4 and 1.d4.
- Defence first.
- Key squares, and holding a draw a pawn down (the opposition, and the Philidor for stronger players).
- The ideas behind tactics: in-between moves, luring a piece in, x-rays, clearance, zugzwang, passed pawns, mate in three, the smothered mate.

## Act 3: Vera (outline, for later)

- **She arrives** on a Tuesday, the week after the split, and sits in Pemberton's chair without comment. V. Hart from the honours board.
- **She becomes the coach.** Warm but spare, exacting about the right things: "Good. Now tell me why." Her "are you sure?" is gentler and rarer. The coach's lines are kept per coach in the code, so she slots in.
- **The twist:** she was Pemberton's wife. It's revealed sideways, for example by Bill: "She beat him in the club final, the year they got married. He didn't come for a month." Nobody says "divorce".
- **The club moves** to St Anne's (damp, free on Tuesdays).
- **The league season:** Wexley against other clubs, each with its own character and way of playing. Kingsbridge beats everyone by a lot. Somewhere in the season you play Pemberton himself, for Kingsbridge, at full strength. He doesn't coach you. That's the point.
- **The end:** the county championship final, Wexley against Kingsbridge. You play Toby. Vera sits on your side of the room, mirroring Pemberton at the Act 1 cup final.

## Act 4: The tour (outline, for later)

- The club goes touring as a team. Each stop is a small arc: a local club, its characters, a match.
- The countries get stronger as you go. It starts somewhere nobody thinks of for chess (Bermuda, say) and ends among the strongest (for example Uzbekistan, the USA, and the traditional chess powers).
- Local characters are warm and specific, never national stereotypes. They're funny the way the Wexley cast is: by being exactly themselves.
- It ends with a real last game against Toby, and his excuses.

## How long it runs

Each act is a season of sixteen weeks, and each week is seven or eight games plus a lesson. That's about 120 games an act: 20 to 30 hours of chess. Four acts is 80 to 120 hours, so no extra act is needed. Act 4's tour can run as long as it's fun, since stops are easy to add.

## Open questions for Joseph

1. **The study's contents.** Should the week-26 study show your actual weakest opening and habits, in Pemberton's words? It would make the betrayal personal, and useful.
2. **Losing at the top.** Losing the Act 2 final to Toby sends you back two rungs to climb again, as the cup did. Is that right for a ladder, or should you simply get another go the following week?
3. **Where Act 2's Saturdays sit.** They are currently all ladder challenges. Should a few be league matches against other clubs, which would bring new faces before Act 3?
4. **Vera's first appearance.** Is Tuesday of week 33 right, with no fanfare? Or should she be glimpsed once in Act 2, for example watching a Castlebury match?
