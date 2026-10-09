# Architecture and acceptance map

This repository is intentionally local-first and dependency-free. It uses one Node.js process with a small HTTP API, a static browser client, and a JSON persistence layer. The seams map directly to the requirements page so the offline MVP can be replaced by durable services without changing the user-facing contracts.

## Runtime flow

```text
Learner brief
    ↓
adaptive questions → normalized brief → scope/objective plan
    ↓                                  ↘
source snapshots → claims/evidence → structured card provider
                                      ↓
                       deterministic validation gates
                         ↙       ↓          ↘
                   coverage   review/edit   duplicates
                                      ↓
                         UTF-8 TSV/CSV or APKG export
```

## Ownership

- `src/domain.js` owns IDs, normalized brief fields, question selection, scope planning, run records, and safe defaults.
- `src/store.js` owns durable local persistence. `MemoryStore` gives API tests the same interface without touching disk.
- `src/provider.js` owns the generation seam. The deterministic provider is an offline draft generator; the optional Responses API provider requires an explicit environment setting and returns errors instead of silently producing fallback cards.
- `src/practice-data.js` owns the source-linked Recall guided demo plus Korean and data-structures examples; `src/cs6603-data.js` owns the full source-linked 22-lesson CS 6603 deck. Each card has a stable ID, objective, scope, type rationale, claim ID, source IDs, verification state, and review state.
- `src/validator.js` owns hard gates and warnings: required fields, supported types, cloze/type-in constraints, source/claim references, evidence state, duplicate detection, exact counts, required-scope coverage, approval status, and exportability metrics.
- `src/exporter.js` owns Anki-oriented TSV/CSV escaping, explicit field mapping, card-type metadata, artifact metadata, and export history records. `src/apkg.js` builds a legacy-compatible `collection.anki2` SQLite database plus a `media` manifest inside a deterministic ZIP package for direct Anki import.
- `src/service.js` owns lifecycle transitions, source ingestion and snapshot hashing, review edits, locking, regeneration, explicit verification, duplication, cancellation, and practice-deck seeding.
- `src/server.js` owns HTTP transport and maps routes to service operations. It does not contain domain rules.
- `src/public/` owns the browser workflow: brief, source entry, plan, review, evidence selection, validation, and download.

## Persisted invariants

1. A project cannot generate until a plan exists and required brief questions are confirmed.
2. A card cannot be exported unless it is approved or locked, has no hard validation errors, and is verified unless the user explicitly requests an unverified-warning export.
3. Source text is kept only in the local project store and is redacted from normal project responses; card provenance receives IDs and source URLs/titles.
4. A changed or user-edited card is returned to review and its prior verification is not assumed to remain valid.
5. Required-scope coverage and exact-count drift are hard errors.
6. Practice decks are source-linked and exportable without a model call, so the demo remains reproducible.
7. APKG export contains no external media unless media packaging is explicitly added; source URLs are retained in a hidden note field.
8. The default HTTP server binds to loopback and rejects cross-origin JSON mutations; public deployment is not part of the current trust boundary.

## Deliberate boundaries

The following are explicit next phases rather than fake partial implementations: media upload/attachment packaging, image occlusion, authentication/multi-user sharing, Anki scheduler integration, public deployment controls, and asynchronous worker queues. The API includes run/provider/idempotency seams so those additions do not require rewriting the review or validation model.
