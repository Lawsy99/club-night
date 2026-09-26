# Club Night: the learning plan (draft 1, Sep 2026)

**Built so far (26 Sep 2026):**

- **Opening lessons first.** Week 1 is "How to start a game" (the Italian) and week 3 is the London. Pemberton demonstrates each, then you play White while he varies Black's replies, and wrong moves get the principle they break. From 1600, these lessons can be skipped.
- **Finishing lessons.** You play a won ending out against the engine, with the position chosen by your rating:
  - Week 5: a lone king (two rooks, a queen, or a rook).
  - Week 9: king and pawn.
  - Week 14: rook endings, including the Lucena.
- **Coach traps.** About one Tuesday in three, Pemberton announces a trap and plays it; see `data/coachScenarios.ts`.
- **Coach explanations.** They now say what a move does: stops a threat, pins, attacks, opens a file, and so on (`logic/moveIdeas.ts`).
- **Warm-ups include missed chances.**

**Still to build from this plan:**

- Explanations banded by rating for the tactics lessons.
- Converting and defending drills.
- Guess the move.
- Pawn-structure lessons.
- Pemberton's monthly test.

Joseph's brief: the learning is what sets Club Night apart from Lichess. You don't just play and maybe review; there's structure, as at a real club. It has to be real, useful chess, and work for a player rated 500 and one rated 2500. It has to scale without the coach talking too much, and the focus is always playing chess.

## What we already have

| Piece | What it does | Scales with rating? |
| --- | --- | --- |
| Review after every game | Your biggest moments, retried, with Pemberton explaining the best move and what went wrong | Yes: it's your own games |
| Tuesday warm-ups | Three older positions from your games: mistakes and missed chances, each seen once | Yes: your own games |
| Lessons | One theme a week (forks, pins, trapped pieces…), a worked example, then puzzles on that theme from the Lichess database, checked against the week's opening | Partly: the puzzles follow your puzzle rating, but the explanation and example are the same for everyone |
| Coached game | Pemberton at your level: three hints in words, "are you sure?", comments on mistakes | Yes: he plays at your rating |
| Scouting reports | What the opponent plays, and how to meet it | Partly: the advice is the same at every level |

That already covers the two things strong coaches agree matter most: **tactics from your own games**, and **playing serious games and going through them afterwards**.

## What's missing

Below are skills that serious training programmes treat as core and that we don't yet train on purpose. They include the Steps Method (the Dutch club curriculum), Yusupov's graded course, Dvoretsky's school, Dan Heisman's "thinking process" work, the Woodpecker Method, and Silman's endgame course. Silman's course is organised by rating class, which is exactly our problem.

1. **Endgames.** The biggest gap. We have no endgame training at all, yet it's the most "learnable" part of chess. It's also the easiest to scale, because every level has its own must-know endings:
   - **500:** mating with a king and queen, or a king and rook.
   - **1200:** the opposition in king and pawn endings.
   - **1600:** the Lucena and Philidor positions.
   - **2000:** rook endings with more pawns.
   - **2400:** opposite-coloured bishops, and the principle of two weaknesses.

   Each one can be drilled by playing it out against the engine, and it's easy to check: did you win or draw it?
2. **A thinking habit ("blunder check").** Most games under 1800 are lost to one-move oversights. Heisman's point is that the fix is a habit before every move, rather than more knowledge: what did their move threaten, then checks, captures and threats. Pemberton already says this. We could train it in the coached game, where the "are you sure?" moment is exactly this habit, and track it: how often you blundered a piece this month compared with last month.
3. **Converting a winning position, and defending a losing one.** Club players throw away won games constantly. The drill is "you're a piece up: win it" (and the reverse, "you're worse: hold it") against the engine at a level just above yours. It's scalable, engine-checked, and very close to real chess.
4. **Calculation and visualisation.** Seeing two or three moves ahead without moving the pieces. It can be trained lightly with puzzles where the board doesn't move until you've entered the whole line, which the Lichess puzzles support, since each has a full solution.
5. **Strategy: pawn structures and plans.** "What do you do when the book runs out?" (Priya's question). The classic club teaching is by pawn structure: the isolated queen's pawn, the Carlsbad structure and its minority attack, the French chain, the King's Indian. For each there's a plan for each side. Structures can be spotted automatically in real games, so lessons can come from positions you actually reach.
6. **Guess the move.** The oldest club exercise: play through a strong game, and guess each move before it's shown. The engine scores each guess against the best move, so it scales naturally. A 600 player is pleased to find a sensible move; a 2200 player is judged against the top one. The games come from the public-domain classics, played by real masters.
7. **Openings as understanding, not memory.** We now spot your usual openings. What's missing is the "why": for each opening you play, the three ideas that matter and the one trap to know. This is small, and can be written once per opening.
8. **Time.** Only relevant once clocks are on. It's worth a line in the design, but not a feature yet.

## Making it work from 500 to 2500

The rule: **the format is the same for everyone, and the content is chosen by your rating.** Nobody sees "beginner" or "advanced" labels; the material simply fits.

| Band | Who | What the week's content leans on |
| --- | --- | --- |
| Foundation (under 1000) | New players | Piece safety, one-move threats, basic mates, the opening principles |
| Club (1000 to 1500) | Most of the app's players | Two-move tactics (forks, pins, skewers), the opposition, simple plans |
| Strong club (1500 to 1900) | League players | Combinations, the Lucena and Philidor, pawn structures, converting advantages |
| Expert (1900 and up) | County players | Deep calculation, prophylaxis, complex endings, the "why" of their openings |

How each piece scales:

- **Puzzles:** these already follow your puzzle rating. Keep that.
- **Lessons:** each lesson keeps its theme but gets two or three versions of the explanation and the worked example, one per band. The Foundation fork is a knight forking king and rook. The Expert fork is a quiet move that sets up a fork three moves later. The puzzles already scale.
- **Endgame drills:** a ladder of about 30 positions from the basic mates up to rook endings, each tagged with a band. You meet the ones for your band first.
- **Coached game and warm-ups:** these already scale.
- **Guess the move:** the game is chosen to suit the band. It's simpler and more direct for lower ratings, and more positional higher up.

## The coach setting traps (Joseph's idea)

Pemberton says before or during the coached game: "I'm going to play the Fried Liver. Let's see if you know what to do." Then he plays it, and the game shows whether you got out of it.

To make it scale without him talking too much, **each scenario is data, not written dialogue:**

- **The line he plays:** a known opening trap or attacking plan, checked for legality like the opening books.
- **One line of announcement, and one line after,** depending on whether you escaped. It's checked by the engine: were you still level five moves later?
- **A rating band,** so the traps fit your level:

| Band | Example traps and plans |
| --- | --- |
| Under 800 | Scholar's mate; early queen raids |
| Around 1200 | The Fried Liver; the Légal trap; the Fishing Pole |
| Around 1600 | The Noah's Ark trap; the Englund trap; the Greek gift sacrifice |
| Around 2000 | The Marshall Attack ideas; minority-attack plans he announces and carries out |

- **Frequency:** about one Tuesday in three, so it stays a surprise.
- **Warm-ups next week:** if you fell for it, the position comes back as one of next Tuesday's warm-ups. The learning closes the loop.

Terry already plays traps sincerely on Thursdays; Pemberton would play them deliberately, and tell you. That's a neat contrast.

## Keeping the coach from talking too much

- Everything he says about the board is built from the board (as now): never guessed, never generic.
- One sentence at a time. A comment only after a real mistake, never after every move.
- Personality lives in how he puts it ("Are you sure?", "Hm."), in short lists, so it scales without new writing for every position.
- Longer teaching lives in the Tuesday lesson, which you choose to read. It's never pushed into a game.

## Suggested order to build

1. **Endgame drills**, played out against the engine. This is the biggest gap, and it's easy to check and to scale.
2. **Coach trap scenarios** in the Tuesday game. This is Joseph's idea, and it's very distinctive.
3. **Banded lesson explanations**, with two or three versions per lesson.
4. **Converting and defending drills.** These reuse the endgame drill machinery.
5. **Guess the move** with classic games.
6. **Pawn-structure lessons** from your own games.

Where each fits in the week, without adding screens:

- **Tuesday:**
  - Warm-ups.
  - The lesson, rotating between strands: tactics, endgame, opening ideas, strategy.
  - The coached game, sometimes with a trap.
- **Thursday and Saturday:** unchanged: practice and the match.
- **Once a month:** "Pemberton's test", a short mixed set across the strands, with a simple chart of how each strand is improving. It gives the learning a visible sense of progress, like the ladder does for results.
