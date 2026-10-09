# Recall — portfolio case study

Recall is a local-first, evidence-aware authoring workspace for Anki decks. It makes the decisions that are normally hidden inside a generation prompt observable: learner goal, scope, source snapshot, claim, review state, validation findings, and export mapping.

## The product story

The guided demo is the fastest way to see the product. It opens seven useful cards without an API key, including Basic, Reversed Basic, Cloze, and Type-in templates. Open a card to inspect its claim, supporting excerpt, source snapshot hash, and verification history, then preview or download the APKG.

The optional generation path remains intentionally honest: the deterministic offline provider creates draft candidates that say when an answer still needs evidence. Curated practice data is the portfolio/demo path; it is not presented as model output.

## Architecture

```text
learning brief → scoped plan → source snapshots → claims → card candidates
       ↓                                                  ↓
  clarification                                      review + verify
                                                          ↓
                            validation gates → TSV / CSV / APKG
```

The Node service owns lifecycle transitions and persistence. The provider seam supports deterministic offline generation and an explicit Responses API provider. The browser is a dependency-free client of the same HTTP API used by integration tests. APKG generation builds the SQLite collection with Python's standard-library `sqlite3`, then writes a deterministic ZIP.

## Deliberate tradeoffs

- Local JSON persistence keeps the project inspectable and easy to run, but is not a multi-user database.
- Human verification is a gate for trustworthy export; the app does not silently promote an ungrounded model answer.
- Text-only APKG packaging is reliable and testable now; media packaging and image occlusion are explicit follow-on work.
- The default server binds to loopback and rejects cross-origin JSON mutations. Public hosting requires a real authentication, storage, egress, rate-limit, and CSRF boundary first.

## Proof of quality

```bash
npm run check       # lint, format check, syntax checks, tests, coverage gate
npm run e2e         # live Chromium flow, failure state, APKG download, mobile width
npm run seed-artifacts
```

The CI matrix runs the unit/coverage gate on Node 20 and 22, then runs the real browser flow. The Anki backend import evidence is recorded in [ANKI_IMPORT.md](./ANKI_IMPORT.md).

## 60-second walkthrough

1. Click **Try the guided demo** on the landing page.
2. Open a card and show the evidence trail: claim, excerpt, source, hash, and verification event.
3. Switch to the Export panel, preview the mapping, and download the `.apkg`.
4. Create a new project to show the honest draft path: brief → plan → generate → add source → verify → export.

Screenshots from the verified browser pass live in [`docs/screenshots/`](./screenshots/).
