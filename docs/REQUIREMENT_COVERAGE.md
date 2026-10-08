# Product requirements coverage

The Notion requirements define a broad product and an explicit MVP boundary. This table records the current repository evidence instead of treating a passing unit test as proof of the whole product.

| Requirement area | Current implementation | Evidence |
| --- | --- | --- |
| Intake and adaptive clarification | Normalized learning brief, required/optional questions, visible assumptions, exact count and count-range handling | `src/domain.js`, `test/domain.test.js` |
| Scope and plan | Scope tree, objective records, allocation, type/difficulty distribution, approval gate before generation | `src/domain.js`, `src/service.js`, API flow test |
| Source ingestion | Pasted content and HTTP(S) URL metadata, bounded snapshot content, SHA-256 snapshot IDs, source redaction | `src/service.js`, `/sources` API, `test/api.test.js` |
| Codex generation seam | Deterministic offline provider plus explicit Responses API provider with strict JSON schema and source-ID provenance | `src/provider.js`, `test/provider.test.js` |
| Card taxonomy | Basic, reversed-basic, cloze, and type-in schemas; cloze syntax and type-in accepted-answer gates; user override | `src/validator.js`, review UI |
| Fact/evidence controls | Claim records, source IDs, excerpts, confidence, stale/conflicting/media findings, explicit verify action | `src/validator.js`, `src/service.js`, curated deck JSON |
| Completeness | Required-scope coverage matrix, exact/ranged count gates, distribution metrics, duplicate detection and gap findings | `src/validator.js`, `test/quality.test.js` |
| Review lifecycle | Draft/needs-review/approved/rejected/locked states, field edits, revision history, regeneration, bulk actions | `src/service.js`, `src/public/app.js`, API tests |
| Portfolio-ready workspace | Responsive Recall shell, skip navigation, keyboard-visible focus, reduced-motion support, workflow navigation, first-class project dialog, review search/filter, incremental card rendering, busy states, and live feedback | `src/public/index.html`, `src/public/app.js`, `src/public/styles.css` |
| Export | UTF-8 TSV/CSV, legacy-compatible `.apkg` packages, escaping, explicit six-column mapping, preview endpoint, direct Anki download URL, hard-gate blocking, export history | `src/exporter.js`, `src/apkg.js`, `src/server.js`, API and APKG tests |
| Persistence and recovery | Local JSON persistence, memory-store test seam, runs, idempotency key handling, duplication, cancellation-ready endpoint | `src/store.js`, `src/service.js` |
| Practice content | Source-linked Korean Foundations deck, independent Korean alphabet and sight-word subsets, data-structures interview deck | `examples/decks/`, `src/practice-data.js`, `npm run seed-artifacts` |
| Quality automation | Node test suite, deterministic artifact regeneration, GitHub Actions on Node 20 and 22 | `test/`, `.github/workflows/ci.yml` |

## Explicit next-phase boundaries

These are called out as follow-on phases in the Notion requirements and are not represented as misleading partial features: media upload/attachment packaging, image occlusion, authentication and multi-user sharing, Anki scheduler integration, and an asynchronous worker queue. The provider, run, export, and persistence seams are kept separate so those phases can be added without changing the card/evidence contracts.
