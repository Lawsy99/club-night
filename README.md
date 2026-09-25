# Club Night

A chess app built like a Pokémon journey, set in a struggling local chess club.

- Design: [docs/design-document.md](docs/design-document.md)
- Cast and voice: [docs/character-tone-guide.md](docs/character-tone-guide.md)

## Running it on your laptop

```
npm install      # first time only, or after libraries change
npm run dev      # then open http://localhost:5173/club-night/
```

Press `Ctrl + C` in the terminal to stop it.

## Publishing

Every push to the `main` branch builds the app and publishes it to GitHub Pages
automatically (see `.github/workflows/deploy.yml`).
