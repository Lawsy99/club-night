# Chess App — Design Document

Sep 25, 2026 · @Joseph

A chess app built like a Pokémon journey: you join a struggling local chess club, play your way through a grounded, petty, very British story, and get better at chess without it ever feeling like study. This document is the build brief for every system in the app.

## Core principles

Every feature must pass these. When in doubt, the first principle wins.

1. **Playing is the product.** Games come first. Lessons, story and reviews exist to make the next game better, and each is short.
2. **Always a next step.** The player never chooses from a menu of modes. The app always knows what comes next: a friendly, a lesson, a match, a boss. That fixed path is what free sites like Lichess can't offer.
3. **Wins are real.** Nothing is secretly made easier after a loss. Help is visible and optional, and real matches have none.
4. **Hard but never stuck for days.** Bosses should take a typical player 2 to 4 attempts. Difficulty is tuned with real win-chance maths, not guesswork.
5. **Improvement is felt, not preached.** The story is the focus. Getting better shows up quietly through rating changes, milestones and characters noticing.
6. **Authentic chess culture.** Everything should survive being read by a regular club player or serious online player. See the Character Tone Guide.
7. **Chess front and centre.** Story happens beside the board in speech bubbles, never in cutscenes, and never while the player is thinking.
8. **Honest, useful chess teaching.** Every character, opening and lesson teaches something real, and all advice is sound.

The companion document, the Character Tone Guide, covers the cast, voice rules and sample dialogue.

## Platform and tech stack

The app starts as a web app installed to the iPhone home screen, then becomes proper iOS and Android apps once it plays well. It runs fully offline, with every engine on the device.

| Part | Choice | Why |
| --- | --- | --- |
| App framework | React with TypeScript, built with Vite | Well supported, and Claude Code works well with it |
| Chess rules | chess.js | Handles legal moves, check, mate, draws. Permissive licence |
| Board | react-chessboard or cm-chessboard | Touch-friendly, permissive licences |
| Analysis engine | Stockfish (single-threaded web version) | Evaluation bar, hints, blunder warnings, reviews, low-level bots. Single-threaded because it is the most reliable version in iPhone Safari |
| Human-like engine | Maia-3, run in the browser (onnxruntime-web) | Plays like real people at a chosen rating, roughly 700 to 2500. Chosen over Maia-2 in Sep 2026: its makers recommend it for new projects, it is more accurate, and a ready-made browser version exists |
| Puzzles | A subset of the Lichess puzzle database | Public domain, tagged by theme and rating |
| Opening names | Lichess openings dataset | Public domain |
| Mistakes deck scheduling | FSRS (ts-fsrs library) | The scheduling method used by Anki |
| Saving | Browser storage on the device (IndexedDB) | No accounts or servers needed |
| Hosting | GitHub Pages | Free |
| iOS and Android apps | Capacitor | Wraps the same web app as real iOS and Android apps later, with no rewrite |

**Licensing:** Stockfish and Maia are GPL licensed. That doesn't matter for personal use. It only matters if the app is ever distributed to other people, which would mean releasing its source code.

**Performance on iPhone:** Engine work runs in the background (a web worker) so the board never freezes. Analysis depth is capped so phones stay responsive and batteries last.

**Going to the app stores:** Apple's developer programme costs about £80 a year and Google Play a one-off fee of about £20. Building the iOS version needs a Mac, or a paid cloud build service; Android builds work on any computer. Beyond that, the changes are small: app icons, a launch screen, and moving saved data into the app's own storage.

## Trial night

The first session is four placement games, framed as your first night at the club, when members get you playing a few people to see where you fit, then one last game against Toby. It also opens the story: you meet Marjorie, Dex, Graham, Clive and Coach Pemberton, and Toby turns up the same night.

### Before the games

One question: roughly how much chess have you played? The options are never, know the rules, play casually, or have an online rating. If the player has a rating, they type it in. The answer sets the first opponent's strength:

| Answer | First opponent |
| --- | --- |
| Never played | 400 |
| Know the rules | 700 |
| Play casually | 1000 |
| Have a rating | Their rating minus 100 |

Players who have never played go through a short rules walkthrough first.

### The four placement games

- All four are real games: no help, untimed, colours alternating.
- Characters speak only before and after each game, never during.
- Each result sets the next opponent's strength. A win moves it up, a loss moves it down, and the step shrinks each game: 300, then 200, then 150.
- A draw is replayed, as everywhere in the app.

### The last game: Toby (revised Sep 2026, Joseph's decision)

Toby is new that night too, and asks for "a quick one, just for fun". It is the story's first sting.

- He plays at full engine strength, so the player loses. No help, as in the placement games.
- His rating is hidden: he shows as "unrated", as a new member would. From Act 1 onwards his rating is shown and scaled like everyone else's.
- It doesn't count: no rating change, and it isn't replayed if drawn. It does appear in past games and the head-to-head record.
- The rating is worked out after the four placement games, so the Toby game can't drag it down.

### Working out the starting rating

The app combines two signals:

1. **Results:** the rating that the four results imply against those opponents.
2. **Accuracy:** Stockfish checks every move, and the average amount of advantage given away per move maps to an estimated playing strength. This means a lost game still gives useful information.

The two are blended, with accuracy weighted more heavily because four results alone are noisy. The exact blend is tuned during testing.

The player starts Act 1 about 50 points **below** the estimate. Breezing through the first chapter feels good; getting crushed on day one doesn't (Toby's game aside, which is the point). The placement games count towards the rating from then on.

## Your rating and behind-the-scenes adjustment

The player has one visible rating, and each act has a fixed baseline that opponents are measured from.

### The rating

- It uses Glicko-2, a rating system that also tracks how certain it is. Early on it moves quickly; once it has plenty of games, it settles.
- It changes after every **real** game: trial night, matches, gauntlet games and bosses.
- Friendlies never change it, just as real club friendlies are unrated.
- Opponent ratings used in the calculation are their strength settings for that game.

### The act baseline

At the start of each act, the player's current rating becomes that act's **baseline**. Every scaling opponent's strength is the baseline plus their offset (see Opponents). The baseline stays put through the act, so improvement during the act makes games feel easier.

### The safety valve

If the baseline is clearly wrong, it moves, quietly and only between games.

| Trigger (last 5 real games) | Change to the baseline |
| --- | --- |
| 4 or more wins, with accuracy suggesting a strength at least 150 above the baseline | Up 100 |
| 4 or more losses, with accuracy suggesting a strength at least 150 below the baseline | Down 100 |

Rules for the safety valve:

- It can trigger at most once every 5 real games.
- It never changes a boss once the gauntlet has started. Bosses are fixed at that point.
- It never changes a game in progress.
- Fixed characters (like Marjorie) are unaffected, because they don't scale.
- Nothing is announced. The player simply finds the next opponents better pitched.

## Opponents

Every opponent's strength is set relative to the player, except a few fixed characters the player is meant to outgrow.

### Strength offsets

Scaling characters use the act baseline plus an offset. Fixed characters are set once, from the Act 1 baseline, and never change.

| Character | Type | Act 1 | Act 2 | Act 3 |
| --- | --- | --- | --- | --- |
| Marjorie | Fixed | Baseline −60 (was −150; Sep 2026, closer so week 1 is a real game) | Same number | Same number |
| Clive | Fixed | Baseline −30 (was −50) | Same number | Same number |
| Graham | Fixed | Baseline +50 | Same number | Same number |
| Dex | Scaling | −100 | +0 | +50 |
| Priya | Scaling | +0 | +0 | +0 |
| Oscar | Scaling, fastest | −150 | +0 | +100 |
| Toby (ordinary games) | Scaling | +50 | +50 | +50 |
| Felix | Scaling | — | — | +0 |
| Derek | Scaling | — | — | +25 |
| Tour locals (Act 4) | Scaling | — | — | −50 to +50 |

Nobody goes below 200.

**Revised Sep 2026 (Joseph: a fixed story path).** Scaling characters no longer follow the baseline. They sit a set distance from the **player's current rating**, chosen by the story for each chapter, so the story stays on its path however fast or slowly the player improves:

| Character | Act 1 distance from the player, chapter by chapter |
| --- | --- |
| Toby | +50 throughout: always ahead |
| Priya | +20 until the player has beaten her in chapter 5, then −20 |
| Dex | −75, dropping to −90 once beaten, then creeping back to −55 by the cup |
| Oscar | −110, −120 once beaten, then closing to −90 by the cup |

Fixed characters (Marjorie, Clive, Graham) and the background members keep the rating set after trial night, so the player climbs past them for good. A character's rating is always the strength they play at, everywhere, including in the cup. (The act baseline and the safety valve now only matter for the fixed ratings set after trial night.)

### The club ladder

Everyone at the club by rating, with the player among them, including four background members who don't play (yet): Malcolm (+320) and Ray (+190) above, Sheila (−240) and Bill (−330) below, all fixed after trial night. Shown as: a compact card on Home (the player in gold, the people either side, and a bar showing how close the next person is, e.g. "12 to pass Priya"), and the full ladder behind it. Faces, not a table. After each game, a line says who the player moved above ("You moved above Priya on the club ladder"), or who moved above them. Fixed members stay put, so the player passes them for good; growing members can come back past. It is also the natural lead-in to Act 2's club ladder.

### Which engine plays

| Strength | Engine | How it plays |
| --- | --- | --- |
| Below 800 | Custom bots built on Stockfish | Stockfish lists its top candidate moves. A rating-based mistake model then picks weaker ones at human-like rates. At 200 to 400 the bot often leaves pieces undefended and misses the player's threats. At 600 it defends pieces but walks into forks. At 800 to 1000 it sees one-move tactics but misses two-move ones. |
| 800 to about 2500 | Maia-3 at the target rating | Maia-3 gives the likelihood a human at that rating plays each move. The bot picks from those likelihoods, so its mistakes are human mistakes. (Switch-over lowered from 1100 in Sep 2026, since Maia-3 covers lower ratings than older Maia.) |
| Above that | Stockfish at limited strength, blended with Maia-3 | Only needed for very strong players. |

### Styles

Each character has a style that nudges their choices without changing their strength. Among the moves the engine already considers reasonable for that rating, moves matching the style get their likelihood boosted, typically by 1.5 to 2 times.

| Style | Boosted moves | Characters |
| --- | --- | --- |
| Aggressive | Checks, captures, moves towards the enemy king | Dex, Oscar, Felix |
| Solid | Quiet development, keeping structure intact | Marjorie, Graham |
| Simplifying | Piece trades, early queen trades | Clive |
| Grinding | Trades when ahead, long endgames | Vera, Derek |
| Theoretical | Book moves for as long as possible | Priya, Felix |
| Adaptive | Whatever targets the player's weak spots (see The rival system) | Toby |

A style boost never makes a bot choose a move a player of that rating would rarely consider.

### Signature openings

Each character follows an opening book (a list of set move sequences, 6 to 12 moves deep) before the engine takes over. If the player steers somewhere the book doesn't cover, the character falls back on their usual setup or the engine.

| Character | As White | As Black |
| --- | --- | --- |
| Marjorie | London System | French Defence; Queen's Gambit Declined |
| Dex | King's Gambit; Danish Gambit | Stafford Gambit; Englund Gambit |
| Toby | Catalan | Najdorf Sicilian; Nimzo-Indian |
| Graham | Queen's Gambit | Petroff Defence; Queen's Gambit Declined |
| Clive | Exchange variations against everything | Berlin Defence; Exchange Slav |
| Priya | Ruy Lopez, main lines | Closed Ruy Lopez; Queen's Gambit Declined |
| Oscar | Italian Game | Two Knights Defence |
| Vera | English Opening | Caro-Kann; Queen's Indian |
| Felix | Open Sicilian, sharpest lines | Sicilian Dragon; Grünfeld |
| Derek | Colle System | Dutch Stonewall; Old Indian |

### Draw offers, accepting and resigning

Offering a draw is allowed in every game type, since it's part of real chess. The offer appears as a single "Draw?" bubble.

- **Clive** offers around move 12 whenever the position is roughly level.
- **Toby** offers when he is clearly worse. "Draw? Seems a fair result."
- Others offer rarely, mainly in dead-level endgames.
- Bots accept the player's offer only when clearly worse. **Vera** and **Derek** never accept.
- An agreed draw is replayed, like any draw.
- Bots resign when hopelessly lost for three moves in a row. **Derek** never resigns. **Oscar** resigns quickly. **Marjorie** plays on to checkmate.

## Game types

There are two kinds of game, mirroring real club life: friendlies are practice with help available, and matches are real.

|  | Friendly | Match |
| --- | --- | --- |
| Setting | Casual club-night games | League matches, cup ties, ladder challenges, tournament rounds |
| Help | Coached (with Pemberton) or practice stage | None |
| Clock | Never | None by default. Before a gauntlet or boss match, the player may switch one on (see Clocks) |
| Chatter during play | Yes, rationed | None. Characters speak only before and after |
| Changes rating | No | Yes |
| Losing | Still counts towards progress | Replay the match |

Rules for every game:

- **Colours alternate** from game to game across the whole app. The player never chooses.
- **Draws are replayed**, including agreed draws, repetitions and stalemates. You have to win.
- The player can resign at any time.

### Clocks and thinking time

**Which games are timed** (revised Sep 2026, Joseph's decision: no timers unless the player asks):

- No game has a clock by default: friendlies, ordinary matches, trial night, everything.
- The only exception is the "final" matches of each section (gauntlet matches and bosses). Just before one starts, the player may switch a clock on for that game: **30 minutes each, plus 10 seconds added after every move** (the added time is called an increment, and it stops games being decided by a frantic scramble). It is off unless chosen.
- Settings may offer other lengths (15 minutes plus 10 seconds, or 45 minutes plus 15 seconds) for when a clock is chosen.

**Clock rules:**

- Running out of time loses the game, unless the opponent has too little material to ever checkmate, in which case it's a draw and replayed.
- A timed game can be paused, since phones get interrupted. The clock stops while paused.

**How long bots take to move (every game, timed or not):**

The engine finds its move almost instantly; the app then waits a human-like amount of time before playing it, so games feel like playing a person.

| Situation | Untimed games | Timed games |
| --- | --- | --- |
| Opening book moves | 2 to 5 seconds | 2 to 5 seconds |
| Obvious moves, like recaptures | 2 to 4 seconds | 2 to 4 seconds |
| Normal positions | 5 to 12 seconds | A share of the remaining time, typically 20 to 60 seconds |
| Complex or critical positions | Up to 20 seconds | Longer thinks, up to a few minutes |
| Low on time | — | Speeds up sharply |

- In timed games, each move's budget is worked out from the time left, the expected number of moves remaining and how complicated the position is.
- Characters differ: **Priya** takes long thinks once her preparation runs out and can get into time trouble; **Oscar** plays fast; **Clive** plays quickly once pieces are swapped off; **Vera** spreads her time evenly and is never short.
- When a bot is very short of time, it plays slightly weaker, as humans do. The same happens in reverse: time pressure is real for the player too.
- Pace varies clearly by character (revised Sep 2026): Oscar and Dex barely pause; Marjorie is steady; Graham and Priya take their time.
- **Showing that they're thinking (revised Sep 2026):** moving dots beside the opponent's name while they think, so a long think never looks like the app has frozen. After about 4.5 seconds, a small stage direction may appear, e.g. "(Clive pours from his flask.)". It is plain observation, never speech, and appears at most once every three of their moves. It goes when they move.
- **If an engine fails** (for example a dropped connection while Maia downloads): the opponent's move is retried automatically, a stuck engine is restarted, and the Stockfish-based bot stands in for Maia for a minute. The game never sits "thinking" forever.

Dialogue about clocks (pressing the clock with the wrong hand, starting your clock) is tagged for timed games only, so it appears only when the player has switched a clock on.

### The help stages

Which game gets which stage (Joseph, Sep 2026): **Coached** (full help) is the Tuesday game with Pemberton; **Practice** is Thursday's practice games; **Real** is Saturday's best of three, the cup, the boss and trial night. (In the code the stages are still called assisted, guided and real.)

| Feature | Coached | Practice | Real |
| --- | --- | --- | --- |
| Evaluation bar (shows who's winning and by how much) | On | On | Off |
| Best-line panel (the engine's suggested continuation) | Available on tap | Off | Off |
| Hints | Unlimited, in two steps: which piece, then the move | Off | Off |
| "See better move" after a weak move | On | Off | Off |
| Your opening's next move | On | Off | Off |
| Takebacks | Unlimited | 3 per game | None |
| Blunder warning (asks before a bad move is played) | When a move gives away 2 pawns' worth of advantage or more, or allows mate | None (it amounted to free extra takebacks) | None |
| Move rating (after each of your moves: Best move, Good, Inaccuracy, Mistake, Blunder) | On | On | Off: only great moves and blunders, shown in the opponent |

**Practice games** tell you how each move rated, show the evaluation bar and allow three takebacks, but never what you should have played or what to play next. That is for the review afterwards.

**The move rating** is hidden in competitive games (revised Sep 2026); only a great move or a blunder shows, through the opponent's face and an occasional stage direction. It uses the same Lichess-style grading as the review.

**Your opening.** In the coached game only, while the game still follows the player's own usual opening (worked out from their games), a small note gives the next move in plain words. As White, the scouting report opens with a suggested opening to play against that opponent, but the game never prompts the moves of Pemberton's line: remembering them is the player's job, and a prompt would just tell them what to play.

**The best-line panel** is shown on the board as arrows for the next few moves (your moves blue, the opponent's orange, each fainter than the last), with the score as text below.

**The blunder warning** appears after the player drops a piece but before the move is confirmed: "This leaves your knight undefended. Play it anyway?" The player can confirm or take the move back. A warning shown in the guided stage does not use up a takeback.

**The plan pause** (removed Sep 2026: its three plans didn't respond to the actual position; plans now come from the characters' plan hints, which follow the opening on the board) appeared once per assisted game, when the opening had finished (usually around move 10). The game pauses and asks the player to choose the plan for the next few moves from three options, for example "Attack on the kingside", "Push in the centre" or "Swap pieces and aim for an endgame". Coach Pemberton gives a one-line verdict on the choice, then play continues. Plans are written for each signature opening and each opening in the player's repertoire, so this is where the opening-to-middlegame lessons land.

## The path

The app is one fixed path through four acts. The home screen shows only what comes next.

### Acts

| Act | Setting | Rough length | Ends with |
| --- | --- | --- | --- |
| 1 — Club nights | Trial night, then learning the ropes at the club | About 8 chapters | Club knockout cup, final against Toby |
| 2 — The club ladder | Fighting for a place on the league team | About 8 chapters | Ladder run, then Toby at the top |
| 3 — The league season | Match nights against rival clubs; the room-hire stakes | About 10 fixtures | County cup, final against Kingsbridge: Toby, then Vera |
| 4 — The tour | Congresses in different cities, one per chapter | Open-ended; new cities can keep being added | The final congress, and Toby in the last round: a real game, followed by his excuses |

### Chapters

**Revised Sep 2026 (Joseph): the club week.** Each chapter is a week at Wexley, run as a real club runs, and Home shows it as a small calendar (replacing the row of chapter letters):

| Night | Session | What happens |
| --- | --- | --- |
| Tuesday | Coaching night | Three warm-ups from the player's own recent errors (whenever any are waiting; one answered correctly is gone for good), then Pemberton's lesson and puzzles, then a coached game against Pemberton, who plays at exactly the player's level, with full help (hints, takebacks, the best line, his running commentary). Unrated |
| Thursday | Practice night | Three practice games, light help: the week's person first, then one stronger and one weaker from whoever's in (regulars already met, Ray after junior night, Sheila, Bill). Every so often Toby turns up. Saturday opens after the three |
| Saturday | Match day | Best of three against the week's person (Joseph's decision), each game rated, no help. First to two takes the week; losing two means the series is played again from 0–0 |

**The mistakes deck** is no longer a separate screen (Sep 2026, Joseph): past errors come back only as Tuesday's warm-ups, so they actually get done, and the deck never piles up. Every warm-up is a first look and is shown once only, right or wrong (no repeats, so it never becomes a memory test). A moment already retried in the post-game review never becomes a warm-up. Games the player doesn't review are checked quietly in the background afterwards, so their errors are still found.

**Older positions first (Sep 2026, Joseph):** errors from the last three games are held back, since the player has just seen them in the review. Warm-ups come from older games, one per game where possible; recent ones only make up the numbers when nothing older is waiting. Pemberton's line on the Home screen changes each week.

**Pemberton explains every position**, in the warm-ups and in the review: why the best move works (mate, winning material, a fork, saving a piece, a check, or what it keeps), and what went wrong with the move played. Every sentence is built from what's actually on the board, never guessed.

**Every decided game goes on to the review** a few seconds after it ends (looking back through the moves holds it). The review has a Skip, but the intention is that every game gets reviewed.

The cup is "Cup week" (round 1, round 2, semi-final, final). Trial night keeps its own strip. The week header ("Week 3 · Junior night ›") opens the club calendar.

**Runway (Sep 2026).** Act 1 is 16 weeks over 4 months: seven story weeks, each introducing someone, with ordinary club weeks between them (the same shape, against someone already known, with a general coaching topic), then cup week. The story moves slowly on purpose; the essence is playing chess.

**The club calendar** replaces "the story so far": month by month (four weeks to a month, no dates), a week to a line with who it's with, past weeks ticked, this week marked, and what's coming shown.

**Competitive games** (match, cup, boss): no move ratings on screen. Only a great move (the winning shot, found straight after the opponent slips) or a blunder shows, in the opponent: their face for a few seconds, and now and then a stage direction. Any game can be looked back through move by move (view only; one tap returns to the game).

**The look (Sep 2026): "club mat".** Bottle green and buff from the roll-up vinyl boards English clubs use, with brass as the one accent; headings in a serif (Fraunces, bundled with the app); the board framed like the mat. Tonight's session sits on a buff card in dark ink. Wood and slate boards remain in Settings.

A chapter is a short fixed sequence of steps. The usual pattern is:

1. **Lesson** (about 2 minutes): one idea, then 3 to 5 themed puzzles.
2. **Friendlies** against the chapter's opponent, with help.
3. **The match**, with no help.

Variations keep it fresh: a chapter might open with a mistakes-deck warm-up, include a challenge game (see Lessons, puzzles and challenge modes), or go straight to a match against someone the player already knows.

Story happens inside these steps, in the bubbles before, during and after games. There are no separate story screens.

### How friendlies move you forward

Friendlies always count, win or lose:

1. The first friendly against a new character is **assisted**.
2. After that, friendlies are **guided**.
3. The match unlocks once the player **wins a guided friendly**, or has played **3 friendlies in total**, whichever comes first.

Against a character the player has already met, friendlies are optional: the match is available straight away, with a friendly offered.

### After losing a match

The player simply replays it. An optional guided friendly against the same character is offered first, but never required. Gauntlets and bosses have their own rules (see Stakes).

### The home screen

One large card shows the next step, for example "League match — away at Kingsbridge" or "Friendly vs Dex — club night, Tuesday", with the opponent's portrait, a location label and a Play button. Smaller links give access to the mistakes deck, past games, stats and settings.

There is deliberately no free-play mode. Anyone who wants a random game can use Lichess; this app is about the path.

## Stakes

Most losses cost nothing but a replay. Real stakes are saved for the end of each act: a run of three matches you must win, then a boss, like Pokémon's Elite Four and Champion.

### The three levels of stakes

| Game | If you lose |
| --- | --- |
| Friendly | Nothing. It still counts towards progress |
| Ordinary match | Replay it |
| Gauntlet match | Replay that match only |
| Boss | Go back and win all three gauntlet matches again, then face the boss again |

### Gauntlets and bosses by act

Every format is a real chess format.

| Act | Gauntlet (3 matches) | Boss | If you lose to the boss |
| --- | --- | --- | --- |
| 1 | Club knockout cup: three rounds against club members | Toby, in the final | Qualify again for next month's knockout |
| 2 | Three ladder challenges in a row | Toby, top of the ladder | You drop down the ladder and climb again |
| 3 | County cup: three rounds, including Derek's and Felix's clubs | Kingsbridge in the final: Toby, then Vera | Next season's cup run. Losing to Vera after beating Toby means replaying Toby then Vera, not the three rounds |
| 4 | A congress: win rounds 1 to 3 against locals | Toby in round 4, since winners are paired against winners | Next city, next congress, with new locals |

### Strength settings

**Revised Sep 2026:** cup opponents play at their club ratings (as shown on the ladder), so the Act 1 draw is ordered to get harder: Clive (settled, well below by then), Oscar (player −90), Priya (player −20), then Toby (player +50). The boss never gets easier after a loss, and never drops behind the player. Win chance against Toby is about 43%: a little over 2 attempts on average.

| Opponent | Strength |
| --- | --- |
| Gauntlet match 1 | Clive's club rating (fixed; about player −100 by then) |
| Gauntlet match 2 | Oscar's club rating (player −90) |
| Gauntlet match 3 | Priya's club rating (player −20) |
| Toby as boss | Toby's club rating (player +50), never lower than at the last attempt |
| Vera as boss (Act 3) | Baseline +50 |

Boss strengths are fixed once the gauntlet starts and never drop after a loss.

### The maths behind these numbers

Chess ratings predict results. The chance of winning (ignoring draws, since draws are replayed) is roughly:

| Opponent vs you | Your chance |
| --- | --- |
| 125 below | 67% |
| 100 below | 64% |
| 75 below | 61% |
| 50 below | 57% |
| 25 below | 54% |
| Equal | 50% |
| 25 above | 46% |
| 50 above | 43% |
| 100 above | 36% |

By the end of an act, a typical player has improved about 50 points above the baseline. With the settings above:

- The gauntlet takes about 5 games on average, since a lost gauntlet match is just replayed.
- The boss is won about half the time, so a typical player needs **about 2 attempts**, and most need between 1 and 4. That hits the target.
- A player who hasn't improved during the act needs a little over 2 attempts on average.

**Watch in testing:** because each boss loss means replaying the gauntlet, a full act ending averages 10 to 14 untimed games. If that feels like a slog, the first lever is making repeat runs shorter, for example two gauntlet matches instead of three after the first boss loss. The boss itself stays untouched.

### Support after boss losses

The boss never gets easier. The support around the player grows instead:

| After | What unlocks |
| --- | --- |
| 1st loss | Coach Pemberton's scouting report gets more detailed: the boss's likely opening against your colour, and the phase of the game where you lost |
| 2nd loss | An optional assisted friendly against the boss, to study how they're beating you |
| 3rd loss | A targeted puzzle set: positions from your own losses to them, plus puzzles on the weakness they exploited |
| 4th and later | All of the above stay available |

Rematches are always acknowledged in dialogue, with lines for the second, third and fourth-plus attempt. Toby gets more supportive each time, which is worse.

## The rival system

Toby studies the player's games and steers towards their weak spots. He is the only character who does this, and the story explains how: Coach Pemberton has been passing him your scouting reports.

### What the app tracks about the player

After every game, Stockfish's analysis feeds a weakness profile:

| Measure | How it's worked out |
| --- | --- |
| Openings | Results and accuracy in each opening, separately as White and as Black |
| Game phase | Accuracy in the opening (moves 1 to 12), the middlegame, and the endgame (queens off, or little material left) |
| Under attack | Accuracy when the opponent has pieces aimed at the player's king |
| After the opening | How much the player's position slips in the 10 moves after the opening ends |
| Converting | How often the player wins positions where they were clearly ahead |
| Missed tactics | Which kinds of tactic the player's mistakes allowed (forks, pins and so on), once theme tagging is added |

Targeting only starts after 10 real games, so there's enough evidence. Before that, Toby plays his normal repertoire.

### Three levels, unlocked across the story

| Level | From | What Toby does |
| --- | --- | --- |
| 1. Opening choice | Act 1 | Within his repertoire, he picks the lines where the player scores worst |
| 2. Game type | Act 2 | His style shifts towards the player's weakest phase. Weak endgames: he trades pieces early. Weak under attack: he goes for the king. Drifts after the opening: he keeps the position quiet and waits |
| 3. Traps | Act 3 | Among moves almost as good as the best, he prefers ones where a human at the player's rating is likely to reply with a mistake. Maia-2 provides that prediction |

### Fairness limits

- His raw strength never changes. He is exactly as strong as his offset says.
- Level 3 only chooses between moves within 0.3 pawns of the engine's best. He never plays a bad move to set a trap.
- The targeting is always visible. Toby taunts the specific weakness ("Endgame again? Sorry. I find them relaxing."), and Coach Pemberton's scouting report names it ("He's noticed you drift after the opening. Have a plan ready.").

This makes Toby the app's best teacher: to beat him, the player has to fix the exact weakness he's exploiting.

### Later idea

Researchers behind Maia have trained versions of it on one person's games so it plays like that individual. With enough of the player's games, a future version could let Toby prepare against a model of the player specifically.

## Lessons, puzzles and challenge modes

Lessons are short and always tied to the next opponent, so what you learn gets used within minutes.

### Lessons

- Coach Pemberton presents each lesson in one or two lines, while a real puzzle from the character's opening plays itself out on the board as the worked example ("Watch: one piece attacks two at once…"). Then 3 to 5 more of the same kind. (Revised Sep 2026, Joseph's feedback: lessons were too wordy and the puzzles didn't always match. Puzzles now share both the opening and the theme, and the example is a real, verified puzzle, so hand-written positions can't be wrong.)
- Then come 3 to 5 puzzles on the same theme.
- The topic is chosen for the chapter's opponent. Before Dex, it's how to meet a gambit calmly. Before Marjorie, it's the London System's plan and how to break it. Before Clive, it's how to create winning chances in a level position.
- Difficulty follows the player's puzzle rating (which starts at their playing rating and moves as they solve), so the same lesson gives a 1200 player 1200-level puzzles. This replaces the three written versions by strength.

### Topics across the story

| Kind of lesson | Examples |
| --- | --- |
| Tactics | Forks, pins, skewers, discovered attacks, removing the defender |
| Safety | Not leaving pieces undefended, checking every capture and check before moving |
| Checkmates | Back-rank mates, basic mating patterns |
| Meeting each opponent's opening | One per signature opening |
| What's the plan? | The typical plans that follow from each opening, feeding the plan pause |
| Positional play | Weak squares, good and bad pieces, pawn structure |
| Endgames | King and pawn endings, rook endings, converting an advantage |

### Your repertoire

**Revised Sep 2026 (Joseph's decision): nobody asks.** The app works out what the player plays from their own recent games: the most-played of the eight openings below in each situation (as White, against 1.e4, against 1.d4), once it has been played at least twice. In assisted and guided games, while the game still follows one of that opening's main lines, a small note says the next move in plain words ("Your London: next, bishop to f4"). The plan pause also has plans for the player's own openings.

| Colour | Options |
| --- | --- |
| White | Italian Game (attacking); London System (a solid setup, and Marjorie approves); Queen's Gambit (classical) |
| Black against 1.e4 | Sicilian Defence (sharp); Caro-Kann (solid, and Toby will be delighted); 1...e5 (classical) |
| Black against 1.d4 | King's Indian Defence (attacking); Queen's Gambit Declined (solid) |

The repertoire drives the "What's the plan?" lessons, the plan pause and the "Your opening" challenges. Keeping it to eight openings keeps the plan-writing manageable.

### Puzzles

- The app ships with around 30,000 puzzles from the Lichess database, balanced across themes and difficulties.
- Puzzle difficulty is tracked separately from the playing rating, because puzzle ratings run differently. It adjusts as the player solves or fails puzzles.
- A wrong answer shows a hint and allows another try. There's no penalty for failing.

### Challenge modes

Challenge games start from a set position rather than move one. They mostly appear from Act 2, as chapter steps with a story reason.

| Challenge | Starts from | Success means | Story example |
| --- | --- | --- | --- |
| Convert it | A clearly winning position | Winning | You're a piece up with ten minutes of club night left |
| Hold on | A worse position | A draw or better. The only exception to the draws-replay rule | The team needs a draw from your board |
| Your opening | Middlegame positions from the player's openings | Winning | Coach Pemberton sets you homework |
| Endgames | Common endings | Winning, or drawing where a draw is the correct result | Derek insists on playing it out |

Positions come from a curated set, and increasingly from the player's own games: winning positions they failed to convert, and positions where they went wrong.

## After the game

Every game, won or lost, ends with a short review. The review is where most of the learning happens, so it's quick, focused and always about the player's own moves.

The review is offered, not forced: a Skip button sits beside "Review game" and in the corner of each review step (Joseph's decision, Sep 2026). A skipped game adds no cards to the mistakes deck, because the cards come from the review's analysis.

### The review

1. **The character's post-game bubbles** (one or two), then the review opens.
2. **Analysis.** Stockfish checks every move, with a progress bar. Depth is capped so it finishes in well under a minute on a phone.
3. **Summary:** the result, an accuracy score, and for real games the rating change.
4. **Your three biggest moments.** For each one, the board shows the position before the mistake and asks the player to find a better move, with 3 tries before the answer is revealed: two plain, the third with the piece to move highlighted (revised Sep 2026). Each gets one plain-language explanation, for example "This left your bishop undefended" or "You missed a fork that wins the rook".
5. **Best move of the game.** One highlight of something the player did well.
6. **Opening note.** Against a character with a signature opening, where the player left the recommended approach, and a one-line comment from Coach Pemberton.
7. **Full game (optional).** Step through every move with an evaluation graph.

Moves are classified the way Lichess does it, by how much the player's winning chances dropped:

| Label | Meaning |
| --- | --- |
| Inaccuracy | A small drop in winning chances |
| Mistake | A clear drop |
| Blunder | A big drop, often losing material or the game |

Explanations are built from engine facts (material lost, a piece left undefended, a missed capture or tactic), turned into plain-English sentences from templates.

### The mistakes deck

- Each of the biggest moments that was a mistake or blunder becomes a card: the position before the error, with the task "find the best move".
- At most 2 cards are added per game (the worst errors). Positions where the better move was only slightly better are skipped, so the deck stays about real errors.
- The deck stays small (revised Sep 2026, so it never fills up): the same position is never added twice; at most 30 cards are active, and adding beyond that retires the oldest; a sitting shows at most 10 cards; a card retires once its next review would be 30+ days away; and the player can remove any card with "I've got this one".
- Cards come back on a schedule worked out by FSRS: soon after a wrong answer, and at growing intervals after right answers, until they're retired.
- Due cards appear as a short warm-up at the start of some chapters (up to 5 cards), and the deck is always available from the home screen.
- Boss-loss puzzle sets draw on cards from games against that boss.

### Scouting reports

Before every match, and before the first friendly against a new character, Coach Pemberton gives a scouting report. It plays out on the board like a YouTube teacher (revised Sep 2026): the character's usual opening against the player's colour plays itself move by move, then the right way to meet it, with plain-English captions and no move notation. It covers:

- the opponent's likely opening against the player's colour, and the key idea for meeting it
- their style, in one line
- the player's record against them
- after boss losses: the phase of the game where the player lost last time
- against Toby: the weakness he's currently targeting

Each character has hand-written base lines, with slots filled from the player's data. The report is shown before the game only. Real matches have no help once play starts.

## Rating display and quiet rewards

Improvement is rewarded quietly and never made the point of the app.

### After every real game

- The rating change animates on the review summary, for example "1245 → 1257 (+12)" or "1245 → 1236 (−9)", like checking your rating after a league night.
- Drops are shown just as plainly as gains. That's what makes gains mean something.

### Opponent ratings

- Every opponent shows a rating: their current strength setting, rounded to the nearest 5.
- Scaling characters' ratings change between acts, which is realistic: Toby's rating creeping up alongside yours is part of the rivalry.
- Fixed characters' ratings don't change, so the player eventually notices they're well above Marjorie.

### Stats screen

- A rating graph over time.
- Record against each character.
- Accuracy trend, and accuracy by game phase.
- Current strongest and weakest openings.

### Milestones

One-time moments, shown as a small banner after the game. They are never a checklist the player is pushed to complete. Examples:

- First win against a higher-rated opponent
- First win against every club regular
- First game with no mistakes or blunders
- Beating someone who beat you three times in a row
- Your rating passing each hundred (1200, 1300 and so on)
- Passing a fixed character's rating by 200

### Characters noticing

The dialogue library includes lines triggered by the player's progress: a rating milestone, a long winning run, or finally beating a nemesis. For example, Marjorie: "Your rating's gone up, I see. Good for you."

## Dialogue system

Dialogue comes from a large library of short, pre-written lines, picked by what just happened, who's speaking, and the history between the player and that character. Story beats are scripted sequences attached to specific chapter steps.

### Where lines appear

| Moment | Friendlies | Matches |
| --- | --- | --- |
| Before the game | 1 to 3 bubbles | 1 to 3 bubbles |
| During the game | Up to 3 lines per game, at least 6 moves apart: reactions to the board, and "plan hints" where the character says what they're planning (teaching the player to read plans) | No chatter. Up to 2 silent stage directions at key moments ("(She stops stirring her tea.)"), at least 10 moves apart; plus "Draw?" offers |

**Revised Sep 2026 (Joseph's feedback):** lines should respond to the board. Friendlies get plan hints tied to the opening on the board and the character's colour. Matches get tension as stage directions (never speech, so no one chats in a serious game). When the opponent has just blundered and the player has a big move available, the character sometimes gives it away (spoken in friendlies, a stage direction in matches), about half the time.
| After the game | 1 or 2 bubbles | 1 or 2 bubbles |

**Timing rules:** a line appears only straight after the bot's move, fades after about 4 seconds or on tap, and never covers the board or interrupts the player moving a piece. When several triggers fire at once, the most important wins: a blunder, a turnaround or a queen capture beats a check, which beats everything else.

Other speakers, like Marjorie during a game against Toby, appear as a small portrait next to their bubble.

### Triggers

| Group | Triggers |
| --- | --- |
| Game flow | Game start, game end (win, loss, draw replay), resignation, draw offer made or declined |
| Moves | Check given or received, capture of a minor piece, rook or queen, castling, en passant, promotion, a sacrifice |
| Quality | Player blunder, bot blunder, a strong move by the player, turnaround, clearly winning, clearly losing, a long think |
| Relationship | First meeting, rematch number (2nd, 3rd, 4th and later), revenge win, losing streak against them, falling for the same idea twice |
| Progress | Rating milestones, winning runs, passing a fixed character's rating |
| Story | Scripted beats attached to chapter steps |

### How a line is chosen

1. Take all lines for this character and trigger.
2. Keep only those whose conditions match: act, friendly or match, rematch count, head-to-head record, and story flags such as "Toby has left the club".
3. Remove lines used recently, so nothing repeats until that set is used up.
4. Remove "once only" lines that have already been shown.
5. Pick one at random, weighted.

### Data format

Lines are written in a spreadsheet for convenience and converted to JSON at build time. Each line has these fields:

```json
{
  "id": "toby-rematch-3-01",
  "character": "toby",
  "trigger": "game_start",
  "text": "Third time lucky, mate. For one of us.",
  "expression": "smug",
  "conditions": { "acts": [1, 2], "rematch": 3, "gameType": "match" },
  "weight": 1,
  "once": false
}
```

Story beats use the same fields, plus a sequence number and a speaker per bubble.

### Chatter setting

| Setting | What shows |
| --- | --- |
| Full (default) | Everything above |
| Quiet | Before and after the game only |
| Off | Story beats only, still skippable |

## Characters and art

The full cast, their voices and sample lines live in the Character Tone Guide. This section covers what the build needs.

### Expression sets

Every character has a set of expressions. The same face is reused, and only the eyebrows, eyes and mouth change.

| Tier | Characters | Expressions |
| --- | --- | --- |
| Main cast | Toby, Marjorie, Dex, Vera, Coach Pemberton | 5: neutral, pleased, annoyed, surprised, smug. Each is tuned to the character: Toby's "annoyed" is a tight smile; Vera's range is deliberately small |
| Club regulars | Graham, Clive, Priya, Oscar | 4: neutral, pleased, annoyed, surprised |
| Rival club faces | Felix, Derek | 3: neutral, pleased, annoyed |
| Tour locals | One per city | 3: neutral, pleased, annoyed |
| Background | Neil, the pub landlord | 2: neutral, talking |

### Art style

- Flat ink-and-colour illustration: dark outlines, muted colours, a newspaper-cartoon feel that suits the dry tone.
- Head-and-shoulders portraits only. Each character is recognisable from one or two strong cues, like Toby's quarter-zip or Marjorie's glasses on a chain.
- Sizes needed: about 72 px beside the board, 40 px for other speakers' small portraits, and about 240 px for larger views.

### Placeholders, then final art

- **Now:** portraits drawn in code from shared face parts, as on the Placeholder Portraits canvas. They're free, consistent and quick to change.
- **Later:** once the app plays well, commission an illustrator for the main cast first, briefed with the tone guide and the placeholders. Portraits are just images swapped in, so nothing else in the build depends on them.

### Names in the app

Characters show only their name and rating. Nobody is labelled with a role. Players learn who people are from what they say and what others say about them, starting with Marjorie's introductions on trial night.

## Screens

The app has eight screens. The game screen is where almost everything happens.

| Screen | What it shows |
| --- | --- |
| Welcome | First launch only: the experience question, an optional rating entry, and the rules walkthrough for new players |
| Home | One large "Next" card (step type, opponent portrait, location label, Play button), the player's rating, and small links to the mistakes deck, past games, stats and settings |
| Game | Opponent portrait, name, rating and speech bubbles at the top; the board with the evaluation bar when help allows it; the player's name and rating below; help buttons (Hint, Take back, Analysis) only in friendlies; a stage label such as "Practice · move feedback"; a location label such as "Club night · Tuesday" |
| Lesson | Coach Pemberton's bubbles over a demonstration board, then the puzzles |
| Review | Summary, the three biggest moments, best move, opening note, and the optional full-game view with an evaluation graph |
| Mistakes deck | Due cards one at a time, with a count of what's left |
| Stats | Rating graph, record against each character, accuracy trends, milestones |
| Settings | Chatter level, clock length for timed matches, board and piece style, sound, backup export and import |

### The game screen, top to bottom

1. Back button, location label, and the game title ("Friendly vs Marjorie").
2. Opponent portrait, name, rating, and the current speech bubble.
3. Last move, and the stage label.
4. The evaluation bar beside the board (assisted only), and the board, oriented with the player's pieces at the bottom.
5. The player's name, rating and colour.
6. The help buttons, which depend on the stage.

The layout follows the "Beside the board" mockup on the Placeholder Portraits canvas. Touch targets are at least 44 px, and the board takes the full width on a phone.

## Saving and data

Everything is saved on the phone. There are no accounts and no servers.

### What's saved

| Data | Contents |
| --- | --- |
| Progress | Current act, chapter and step; gauntlet progress; boss attempt counts |
| Rating | Current rating and certainty, act baselines, the safety-valve history |
| Games | Every game's moves, result, type, opponent, and analysis once done |
| Weakness profile | The measures from The rival system |
| Relationships | Head-to-head record and rematch counts for each character; dialogue flags |
| Dialogue history | Recently used lines, and once-only lines already shown |
| Mistakes deck | Cards and their review schedule |
| Puzzles | Puzzle rating, and puzzles already seen |
| Settings | Chatter level, clock length, board style, sound |

### Keeping it safe

- Progress saves after every move, so closing the app mid-game loses nothing. The game resumes exactly where it was.
- **On iPhone, the app must be added to the home screen**, not used as a normal Safari tab. Safari can clear the saved data of websites that aren't used for a while; home-screen apps are protected.
- **Backup:** Settings has Export, which saves everything to a single file, and Import, which restores it. That also covers moving to a new phone.
- Once the app is on the App Store and Google Play, saving moves to the app's own storage, and the export/import stays.

## Build order

The first complete version is Act 1, fully built. It's reached in eight phases, each ending with something testable on the phone.

| Phase | What gets built | Done when |
| --- | --- | --- |
| 0. Setup | Claude Code and GitHub set up, project skeleton, automatic publishing to GitHub Pages | A blank app opens from the iPhone home screen |
| 1. Chess core | Board, rules, Stockfish running in the background, a simple Stockfish-based opponent, the three help stages, draws replayed, alternating colours, resuming a game mid-way | You can play a full game on the phone with or without help |
| 2. Review and mistakes deck | Post-game analysis, move labels, three biggest moments with explanations, best move, full-game view, mistakes deck with scheduling | Every game ends with a useful review, and mistakes come back later |
| 3. Opponents | Custom low-level bots with the mistake model, Maia-2, styles, opening books, draw offers and resigning | Each character plays recognisably like themselves |
| 4. Progression | Trial night, the rating system, act baselines and the safety valve, the path engine, friendly rules, gauntlets, bosses and the support after losses | You can play from trial night to the Act 1 boss, with placeholder text |
| 5. Lessons and puzzles | Puzzle subset, lesson player, puzzle rating, the plan pause | Each chapter opens with a working lesson |
| 6. Dialogue and story | Dialogue engine, triggers, the spreadsheet-to-JSON pipeline, all Act 1 story beats and lines, scouting reports, rival level 1 | Act 1 plays with full story and characters |
| 7. Art, stats and polish | Placeholder portraits with expressions, stats screen, milestones, settings, backup, then playtesting and tuning | Act 1 is complete, and the boss takes about 2 to 4 attempts |

### After Act 1

Acts 2 to 4, rival levels 2 and 3, challenge modes, final commissioned art, and the iOS and Android versions via Capacitor.

### Writing alongside the build

The Act 1 story outline and dialogue are written in parallel with phases 1 to 5, so they're ready for phase 6.

## Open questions

Most earlier questions are now settled: the web-first route to iOS and Android, the clock rules, the player's repertoire, and Coach Pemberton's name. What remains is below.

### Names to confirm

These are proposals, needed before the Act 1 story outline.

| Thing | Proposal |
| --- | --- |
| The app | Club Night |
| The club | Wexley Chess Club |
| The town | Wexley, a fictional market town |
| Where the club meets | The back room of the Red Lion |
| Rival clubs | Kingsbridge (already set); Castlebury University; Castlebury Railway Club, Derek's club, since many English clubs began as railway and works social clubs |

### To confirm during the build

- [ ] Maia-2's exact rating range, and how well it runs in iPhone Safari
- [ ] The Stockfish analysis depth that keeps reviews under a minute on a phone

### To tune in playtesting

- [ ] How accuracy and results are blended on trial night
- [ ] Character offsets, and the gauntlet and boss strengths
- [ ] Whether repeat gauntlet runs need shortening
- [ ] How an optional clock changes win chances in gauntlet and boss games, and whether they need adjusting for it
- [ ] How much the style boosts change each character's play
- [ ] Dialogue frequency during friendlies
