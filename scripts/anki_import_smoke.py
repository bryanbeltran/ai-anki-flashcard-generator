"""Import a Recall APKG with Anki's collection backend and check its templates."""

from pathlib import Path
import sys
import tempfile


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python3 scripts/anki_import_smoke.py <deck.apkg>", file=sys.stderr)
        return 2

    try:
        from anki.collection import Collection
        from anki.importing import _LegacyAnkiPackageImporter
    except ModuleNotFoundError as error:
        print("Install Anki's Python backend first: python3 -m pip install anki", file=sys.stderr)
        print(error, file=sys.stderr)
        return 2

    package = Path(sys.argv[1]).resolve()
    if not package.is_file():
        print(f"APKG not found: {package}", file=sys.stderr)
        return 2

    with tempfile.TemporaryDirectory(prefix="recall-anki-import-") as directory:
        collection = Collection(str(Path(directory) / "collection.anki2"))
        _LegacyAnkiPackageImporter(collection, str(package)).run()
        notes = collection.db.scalar("select count() from notes")
        cards = collection.db.scalar("select count() from cards")
        models = {model["name"] for model in collection.models.all()}
        unicode_notes = collection.db.scalar("select count() from notes where flds like '%α(n)%'")
        expected = {"Recall Basic", "Recall Basic (reversed)", "Recall Cloze", "Recall Basic (type-in)"}
        assert notes == 7, f"expected 7 notes, got {notes}"
        assert cards == 8, f"expected 8 cards, got {cards}"
        assert unicode_notes == 1, "Unicode α(n) note was not preserved"
        assert expected <= models, f"missing templates: {expected - models}"
        assert collection.decks.by_name("Recall Guided Demo — Evidence-aware cards")
        collection.close()

    print(f"Anki import passed: {notes} notes, {cards} cards, Unicode α(n), four Recall templates")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
