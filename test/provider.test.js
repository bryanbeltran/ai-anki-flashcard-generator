import test from "node:test";
import assert from "node:assert/strict";
import { OpenAIProvider } from "../src/provider.js";

test("Responses API provider requests structured deck output and preserves source IDs", async () => {
  let request;
  const fakeFetch = async (url, options) => {
    request = { url, options };
    return {
      ok: true,
      async json() {
        return { output_text: JSON.stringify({ cards: [{ type: "basic", front: "Q", back: "A", extra: "", tags: [], scopeId: "scope_1", objective: "recall", difficulty: "foundational", claimIds: ["claim_1"], sourceIds: ["source_1"], typeRationale: "direct" }], sources: [], claims: [] }) };
      },
    };
  };
  const provider = new OpenAIProvider({ apiKey: "test-key", model: "gpt-test", fetchImpl: fakeFetch });
  const result = await provider.generate({ brief: { topic: "Trees" }, plan: { scope: [{ id: "scope_1", label: "Trees" }] }, sources: [{ id: "source_1", title: "Reference" }] });
  assert.equal(result.provider, "openai-responses:gpt-test");
  assert.equal(result.cards[0].sourceIds[0], "source_1");
  assert.equal(request.url, "https://api.openai.com/v1/responses");
  assert.match(request.options.headers.authorization, /^Bearer test-key$/);
  const body = JSON.parse(request.options.body);
  assert.equal(body.text.format.type, "json_schema");
  assert.equal(body.text.format.strict, true);
});
