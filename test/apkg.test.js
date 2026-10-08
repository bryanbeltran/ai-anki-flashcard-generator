import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { buildExport } from "../src/exporter.js";
import { buildPracticeDecks } from "../src/practice-data.js";

test("APKG export is a readable Anki deck package", () => {
  const artifact = buildExport(buildPracticeDecks()[0], { format: "apkg" });
  assert.equal(artifact.format, "apkg");
  assert.equal(artifact.notes, 81);
  assert.equal(artifact.cards, 81);
  assert.match(artifact.fileName, /\.apkg$/);
  assert.equal(artifact.body.subarray(0, 2).toString(), "PK");

  const check = spawnSync("python3", ["-c", `
import io
import json
import sqlite3
import sys
import tempfile
import zipfile

package = zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read()))
assert set(package.namelist()) == {"collection.anki2", "media"}
database = tempfile.NamedTemporaryFile(suffix=".anki2", delete=False)
database.write(package.read("collection.anki2"))
database.close()
connection = sqlite3.connect(database.name)
assert connection.execute("select count(*) from notes").fetchone()[0] == 81
assert connection.execute("select count(*) from cards").fetchone()[0] == 81
models = json.loads(connection.execute("select models from col").fetchone()[0])
decks = json.loads(connection.execute("select decks from col").fetchone()[0])
assert len(models) == 1
assert list(decks.values())[0]["name"] == "Korean Foundations — Alphabet + Sight Words"
connection.close()
`], { input: artifact.body, maxBuffer: 1_000_000 });
  assert.equal(check.status, 0, check.stderr?.toString() || check.stdout?.toString());
});
