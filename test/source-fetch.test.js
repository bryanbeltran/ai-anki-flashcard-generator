import test from "node:test";
import assert from "node:assert/strict";
import { createServer as nodeCreateServer } from "node:http";
import { createApp } from "../src/server.js";
import { DeterministicProvider } from "../src/provider.js";
import { MemoryStore } from "../src/store.js";

async function listen(server) {
  await new Promise((resolve) => server.listen(0, resolve));
  return `http://127.0.0.1:${server.address().port}`;
}

test("HTTP source refresh stores a bounded text snapshot and hash", async () => {
  const fixture = nodeCreateServer((req, res) => {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("A binary heap keeps the highest-priority item at the root.");
  });
  const fixtureBase = await listen(fixture);
  const app = createApp({ store: new MemoryStore(), provider: new DeterministicProvider() });
  const appBase = await listen(app);
  try {
    const headers = { "content-type": "application/json" };
    const create = await fetch(`${appBase}/api/projects`, { method: "POST", headers, body: JSON.stringify({ title: "Source fetch" }) });
    const project = await create.json();
    const addedResponse = await fetch(`${appBase}/api/projects/${project.id}/sources`, { method: "POST", headers, body: JSON.stringify({ title: "Fixture", url: fixtureBase, quality: "reference" }) });
    const added = await addedResponse.json();
    const sourceId = added.sources.at(-1).id;
    const refreshedResponse = await fetch(`${appBase}/api/projects/${project.id}/sources/${sourceId}/fetch`, { method: "POST", headers, body: "{}" });
    assert.equal(refreshedResponse.ok, true);
    const refreshed = await refreshedResponse.json();
    const source = refreshed.sources.find((item) => item.id === sourceId);
    assert.equal(source.accessStatus, "available");
    assert.match(source.contentPreview, /binary heap/);
    assert.match(source.contentHash, /^[a-f0-9]{64}$/);
  } finally {
    await new Promise((resolve) => app.close(resolve));
    await new Promise((resolve) => fixture.close(resolve));
  }
});
