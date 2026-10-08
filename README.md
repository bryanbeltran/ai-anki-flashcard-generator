# AI Anki Flashcard Generator

An executable MVP for the [AI Anki Flashcard Generator — Product Requirements](https://app.notion.com/p/3f3e75bc1fac81bdbcc7f308194f3381?pvs=204).

The app turns a learner's goal into a scoped, reviewable, evidence-aware Anki deck. It supports adaptive clarification, a visible learning plan, structured generation, claim/evidence metadata, deterministic validation, coverage and duplicate checks, review/edit/lock controls, and UTF-8 TSV export.

The repository also ships two practice decks:

- **Korean Foundations for English-Speaking Learners** — Hangul alphabet plus Korean sight words with pronunciation and usage notes.
- **Data Structures Interview Prep** — interview-style cards covering core structures, algorithms, invariants, complexity, and patterns.

## Run locally

Requires Node.js 20 or newer. The MVP has no runtime dependencies.

```bash
npm test
npm run seed-artifacts
npm start
```

Open <http://localhost:3000>.

The JSON store is created at `data/store.json` on first run. Set `ANKI_DATA_DIR` to use another data directory.

## Optional Codex/OpenAI generation

The default provider is deterministic so the app is runnable offline and tests are reproducible. To use the Responses API provider:

```bash
export ANKI_AI_PROVIDER=openai
export OPENAI_API_KEY=...
export OPENAI_MODEL=gpt-5
npm start
```

The provider is isolated behind `src/provider.js`. Provider errors are surfaced to the run; the app does not silently replace a failed AI run with unverified content.

## Practice deck artifacts

`npm run seed-artifacts` writes validated, import-oriented files to `examples/decks/`:

- `korean-foundations.json` and `korean-foundations.tsv`
- `data-structures-interview.json` and `data-structures-interview.tsv`
- `manifest.json` with card counts, validation metrics, and source metadata

The TSV uses an explicit six-column mapping:

```text
Front | Back | Extra | Tags | CardType | Source
```

The `CardType` column lets a user route Basic, Reversed Basic, Cloze, or Type-in rows to the matching Anki note type. Export validation reports the exact number of notes and cards, plus any warnings or blockers.

## API outline

- `GET /api/health`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `POST /api/projects/:id/brief`
- `POST /api/projects/:id/plan`
- `POST /api/projects/:id/generate`
- `POST /api/projects/:id/validate`
- `POST /api/projects/:id/sources`
- `POST /api/projects/:id/sources/:sourceId/fetch`
- `PATCH /api/projects/:id/cards/:cardId`
- `POST /api/projects/:id/cards/:cardId/verify`
- `POST /api/projects/:id/cards/:cardId/regenerate`
- `POST /api/projects/:id/cards/bulk`
- `POST /api/projects/:id/duplicate`
- `POST /api/projects/:id/runs/:runId/cancel`
- `GET /api/projects/:id/export?format=tsv&cardType=all`
- `GET /api/projects/:id/export/preview?format=tsv&cardType=all`
- `GET /api/practice`
- `POST /api/practice/:slug`

## Requirement coverage

The implementation deliberately keeps the first product slice local-first and dependency-free while preserving the seams required by the PRD:

- **Intake and clarification:** normalized brief plus prioritized questions.
- **Planning:** scope tree, objectives, card budget, type/difficulty distribution.
- **Evidence:** source inventory, claim records, source IDs, verification state, and source policy.
- **Generation:** deterministic offline provider and optional Responses API provider.
- **Quality:** required-field, type, evidence, duplicate, exact-count, coverage, and export gates.
- **Review:** field-level patching, locking, bulk status changes, regeneration, and diffs.
- **Export:** UTF-8 TSV with escaping, import mapping, notes/cards counts, and hard-gate enforcement.
- **Reliability:** persisted projects/runs, idempotent generation, cancellation-ready run state, and prior-good artifact preservation.

Native `.apkg` creation, media packaging, image occlusion, multi-user collaboration, and scheduler integration remain explicit follow-on phases from the PRD rather than hidden partial implementations.
