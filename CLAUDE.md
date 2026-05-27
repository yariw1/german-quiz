# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # validate vocabulary + start Vite dev server (localhost:5173)
npm run build      # validate + tsc + build to dist/
npm run validate   # validate src/data/vocabulary.json against schema only
npm run preview    # preview production build locally
```

No test runner is configured — TypeScript strict mode (`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`) is the primary code quality gate.

## Architecture

Static offline-capable SPA: Vite 5 + React 18 + TypeScript 5, zero runtime dependencies beyond React.

**Three-screen state machine** in [src/App.tsx](src/App.tsx) — no router:
1. **Settings** — category/group/field selection, question count
2. **Question** — quiz prompt + reveal
3. **Summary** — results; option to repeat missed questions

State flow: `App.tsx` owns screen kind + questions array + current index. Components are thin display layers. Quiz logic lives in [src/quiz.ts](src/quiz.ts). localStorage persistence (defaults + last-selected categories) in [src/storage.ts](src/storage.ts).

## Vocabulary Data

[src/data/vocabulary.json](src/data/vocabulary.json) is bundled at build time. Schema:

```
Category { name, header: FieldDef[], groups: Group[] }
FieldDef  { name, questionable: boolean }
Group     { id: string|number, items: Item[] }
Item      Record<string, string>   // all field values must be strings
```

Only fields with `questionable: true` are eligible as quiz prompts. The validator ([scripts/validate-vocabulary.mjs](scripts/validate-vocabulary.mjs)) enforces uniqueness of category names, field names within a category, and group IDs within a category. It runs automatically before `dev` and `build`.

## Deployment

GitHub Actions workflow ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)) validates → builds → deploys to GitHub Pages. Vite is configured with `base: './'` so assets work on any subpath.
