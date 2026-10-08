import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deflateRawSync } from "node:zlib";

const SQLITE_SCHEMA = String.raw`
CREATE TABLE col (
  id integer primary key,
  crt integer not null,
  mod integer not null,
  scm integer not null,
  ver integer not null,
  dty integer not null,
  usn integer not null,
  ls integer not null,
  conf text not null,
  models text not null,
  decks text not null,
  dconf text not null,
  tags text not null
);
CREATE TABLE notes (
  id integer primary key,
  guid text not null,
  mid integer not null,
  mod integer not null,
  usn integer not null,
  tags text not null,
  flds text not null,
  sfld integer not null,
  csum integer not null,
  flags integer not null,
  data text not null
);
CREATE TABLE cards (
  id integer primary key,
  nid integer not null,
  did integer not null,
  ord integer not null,
  mod integer not null,
  usn integer not null,
  type integer not null,
  queue integer not null,
  due integer not null,
  ivl integer not null,
  factor integer not null,
  reps integer not null,
  lapses integer not null,
  left integer not null,
  odue integer not null,
  odid integer not null,
  flags integer not null,
  data text not null
);
CREATE TABLE revlog (
  id integer primary key,
  cid integer not null,
  usn integer not null,
  ease integer not null,
  ivl integer not null,
  lastIvl integer not null,
  factor integer not null,
  time integer not null,
  type integer not null
);
CREATE TABLE graves (
  usn integer not null,
  oid integer not null,
  type integer not null
);
CREATE INDEX ix_notes_usn ON notes (usn);
CREATE INDEX ix_cards_usn ON cards (usn);
CREATE INDEX ix_revlog_usn ON revlog (usn);
CREATE INDEX ix_cards_nid ON cards (nid);
CREATE INDEX ix_cards_sched ON cards (did, queue, due);
CREATE INDEX ix_revlog_cid ON revlog (cid);
CREATE INDEX ix_notes_csum ON notes (csum);
`;

const PYTHON_SQLITE_BUILDER = String.raw`
import json
import sqlite3
import sys

database_path = sys.argv[1]
payload = json.load(sys.stdin)
connection = sqlite3.connect(database_path)
# Zero deleted page content so APKG bytes do not depend on the host SQLite build.
connection.execute("PRAGMA secure_delete = ON")
connection.executescript(payload["schema"])
connection.execute(
    "INSERT INTO col VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    payload["collection"],
)
connection.executemany(
    "INSERT INTO notes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    payload["notes"],
)
connection.executemany(
    "INSERT INTO cards VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    payload["cards"],
)
connection.commit()
connection.execute("VACUUM")
connection.close()
`;

const ZIP_LOCAL_FILE = 0x04034b50;
const ZIP_CENTRAL_FILE = 0x02014b50;
const ZIP_END = 0x06054b50;
const ZIP_VERSION = 20;
// Keep SQLite's transaction metadata fixed so APKG bytes do not depend on the
// host Python/SQLite transaction behavior.
const SQLITE_CHANGE_COUNTER = 14;
const SQLITE_CHANGE_COUNTER_OFFSET = 24;
const SQLITE_VERSION_VALID_FOR_OFFSET = 92;
// SQLite stores the library version that last wrote a database in its header.
// Keep that metadata fixed so APKG bytes do not depend on the host SQLite build.
const SQLITE_FILE_VERSION = 3_046_001;
const SQLITE_FILE_VERSION_OFFSET = 96;
const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}

function dosDateParts(timestamp) {
  const date = new Date(timestamp);
  const year = Math.max(1980, date.getUTCFullYear());
  return {
    time: (date.getUTCHours() << 11) | (date.getUTCMinutes() << 5) | Math.floor(date.getUTCSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getUTCMonth() + 1) << 5) | date.getUTCDate(),
  };
}

function zipArchive(entries, timestamp) {
  const parts = [];
  const central = [];
  let offset = 0;
  const dos = dosDateParts(timestamp);
  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const content = Buffer.isBuffer(entry.body) ? entry.body : Buffer.from(entry.body);
    const compressed = entry.store ? content : deflateRawSync(content, { level: 9 });
    const method = entry.store ? 0 : 8;
    const checksum = crc32(content);
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(ZIP_LOCAL_FILE, 0);
    local.writeUInt16LE(ZIP_VERSION, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(dos.time, 10);
    local.writeUInt16LE(dos.date, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(content.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    name.copy(local, 30);
    parts.push(local, compressed);

    const directory = Buffer.alloc(46 + name.length);
    directory.writeUInt32LE(ZIP_CENTRAL_FILE, 0);
    directory.writeUInt16LE(ZIP_VERSION, 4);
    directory.writeUInt16LE(ZIP_VERSION, 6);
    directory.writeUInt16LE(0, 8);
    directory.writeUInt16LE(method, 10);
    directory.writeUInt16LE(dos.time, 12);
    directory.writeUInt16LE(dos.date, 14);
    directory.writeUInt32LE(checksum, 16);
    directory.writeUInt32LE(compressed.length, 20);
    directory.writeUInt32LE(content.length, 24);
    directory.writeUInt16LE(name.length, 28);
    directory.writeUInt16LE(0, 30);
    directory.writeUInt16LE(0, 32);
    directory.writeUInt16LE(0, 34);
    directory.writeUInt16LE(0, 36);
    directory.writeUInt32LE(0, 38);
    directory.writeUInt32LE(offset, 42);
    name.copy(directory, 46);
    central.push(directory);
    offset += local.length + compressed.length;
  }
  const centralBody = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(ZIP_END, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBody.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...parts, centralBody, end]);
}

function stableNumber(value) {
  const hex = createHash("sha256").update(String(value), "utf8").digest("hex").slice(0, 13);
  return Number.parseInt(hex, 16) || 1;
}

function safeText(value) {
  return String(value ?? "").replace(/\u001f/g, " ");
}

function ankiHtml(value) {
  return safeText(value)
    .replace(/\r?\n/g, "<br>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
}

function ankiTags(tags) {
  return ` ${(tags || []).map((tag) => safeText(tag).trim().replace(/\s+/g, "-")).filter(Boolean).join(" ")} `;
}

function sourceText(row) {
  return safeText(row.Source);
}

function modelDefinition(kind, modelId, deckId, timestamp) {
  const basicFields = [
    { name: "Front", ord: 0, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },
    { name: "Back", ord: 1, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },
    { name: "Extra", ord: 2, sticky: false, rtl: false, font: "Arial", size: 16, media: [] },
    { name: "Source", ord: 3, sticky: false, rtl: false, font: "Arial", size: 12, media: [] },
  ];
  const css = ".card { font-family: arial; font-size: 20px; text-align: center; color: black; background-color: white; }";
  const templates = {
    basic: [{ name: "Card 1", ord: 0, qfmt: "{{Front}}", afmt: "{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}<br>{{Extra}}", bqfmt: "", bafmt: "", bfont: "", bsize: 0, did: null }],
    "reversed-basic": [
      { name: "Card 1", ord: 0, qfmt: "{{Front}}", afmt: "{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}<br>{{Extra}}", bqfmt: "", bafmt: "", bfont: "", bsize: 0, did: null },
      { name: "Card 2", ord: 1, qfmt: "{{Back}}", afmt: "{{FrontSide}}\n\n<hr id=answer>\n\n{{Front}}<br>{{Extra}}", bqfmt: "", bafmt: "", bfont: "", bsize: 0, did: null },
    ],
    "type-in": [{ name: "Card 1", ord: 0, qfmt: "{{Front}}<br>{{type:Back}}", afmt: "{{Front}}<br><hr id=answer>{{Back}}<br>{{Extra}}", bqfmt: "", bafmt: "", bfont: "", bsize: 0, did: null }],
  };
  const isCloze = kind === "cloze";
  const fields = isCloze
    ? [
        { name: "Text", ord: 0, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },
        { name: "Back Extra", ord: 1, sticky: false, rtl: false, font: "Arial", size: 16, media: [] },
        { name: "Source", ord: 2, sticky: false, rtl: false, font: "Arial", size: 12, media: [] },
      ]
    : basicFields;
  const tmpls = isCloze
    ? [{ name: "Cloze", ord: 0, qfmt: "{{cloze:Text}}", afmt: "{{cloze:Text}}<br>{{Back Extra}}", bqfmt: "", bafmt: "", bfont: "", bsize: 0, did: null }]
    : templates[kind] || templates.basic;
  const req = isCloze ? [[0, "any", [0]]] : tmpls.map((template, index) => [index, "all", [index === 1 ? 1 : 0]]);
  return {
    css,
    did: deckId,
    flds: fields,
    id: String(modelId),
    latexPost: "\\end{document}",
    latexPre: "\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n",
    latexsvg: false,
    mod: Math.floor(timestamp / 1000),
    name: `Recall ${isCloze ? "Cloze" : kind === "reversed-basic" ? "Basic (reversed)" : kind === "type-in" ? "Basic (type-in)" : "Basic"}`,
    req,
    sortf: 0,
    tags: [],
    tmpls,
    type: isCloze ? 1 : 0,
    usn: -1,
    vers: [],
  };
}

function buildCollectionPayload(project, rows, timestamp) {
  const deckName = safeText(project.brief?.deckName || project.title || "Recall deck").trim() || "Recall deck";
  const deckId = stableNumber(`deck:${deckName}`);
  const modelKinds = [...new Set(rows.map((row) => ["basic", "reversed-basic", "cloze", "type-in"].includes(row.CardType) ? row.CardType : "basic"))];
  const models = Object.fromEntries(modelKinds.map((kind) => [String(stableNumber(`model:${deckName}:${kind}`)), modelDefinition(kind, stableNumber(`model:${deckName}:${kind}`), deckId, timestamp)]));
  const firstModelId = Number(Object.keys(models)[0]);
  const decks = {
    [deckId]: {
      collapsed: false,
      conf: 1,
      desc: "",
      dyn: 0,
      extendNew: 10,
      extendRev: 50,
      id: deckId,
      lrnToday: [0, 0],
      mod: Math.floor(timestamp / 1000),
      name: deckName,
      newToday: [0, 0],
      revToday: [0, 0],
      timeToday: [0, 0],
      usn: -1,
    },
  };
  const conf = {
    activeDecks: [deckId],
    addToCur: true,
    collapseTime: 1200,
    curDeck: deckId,
    curModel: String(firstModelId),
    dueCounts: true,
    estTimes: true,
    newBury: true,
    newSpread: 0,
    nextPos: rows.length + 1,
    sortBackwards: false,
    sortType: "noteFld",
    timeLim: 0,
  };
  const dconf = {
    "1": {
      autoplay: true,
      id: 1,
      lapse: { delays: [10], leechAction: 0, leechFails: 8, minInt: 1, mult: 0 },
      maxTaken: 60,
      mod: 0,
      name: "Default",
      new: { bury: true, delays: [1, 10], initialFactor: 2500, ints: [1, 4, 7], order: 1, perDay: 20, separate: true },
      replayq: true,
      rev: { bury: true, ease4: 1.3, fuzz: 0.05, ivlFct: 1, maxIvl: 36500, minSpace: 1, perDay: 100 },
      timer: 0,
      usn: -1,
    },
  };
  const notes = [];
  const cards = [];
  rows.forEach((row, index) => {
    const kind = modelKinds.includes(row.CardType) ? row.CardType : "basic";
    const modelId = stableNumber(`model:${deckName}:${kind}`);
    const stableId = safeText(row.StableId || row.Front || `row-${index + 1}`);
    const noteId = stableNumber(`note:${deckName}:${stableId}`);
    const front = ankiHtml(row.Front);
    const back = ankiHtml(row.Back);
    const extra = ankiHtml(row.Extra);
    const source = ankiHtml(sourceText(row));
    const fields = kind === "cloze" ? [front, `${back}${extra ? `<br>${extra}` : ""}`, source] : [front, back, extra, source];
    const tags = ankiTags(String(row.Tags || "").split(/\s+/));
    const guid = createHash("sha256").update(`guid:${deckName}:${stableId}`, "utf8").digest("hex").slice(0, 16);
    notes.push([noteId, guid, modelId, Math.floor(timestamp / 1000), -1, tags, fields.join("\u001f"), Number.parseInt(createHash("sha1").update(front, "utf8").digest("hex").slice(0, 8), 16), 0, 0, ""]);
    const templateCount = kind === "reversed-basic" ? 2 : 1;
    for (let ord = 0; ord < templateCount; ord += 1) {
      const cardId = stableNumber(`card:${deckName}:${stableId}:${ord}`);
      cards.push([cardId, noteId, deckId, ord, Math.floor(timestamp / 1000), -1, 0, 0, index + ord, 0, 0, 0, 0, 0, 0, 0, 0, ""]);
    }
  });
  return {
    schema: SQLITE_SCHEMA,
    collection: [1, Math.floor(timestamp / 1000), Math.floor(timestamp / 1000), timestamp, 11, 0, 0, 0, JSON.stringify(conf), JSON.stringify(models), JSON.stringify(decks), JSON.stringify(dconf), "{}"],
    notes,
    cards,
    deckId,
    noteCount: notes.length,
    cardCount: cards.length,
  };
}

function buildSqlite(payload) {
  const directory = mkdtempSync(join(tmpdir(), "recall-apkg-"));
  const databasePath = join(directory, "collection.anki2");
  try {
    const result = spawnSync(process.env.RECALL_PYTHON || "python3", ["-c", PYTHON_SQLITE_BUILDER, databasePath], {
      input: Buffer.from(JSON.stringify(payload)),
      maxBuffer: 2_000_000,
      stdio: ["pipe", "ignore", "pipe"],
    });
    if (result.error || result.status !== 0) {
      const detail = result.error?.message || result.stderr?.toString("utf8").trim() || `exit code ${result.status}`;
      throw new Error(`APKG export requires Python 3 with sqlite3: ${detail}`);
    }
    const database = readFileSync(databasePath);
    database.writeUInt32BE(SQLITE_CHANGE_COUNTER, SQLITE_CHANGE_COUNTER_OFFSET);
    database.writeUInt32BE(SQLITE_CHANGE_COUNTER, SQLITE_VERSION_VALID_FOR_OFFSET);
    database.writeUInt32BE(SQLITE_FILE_VERSION, SQLITE_FILE_VERSION_OFFSET);
    return database;
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

export function buildApkg(project, rows, { timestamp = Date.now(), cardType = "all" } = {}) {
  if (!rows.length) throw new Error("No approved cards are available for this export.");
  const payload = buildCollectionPayload(project, rows, timestamp);
  const collection = buildSqlite(payload);
  const body = zipArchive([
    // Store SQLite bytes so APKG output is independent of the host Node/zlib build.
    { name: "collection.anki2", body: collection, store: true },
    { name: "media", body: Buffer.from("{}", "utf8"), store: true },
  ], timestamp);
  return {
    body,
    contentType: "application/apkg",
    format: "apkg",
    cardType,
    notes: payload.noteCount,
    cards: payload.cardCount,
    fileName: `${safeText(project.brief?.deckName || project.title || "recall-deck").trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "recall-deck"}.apkg`,
    exportedAt: new Date(timestamp).toISOString(),
    columns: ["Front", "Back", "Extra", "Tags", "CardType", "Source"],
  };
}
