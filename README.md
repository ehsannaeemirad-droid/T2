# Touchstone 2 — Speaking Practice

A mobile-first Persian-language speaking app for Touchstone 2, shipped as an installable PWA.

**Live:** https://ehsannaeemirad-droid.github.io/T2/

## Screens

- **Home** — lesson list and daily stats
- **Speaking** — model answers with inline translations and tap-to-reveal words
- **Grammar** — explanation plus an interactive test (tap / type / drag)
- **Flashcards** — spaced-repetition cards built from each lesson's words
- **Exercise** — word practice and matching games

## Content layout

```
index.html            app shell
app.js                all screens and state
styles.css            themes and layout
sw.js                 service worker (offline shell)
manifest.json         PWA manifest
data/
  topics.json         ordered list of lessons shown on Home
  lessons/<id>.json   one lesson: words, questions, grammar_file/grammar_notes
  grammar/<id>.json   explanation + test questions
```

Every entry in `data/topics.json` points at a lesson file through `file`, and each
lesson may point at a grammar file through `grammar_file`. A lesson with
`grammar_notes` instead of `grammar_file` renders those notes in the Grammar tab;
a lesson with neither, or a `grammar_file` that does not exist yet, shows a
"coming soon" placeholder.

### Adding a lesson

1. Add `data/lessons/<id>.json` with `id`, `title`, `emoji`, `unit`, `lesson`, `words`,
   and `questions` (12 answers, 150–200 words each, `{{phrase::key}}` for grammar
   highlights and `[[english|فارسی]]` for translations).
2. Optionally add `data/grammar/<id>.json` with `title`, `explanation[]`, `test[]`.
3. Add the matching entry to `data/topics.json`.
4. Run `node scripts/audit.mjs` before pushing.

## Content audit

```bash
node scripts/audit.mjs
```

Fails on broken references — a topic pointing at a missing lesson, duplicate ids,
id/title mismatches, malformed JSON, or a grammar file without explanations or
questions. Missing grammar files and unlisted lesson files are reported as
warnings so the app can still ship with planned content.

CI runs the same script on every push and pull request.

## Deployment

Pages is built by `.github/workflows/pages.yml`, which stages the static files and
deploys them with the official Pages actions. Pushing to `main` publishes
automatically; `workflow_dispatch` republishes on demand.

The service worker caches the app shell. Bump `CACHE_NAME` in `sw.js` when you
change cached assets so returning visitors pick up the new version.
