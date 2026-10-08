import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/server.js";
import { DeterministicProvider } from "../src/provider.js";
import { MemoryStore } from "../src/store.js";

async function start() {
  const server = createApp({ store: new MemoryStore(), provider: new DeterministicProvider() });
  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  return { server, base: `http://127.0.0.1:${address.port}` };
}

async function json(base, path, options = {}) {
  const response = await fetch(`${base}${path}`, { headers: { "content-type": "application/json" }, ...options });
  const body = await response.json();
  assert.equal(response.ok, true, `${response.status}: ${body.error || "unknown error"}`);
  return body;
}

test("API supports brief -> plan -> generate -> review -> export", async () => {
  const { server, base } = await start();
  try {
    const created = await json(base, "/api/projects", { method: "POST", body: JSON.stringify({ title: "Graph practice" }) });
    const brief = await json(base, `/api/projects/${created.id}/brief`, { method: "POST", body: JSON.stringify({ topic: "Graph algorithms", outcome: "Interview recall", audience: "Engineer", cardCount: 4, includedScope: "BFS, DFS", sourcePolicy: "mixed", confirmed: true }) });
    assert.equal(brief.brief.topic, "Graph algorithms");
    const plan = await json(base, `/api/projects/${created.id}/plan`, { method: "POST", body: "{}" });
    assert.equal(plan.plan.requestedCardCount, 4);
    const generated = await json(base, `/api/projects/${created.id}/generate`, { method: "POST", body: JSON.stringify({ idempotencyKey: "test-run-1" }) });
    assert.equal(generated.cards.length, 4);
    assert.equal(generated.status, "Needs review");
    const edited = await json(base, `/api/projects/${created.id}/cards/${generated.cards[0].id}`, { method: "PATCH", body: JSON.stringify({ front: "Edited interview prompt?" }) });
    assert.equal(edited.cards[0].status, "needs-review");
    assert.equal(edited.cards[0].revisions.length, 1);
    const approved = await json(base, `/api/projects/${created.id}/cards/bulk`, { method: "POST", body: JSON.stringify({ cardIds: generated.cards.map((card) => card.id), action: "approve" }) });
    assert.equal(approved.metrics.approvedCards, 4);
    const validated = await json(base, `/api/projects/${created.id}/validate`, { method: "POST", body: "{}" });
    assert.equal(validated.metrics.hardGateCount, 0);
    const preview = await json(base, `/api/projects/${created.id}/export/preview?format=tsv`);
    assert.equal(preview.mapping.CardType, "Anki note template selector");
    assert.equal(preview.sampleRows.length, 4);
    const exportResponse = await fetch(`${base}/api/projects/${created.id}/export?format=tsv&includeUnverified=true`);
    assert.equal(exportResponse.ok, true);
    assert.match(await exportResponse.text(), /#columns:Front\tBack\tExtra\tTags\tCardType\tSource/);
    const rejected = await json(base, `/api/projects/${created.id}/cards/bulk`, { method: "POST", body: JSON.stringify({ cardIds: [generated.cards[0].id], action: "reject" }) });
    assert.equal(rejected.cards.find((card) => card.id === generated.cards[0].id).status, "rejected");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("practice endpoint lists and creates the available decks", async () => {
  const { server, base } = await start();
  try {
    const decks = await json(base, "/api/practice");
    assert.equal(decks.decks.length, 4);
    const korean = await json(base, "/api/practice/korean-foundations", { method: "POST", body: "{}" });
    assert.equal(korean.metrics.coveragePercent, 100);
    assert.ok(korean.cards.some((card) => card.front.includes("안녕하세요")));
    const data = await json(base, "/api/practice/data-structures-interview", { method: "POST", body: "{}" });
    assert.ok(data.cards.some((card) => card.front.includes("hash table")));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("APKG export exposes a direct Anki download URL", async () => {
  const { server, base } = await start();
  try {
    const seeded = await json(base, "/api/practice/korean-sight-words", { method: "POST", body: "{}" });
    const response = await fetch(`${base}/api/projects/${seeded.id}/export.apkg`);
    assert.equal(response.ok, true);
    assert.equal(response.headers.get("content-type"), "application/apkg");
    assert.match(response.headers.get("content-disposition"), /Korean-Sight-Words-English-Speaking-Learners\.apkg/);
    assert.equal(response.headers.get("x-anki-notes"), "45");
    assert.equal(response.headers.get("x-anki-cards"), "45");
    assert.equal(Buffer.from(await response.arrayBuffer()).subarray(0, 2).toString(), "PK");

    const project = await json(base, `/api/projects/${seeded.id}`);
    assert.equal(project.exports.at(-1).format, "apkg");
    assert.equal(Object.hasOwn(project.exports.at(-1), "body"), false);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("source snapshots are redacted in responses and can verify a card", async () => {
  const { server, base } = await start();
  try {
    const created = await json(base, "/api/projects", { method: "POST", body: JSON.stringify({ title: "Evidence flow" }) });
    await json(base, `/api/projects/${created.id}/brief`, { method: "POST", body: JSON.stringify({ topic: "Trees", outcome: "Recall", audience: "Learner", cardCount: 1, confirmed: true }) });
    await json(base, `/api/projects/${created.id}/plan`, { method: "POST", body: "{}" });
    const generated = await json(base, `/api/projects/${created.id}/generate`, { method: "POST", body: JSON.stringify({ idempotencyKey: "evidence-run" }) });
    const withSource = await json(base, `/api/projects/${created.id}/sources`, { method: "POST", body: JSON.stringify({ title: "User notes", content: "A tree is a connected acyclic graph.", quality: "user-provided" }) });
    assert.equal(withSource.sources.at(-1).content, undefined);
    assert.match(withSource.sources.at(-1).contentPreview, /connected acyclic/);
    const verified = await json(base, `/api/projects/${created.id}/cards/${generated.cards[0].id}/verify`, { method: "POST", body: JSON.stringify({ sourceIds: [withSource.sources.at(-1).id], claimText: "The user notes support this card." }) });
    assert.equal(verified.metrics.verifiedCards, 1);
    assert.equal(verified.metrics.hardGateCount, 0);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
