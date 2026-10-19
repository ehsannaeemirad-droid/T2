# Touchstone 2 — Speaking Practice

A mobile-first Persian-language speaking app for Touchstone 2, shipped as an installable PWA.

**Live:** https://ehsannaeemirad-droid.github.io/T2/

## Screens

- **Home** — lesson list and daily stats
- **Speaking** — model answers with inline translations and tap-to-reveal words
- **Grammar** — swipeable lesson cards: teach → quick 2-item check → 10-item final test → score
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
  grammar/<id>.json   step-by-step grammar cards (teach / mini_test / final_test)
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
2. Optionally add `data/grammar/<id>.json` (see the grammar format below).
3. Add the matching entry to `data/topics.json`.
4. Run `node scripts/audit.mjs` before pushing.

### Grammar format

Grammar files render as a swipeable carousel, one card per screen. The app
flattens `steps` into cards and shows Prev/Next plus touch swiping:

```json
{
  "title": "گرامر درس ۱A",
  "steps": [
    {
      "type": "teach",
      "title": "فعل بودن (be)",
      "content_fa": "توضیح فارسی با <strong>تأکید</strong> و <code>مثال</code>",
      "examples": [
        { "en": "I am a student.", "fa": "من دانش‌آموزم." }
      ]
    },
    {
      "type": "mini_test",
      "items": [
        { "k": "tap", "q": "I ____ a student.", "o": ["am", "is", "are"], "a": "am", "fb": "با I از am استفاده می‌کنیم." },
        { "k": "type", "q": "She ____ (be) from Canada.", "a": "is", "fb": "با she از is استفاده می‌کنیم." }
      ]
    },
    {
      "type": "final_test",
      "items": [
        { "k": "drag", "w": ["She", "is", "a", "good", "friend", "."], "a": "She is a good friend .", "fb": "ترتیب جمله." }
      ]
    }
  ]
}
```

- `teach` cards show Persian explanation plus English examples; tapping an example
  speaks it. English is LTR, Farsi is RTL.
- `mini_test` cards hold exactly 2 items and gate the Next button until both are answered.
- `final_test` must hold 10 items; each becomes its own card and the score appears
  on a summary screen with a restart option.
- Item kinds are `tap`, `type` and `drag`; every item needs `fb` (feedback shown
  after answering). Drag items can omit `q` and get a generic reorder prompt.
- Legacy files with `explanation[]` + `test[]` still load, but new content should use `steps`.

Twelve grammar files cover Units 1–3 (`g1a`–`g3d`). Six are referenced by existing
lessons; the rest are ready for lessons that have not been written yet.

## Content audit

```bash
node scripts/audit.mjs
```

Fails on broken references — a topic pointing at a missing lesson, duplicate ids,
id/title mismatches, malformed JSON, grammar steps with the wrong shape (a final
test without 10 items, a mini-test without 2, tap answers missing from options,
drag words that do not match the answer), or a grammar file without teach cards.
Missing grammar files and unlisted lesson files are reported as warnings so the
app can still ship with planned content.

CI runs the same script on every push and pull request.

## Deployment

Pages is built by `.github/workflows/pages.yml`, which stages the static files and
deploys them with the official Pages actions. Pushing to `main` publishes
automatically; `workflow_dispatch` republishes on demand.

The service worker caches the app shell. Bump `CACHE_NAME` in `sw.js` when you
change cached assets so returning visitors pick up the new version.
