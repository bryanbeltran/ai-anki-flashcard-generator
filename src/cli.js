import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildExport } from "./exporter.js";
import { buildPracticeDecks } from "./practice-data.js";
import { sanitizeFileName } from "./domain.js";

const command = process.argv[2];

if (command === "seed-artifacts") {
  const outputDir = resolve("examples/decks");
  mkdirSync(outputDir, { recursive: true });
  const decks = buildPracticeDecks();
  const manifest = { generatedAt: new Date().toISOString(), decks: [] };
  for (const deck of decks) {
    const slug = sanitizeFileName(deck.title);
    const artifact = buildExport(deck, { format: "tsv", cardType: "all" });
    writeFileSync(resolve(outputDir, `${slug}.json`), `${JSON.stringify(deck, null, 2)}\n`, "utf8");
    writeFileSync(resolve(outputDir, `${slug}.tsv`), artifact.text, "utf8");
    manifest.decks.push({ slug, title: deck.title, cardCount: deck.cards.length, notes: artifact.notes, cards: artifact.cards, metrics: deck.metrics, sources: deck.sources });
    console.log(`${deck.title}: ${artifact.notes} notes -> ${slug}.tsv`);
  }
  writeFileSync(resolve(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Wrote ${decks.length} practice decks to ${outputDir}`);
} else {
  console.error("Usage: node src/cli.js seed-artifacts");
  process.exitCode = 1;
}
