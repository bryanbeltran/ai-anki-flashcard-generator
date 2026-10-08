import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildExport } from "./exporter.js";
import { buildPracticeDecks, inferDifficulty, PRACTICE_SNAPSHOT } from "./practice-data.js";
import { sanitizeFileName } from "./domain.js";
import { applyValidation } from "./validator.js";

const command = process.argv[2];

if (command === "seed-artifacts") {
  const outputDir = resolve("examples/decks");
  mkdirSync(outputDir, { recursive: true });
  const decks = buildPracticeDecks();
  const manifest = { generatedAt: PRACTICE_SNAPSHOT, decks: [] };
  for (const deck of decks) {
    const slug = sanitizeFileName(deck.title);
    const artifact = buildExport(deck, { format: "tsv", cardType: "all" });
    const apkg = buildExport(deck, { format: "apkg", cardType: "all" });
    writeFileSync(resolve(outputDir, `${slug}.json`), `${JSON.stringify(deck, null, 2)}\n`, "utf8");
    writeFileSync(resolve(outputDir, `${slug}.tsv`), artifact.text, "utf8");
    writeFileSync(resolve(outputDir, `${slug}.apkg`), apkg.body);
    manifest.decks.push({ slug, title: deck.title, cardCount: deck.cards.length, notes: artifact.notes, cards: artifact.cards, metrics: deck.metrics, sources: deck.sources, files: [`${slug}.json`, `${slug}.tsv`, `${slug}.apkg`] });
    console.log(`${deck.title}: ${artifact.notes} notes -> ${slug}.tsv, ${slug}.apkg`);

    if (deck.id === "practice_korean_foundations") {
      const subsets = [
        { slug: "korean-alphabet", title: "Korean Alphabet — Hangul Foundations", scopes: ["hangul-consonants", "hangul-vowels", "hangul-syllable-blocks"] },
        { slug: "korean-sight-words", title: "Korean Sight Words — English-Speaking Learners", scopes: ["korean-sight-words"] },
      ];
      for (const subset of subsets) {
        const cards = deck.cards.filter((card) => subset.scopes.includes(card.scopeId));
        const difficulty = inferDifficulty(cards);
        const subdeck = {
          ...deck,
          id: `practice_${subset.slug.replaceAll("-", "_")}`,
          title: subset.title,
          cards,
          brief: { ...deck.brief, deckName: subset.title, cardCount: cards.length, difficulty, includedScope: subset.scopes.join(", ") },
          plan: { ...deck.plan, difficulty, requestedCardCount: cards.length, scope: deck.plan.scope.filter((scope) => subset.scopes.includes(scope.id)), objectives: deck.plan.objectives.filter((objective) => subset.scopes.includes(objective.scopeId)) },
        };
        applyValidation(subdeck, { timestamp: PRACTICE_SNAPSHOT });
        const subArtifact = buildExport(subdeck, { format: "tsv", cardType: "all" });
        const subApkg = buildExport(subdeck, { format: "apkg", cardType: "all" });
        writeFileSync(resolve(outputDir, `${subset.slug}.json`), `${JSON.stringify(subdeck, null, 2)}\n`, "utf8");
        writeFileSync(resolve(outputDir, `${subset.slug}.tsv`), subArtifact.text, "utf8");
        writeFileSync(resolve(outputDir, `${subset.slug}.apkg`), subApkg.body);
        manifest.decks.push({ slug: subset.slug, title: subset.title, cardCount: cards.length, notes: subArtifact.notes, cards: subArtifact.cards, metrics: subdeck.metrics, sources: subdeck.sources, parentDeck: slug, files: [`${subset.slug}.json`, `${subset.slug}.tsv`, `${subset.slug}.apkg`] });
        console.log(`${subset.title}: ${subArtifact.notes} notes -> ${subset.slug}.tsv, ${subset.slug}.apkg`);
      }
    }
  }
  writeFileSync(resolve(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Wrote ${decks.length} practice decks to ${outputDir}`);
} else {
  console.error("Usage: node src/cli.js seed-artifacts");
  process.exitCode = 1;
}
