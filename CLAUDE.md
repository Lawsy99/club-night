# Club Night — project instructions for Claude Code

## What this is
A chess app built like a Pokémon journey. The player joins a struggling local chess
club, plays through a grounded, dry, very British story, and gets better at chess
without it feeling like study. Built first as a web app for iPhone (added to the
home screen), later wrapped as iOS and Android apps with Capacitor.

## Source of truth
- `docs/design-document.md` — every system: trial night, ratings, opponents, game
  types, clocks, the path, gauntlets and bosses, the rival system, lessons, reviews,
  dialogue, screens, saving, build order. Follow it. If something in it seems wrong
  or unclear, ask before deviating.
- `docs/character-tone-guide.md` — the cast, voice rules and sample dialogue.

## About the person you're working with
- Joseph is not a developer. He is vibecoding this with you.
- Explain what you're doing and why in plain English. Spell out technical terms
  instead of stacking jargon.
- Before any large change (new library, restructuring, deleting files), say what
  you plan to do and wait for a go-ahead.
- After each working step, tell him exactly how to see or test it, ideally on his
  iPhone.

## Tech stack (from the design document)
- React + TypeScript, built with Vite.
- chess.js for rules; react-chessboard or cm-chessboard for the board.
- Stockfish, single-threaded web (WASM) build, always inside a Web Worker.
- Maia-2 in the browser for human-like opponents (added in phase 3).
- Lichess puzzle database subset; Lichess openings dataset.
- ts-fsrs for the mistakes deck.
- All saving on the device (IndexedDB). No accounts, no servers.
- Hosted on GitHub Pages, deployed automatically from the main branch.

## Rules for the code
- Target iPhone Safari first. Test layouts at 390 × 844. Touch targets at least 44 px.
- Engines never run on the main thread; the board must never freeze.
- Save progress after every move so a closed app resumes exactly where it was.
- Keep game logic (rules, ratings, path, dialogue selection) separate from UI
  components, so it can be tested on its own.
- Game content (characters, offsets, opening books, dialogue lines, lessons, story
  beats) lives in data files, not hard-coded in components.
- Write small, clearly named files. Add short comments explaining the "why".
- Commit after each working step with a clear message.

## Build phases (see design document, "Build order")
0. Setup — blank app on the iPhone home screen via GitHub Pages
1. Chess core — board, rules, Stockfish, simple opponent, help stages, resume
2. Review and mistakes deck
3. Opponents — custom low-level bots, Maia-2, styles, opening books
4. Progression — trial night, ratings, path, gauntlets, bosses
5. Lessons and puzzles
6. Dialogue and story (Act 1)
7. Art, stats and polish; playtest and tune

Only build the current phase. Don't add features from later phases early.

## Current phase
Phase 1 — Chess core (Phase 0 done: live at https://lawsy99.github.io/club-night/)
