# Anki compatibility check

Recall exports a legacy-compatible `.apkg` containing `collection.anki2` and a `media` manifest. The export test suite checks the ZIP and SQLite structure; this document records the stronger headless import check against Anki's collection backend.

## Verified coverage

The guided demo contains seven notes and eight generated cards:

| Recall template | Notes | Anki cards |
| --------------- | ----: | ---------: |
| Basic           |     3 |          3 |
| Reversed Basic  |     1 |          2 |
| Cloze           |     1 |          1 |
| Type-in         |     1 |          1 |

The import check also confirms that the Unicode `α(n)` notation survives in a note field and that the deck name and all four Recall note models are present after import.

## Reproduce the check

The repository itself stays dependency-free at runtime. Install Anki's optional Python backend in a disposable environment, regenerate artifacts, then run the smoke check:

```bash
python3 -m venv /var/tmp/recall-anki-venv
/var/tmp/recall-anki-venv/bin/pip install anki
TMPDIR=/var/tmp npm run seed-artifacts
TMPDIR=/var/tmp /var/tmp/recall-anki-venv/bin/python \
  scripts/anki_import_smoke.py \
  examples/decks/recall-guided-demo-evidence-aware-cards.apkg
```

Expected result:

```text
Anki import passed: 7 notes, 8 cards, Unicode α(n), four Recall templates
```

This is a headless collection-backend import, not a claim that AnkiMobile or every desktop UI version was manually opened. Media packaging remains intentionally out of scope; the demo contains text-only notes and an empty media manifest.
