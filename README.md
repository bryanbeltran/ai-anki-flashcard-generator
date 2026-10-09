# Recall — Evidence-aware Anki authoring

Recall is a local-first study authoring workspace for the [AI Anki Flashcard Generator — Product Requirements](https://app.notion.com/p/3f3e75bc1fac81bdbcc7f308194f3381?pvs=204). The product is branded **Recall**; `ai-anki-flashcard-generator` is the historical GitHub repository name.

It turns a learner's goal into a scoped, reviewable, evidence-aware Anki deck. The browser workspace makes the full path visible: write the brief, ground the evidence, shape the plan, review the cards, and export only when the quality gates are clear.

The repository also ships curated practice decks:

- **Korean Foundations for English-Speaking Learners** — Hangul alphabet plus Korean sight words with pronunciation and usage notes.
- **Data Structures Interview Prep** — interview-style cards covering core structures, algorithms, invariants, complexity, and patterns.
- **Georgia Tech CS 6603 — AI, Ethics, and Society** — a source-linked, 228-card deck covering all 22 public lessons in the official four-module order, from data collection and ethics through statistics, embeddings, facial recognition, predictive algorithms, fairness metrics, assessment tools, mitigation, and wrap-up.

## Run locally

Requires Node.js 20 or newer. The app has no npm runtime dependencies; APKG export additionally uses the host's `python3` and standard-library `sqlite3`.

```bash
npm test
npm run seed-artifacts
npm start
```

Open <http://localhost:3000>.

The JSON store is created at `data/store.json` on first run. Set `ANKI_DATA_DIR` to use another data directory. APKG export uses the system `python3` runtime and its standard-library `sqlite3` module to build the legacy-compatible Anki collection database.

For the portfolio path, open the app and select **Try the guided demo**. It seeds seven useful, source-linked cards with evidence and exercises Basic, Reversed Basic, Cloze, and Type-in Anki templates without requiring an API key. `npm run e2e` drives the live Chromium workflow, including the intentional no-source error state, verification history, APKG download, and a 390px mobile overflow check.

The APKG builder automatically falls back to `/var/tmp` when the default temporary directory cannot create a SQLite database. Set `RECALL_TMP_DIR` to choose a different writable temporary root.

## Product surface

The Recall workspace is intentionally designed for a portfolio-sized end-to-end story rather than a single generation endpoint:

- **Brief first:** capture learner, outcome, scope, count, difficulty, source policy, and export intent; required decisions are surfaced before generation.
- **Evidence-aware:** add pasted notes or public URLs, preserve bounded snapshots and hashes, and attach claim/source records to cards.
- **Reviewable by design:** edit, verify, approve, reject, lock, regenerate, search, and filter cards without losing revision context.
- **Quality gates:** inspect coverage, duplicate detection, evidence state, confidence, media references, stale sources, card types, and export readiness.
- **Anki-friendly handoff:** preview and download explicit UTF-8 TSV/CSV columns (`Front`, `Back`, `Extra`, `Tags`, `CardType`, `Source`), or export a packaged `.apkg` deck with deterministic note IDs and card templates.
- **Runnable demo data:** open the guided demo or any curated course deck to see the full workflow with source-linked cards.

The interface is responsive, keyboard-friendly, reduced-motion aware, and dependency-free. It uses the same HTTP API that powers the tests, so the UI and integration story remain easy to inspect.

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

- `korean-foundations-alphabet-sight-words.json` and `.tsv`
- `data-structures-interview-prep.json` and `.tsv`
- `cs-6603-ai-ethics-and-society-full-course.json` and `.tsv` contain the complete 22-lesson Georgia Tech sequence; the matching `.apkg` is ready for Anki import.
- `korean-alphabet.json` / `.tsv` and `korean-sight-words.json` / `.tsv` are independently importable Korean subsets.
- Each deck also has a directly importable `.apkg` package for Anki and AnkiMobile.
- Korean cards include a written Revised-Romanization/learner pronunciation guide in `Extra`; these packages do not contain audio.
- `manifest.json` with card counts, validation metrics, module/lesson coverage, and source metadata

The guided demo artifact is `recall-guided-demo-evidence-aware-cards.apkg`. See [the Anki import record](docs/ANKI_IMPORT.md) for the headless Anki collection-backend proof and [the portfolio case study](docs/PORTFOLIO.md) for the architecture, tradeoffs, and walkthrough.

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
- `GET /api/projects/:id/export?format=apkg&cardType=all`
- `GET /api/projects/:id/export.apkg?cardType=all` (direct URL for AnkiMobile's Download Link)
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
- **Export:** UTF-8 TSV/CSV with escaping, or a valid Anki `.apkg` containing `collection.anki2` and `media`; all formats preserve hard-gate enforcement and export metadata.
- **Reliability:** persisted projects/runs, idempotent generation, cancellation-ready run state, and prior-good artifact preservation.

Media packaging, image occlusion, multi-user collaboration, and scheduler integration remain explicit follow-on phases from the PRD rather than hidden partial implementations. APKG export currently packages card text, tags, note templates, and provenance fields; it does not fetch or bundle external media.

## Deployment boundary

Recall is intentionally local-only in this repository. The default server binds to `127.0.0.1`, state is stored in a local JSON file, and state-changing API requests require same-origin JSON. Source refresh can fetch arbitrary HTTP(S) URLs, so do not expose the process to a public network or treat it as a multi-user service. A public deployment requires authentication and tenant isolation, SSRF/egress controls, rate limits, CSRF/origin protection, and isolated durable storage; `RECALL_ALLOW_PUBLIC=true` is an explicit acknowledgement that those controls are the operator's responsibility.

## Quality gates

```bash
npm run check       # ESLint, Prettier, syntax, tests, and coverage thresholds
npm run e2e         # real Chromium browser smoke test
npm run seed-artifacts
```

The CI matrix runs the check gate on Node 20 and 22 and then runs the browser smoke test with `agent-browser`. Optional Anki import verification is documented in `docs/ANKI_IMPORT.md`.
