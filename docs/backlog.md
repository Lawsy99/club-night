# Backlog

Ideas and requests waiting to be built, newest at the bottom. Joseph adds to
this between sessions; each item notes anything that needs deciding first.
When an item is built, move it to "Done" with the date.

## Waiting

### 2. Accounts, to play the same game on several devices (Joseph, 28 Sep 2026)
- A big change: the design is "all saving on the device, no accounts, no
  servers" (design document, Saving). Accounts need an online service to hold
  saves (for example Supabase or Firebase, both with free tiers), sign-in, and
  care over privacy (a privacy policy, deleting accounts).
- What exists now: Settings > Backup exports everything to one file and imports
  it on another device. That moves a game between devices by hand.
- Possible middle step: a sync code (copy a short code or file across) before
  real accounts. Better once the app is in the App Store and Play Store, where
  Apple and Google sign-in and their own cloud storage are available.
- Needs Joseph's go-ahead before any work: new service, new costs, new rules.

### 3. Drills and an overall focus on cutting out blunders (Joseph, 28 Sep 2026)
Builds on docs/learning-plan.md, item 2 ("A thinking habit: blunder check").

- "What did their move threaten?" drills: positions from the player's own games
  (and puzzles) where the opponent's last move set up a threat; find it first.
- "Is it safe?" drills: a move to play, and the player decides if it leaves
  something loose, before seeing what happens.
- A monthly number in Stats: pieces blundered per game, this month against last.
- Pemberton's "are you sure?" in the coached game already trains the habit;
  the drills would sit on coaching night and in the warm-ups.

## Done

- 28 Sep 2026: "Full help" setting. Settings > Full help: unlimited hints and
  takebacks, move ratings and the evaluation bar in every game. Before each
  must-win game Pemberton asks; helped games move the story on but are not
  rated (logic/path.ts withHelpChoice, data/helpStages.ts UNLIMITED_HELP).
