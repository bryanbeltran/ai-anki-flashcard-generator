import test from "node:test";
import assert from "node:assert/strict";
import { buildExport } from "../src/exporter.js";
import { buildPracticeDecks } from "../src/practice-data.js";
import { applyValidation, validateProject } from "../src/validator.js";
import { createProject, normalizeBrief } from "../src/domain.js";

test("curated practice decks satisfy evidence, coverage, count, and export gates", () => {
  const decks = buildPracticeDecks();
  assert.equal(decks.length, 2);
  assert.ok(decks[0].cards.some((card) => card.front.includes("ㄱ")));
  assert.ok(decks[0].cards.some((card) => card.front.includes("안녕하세요")));
  assert.ok(decks[1].cards.some((card) => card.front.includes("hash table")));
  for (const deck of decks) {
    assert.equal(deck.metrics.hardGateCount, 0);
    assert.equal(deck.metrics.coveragePercent, 100);
    assert.equal(deck.metrics.exportableCards, deck.cards.length);
    const artifact = buildExport(deck);
    assert.match(artifact.text, /#columns:Front\tBack\tExtra\tTags\tCardType\tSource/);
    assert.equal(artifact.notes, deck.cards.length);
  }
});

test("validator blocks exact-count drift and duplicate fronts", () => {
  const project = createProject({ title: "Quality", brief: normalizeBrief({ topic: "Test", cardCount: 2 }) });
  project.plan = { requestedCardCount: 2, scope: [{ id: "scope_1", label: "Core", required: true }, { id: "scope_2", label: "Missing", required: true }] };
  project.sources = [{ id: "source_1", title: "Test source", url: "https://example.com", type: "reference", quality: "authoritative" }];
  project.claims = [{ id: "claim_1", text: "A", sourceIds: ["source_1"] }];
  project.cards = [{ id: "card_1", type: "basic", front: "Same?", back: "A", extra: "", tags: [], scopeId: "scope_1", claimIds: ["claim_1"], sourceIds: ["source_1"], evidenceStatus: "verified", status: "approved" }];
  const result = validateProject(project);
  assert.ok(result.findings.some((finding) => finding.ruleId === "count.exact" && finding.severity === "error"));
  assert.ok(result.findings.some((finding) => finding.ruleId === "coverage.required"));
  project.brief.cardCount = null;
  project.cards.push({ ...project.cards[0], id: "card_2" });
  applyValidation(project);
  assert.equal(project.metrics.duplicateCount, 1);
});

test("validator catches malformed cloze and missing type-in answers", () => {
  const project = createProject({ title: "Types", brief: normalizeBrief({ topic: "Types", cardCount: 2, sourcePolicy: "source-only" }) });
  project.plan = { requestedCardCount: 2, scope: [{ id: "scope_1", label: "Core", required: true }] };
  project.sources = [{ id: "source_1", title: "Source", url: "https://example.com", type: "reference", quality: "authoritative" }];
  project.claims = [{ id: "claim_1", text: "C", sourceIds: ["source_1"] }];
  project.cards = [
    { id: "card_1", type: "cloze", front: "This has no deletion", back: "", extra: "", tags: [], scopeId: "scope_1", claimIds: ["claim_1"], sourceIds: ["source_1"], evidenceStatus: "verified", status: "approved" },
    { id: "card_2", type: "type-in", front: "Type it", back: "answer", extra: "", tags: [], scopeId: "scope_1", claimIds: ["claim_1"], sourceIds: ["source_1"], evidenceStatus: "verified", status: "approved" },
  ];
  const result = validateProject(project);
  assert.ok(result.findings.some((finding) => finding.ruleId === "type.cloze-syntax"));
  assert.ok(result.findings.some((finding) => finding.ruleId === "type.accepted-answers"));
});
