# Vocabulary Drill

A static, offline-capable single-page web app for self-checking foreign-language vocabulary. The dataset is bundled at build time as JSON. The app is language-agnostic — the included `vocabulary.json` happens to be German ↔ English, but you can swap in any language pair (or any field-shaped reference data).

## Stack

**Vite + React + TypeScript.** The app is small (three screens, no routing, no server) but has enough state interplay — category multi-select drives the visibility of group/field controls, and a screen state machine drives the run — that React's componentized state model pays for itself. TypeScript catches shape mismatches against the JSON schema, Vite gives a single-command static build with relative asset paths suitable for any host. No runtime dependencies beyond React.

## Running locally

```bash
npm install
npm run dev
```

This validates `src/data/vocabulary.json`, then starts the Vite dev server (default `http://localhost:5173`).

## Building

```bash
npm run build
```

Outputs a fully static site to `dist/`. The build first runs the JSON validator (`npm run validate`) and a TypeScript check; either failing aborts the build with a clear message.

Preview the built output locally:

```bash
npm run preview
```

## Swapping in a new vocabulary

Replace `src/data/vocabulary.json` with your own file matching the schema below, then rebuild. The validator (`npm run validate`) will refuse malformed input.

### Schema

The file is an array of categories:

```jsonc
[
  {
    "name": "Animals",                 // unique display name
    "header": [
      { "name": "German",  "questionable": true  },  // eligible as quiz prompt
      { "name": "English", "questionable": true  },
      { "name": "Article", "questionable": false }   // shown only in answers
    ],
    "groups": [
      {
        "id": "pets",                  // unique within the category (string or number)
        "items": [
          { "German": "Hund", "English": "dog", "Article": "der" }
        ]
      }
    ]
  }
]
```

Rules enforced by the validator:

- Category names are unique.
- Field names are unique within a category; `questionable` must be a boolean.
- Group ids are unique within a category and must be a string or number.
- Item field values must be strings (the app does not render numbers, audio, or images).
- A category with no questionable fields is skipped at runtime (warning during validation).

The app gracefully handles items that omit a header-declared field — they render as an empty value in the answer reveal.

## Deploying as a static site

`npm run build` produces a self-contained `dist/` directory with relative asset URLs (`base: './'` in `vite.config.ts`), so it works whether served from `/` or a subpath like `/vocab-drill/`.

### GitHub Pages (via Actions)

Add `.github/workflows/pages.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build-deploy:
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: ${{ steps.deploy.outputs.page_url }} }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
      - id: deploy
        uses: actions/deploy-pages@v4
```

Then enable Pages in the repo settings (Source: GitHub Actions).

### Any other static host

Upload the contents of `dist/` to Netlify, Cloudflare Pages, S3, or any HTTP server. No special configuration is required — the app makes no runtime network calls and works fully offline once the page has loaded.

## Persistence

The app uses `localStorage` to remember:

- the default number of questions (set with the "Set as default" button next to the count input);
- the categories selected when you last started a test (restored on next load).

Nothing else is tracked — there is no scoring, grading, or history.
