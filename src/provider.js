import { id, isoNow } from "./domain.js";

const CARD_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["cards", "sources", "claims"],
  properties: {
    cards: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "front", "back", "extra", "tags", "scopeId", "objective", "difficulty", "claimIds", "sourceIds", "typeRationale"],
        properties: {
          type: { type: "string", enum: ["basic", "reversed-basic", "cloze", "type-in"] },
          front: { type: "string" },
          back: { type: "string" },
          extra: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          scopeId: { type: "string" },
          objective: { type: "string" },
          difficulty: { type: "string", enum: ["beginner", "foundational", "intermediate", "advanced"] },
          claimIds: { type: "array", items: { type: "string" } },
          sourceIds: { type: "array", items: { type: "string" } },
          typeRationale: { type: "string" },
          acceptedAnswers: { type: "array", items: { type: "string" } },
          confidence: { type: "number" },
          validUntil: { type: ["string", "null"] },
          media: { type: "array", items: { type: "string" } },
        },
      },
    },
    sources: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "title", "url", "type", "quality"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          url: { type: "string" },
          type: { type: "string" },
          quality: { type: "string" },
          publishedAt: { type: ["string", "null"] },
        },
      },
    },
    claims: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "text", "sourceIds"],
        properties: {
          id: { type: "string" },
          text: { type: "string" },
          sourceIds: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
};

function genericSource(brief) {
  return {
    id: "source_user_brief",
    title: "User learning brief",
    url: "",
    type: "user-provided",
    quality: "unverified",
    retrievedAt: isoNow(),
    accessStatus: "available",
    notes: `Generated from the user's brief for ${brief.topic}. Requires evidence review before verified export.`,
  };
}

export class DeterministicProvider {
  name = "deterministic-offline";

  async generate({ brief, plan }) {
    const count = brief.cardCount || plan?.requestedCardCount || 10;
    const scope = plan?.scope || [{ id: "scope_1", label: brief.topic || "Core concepts" }];
    const source = genericSource(brief);
    const cards = [];
    const claims = [];
    for (let index = 0; index < count; index += 1) {
      const scopeItem = scope[index % scope.length];
      const claimId = `claim_generated_${index + 1}`;
      const front = `What is one important idea to learn about ${scopeItem.label}?`;
      const back = `Add a verified answer for ${scopeItem.label} before exporting this draft card.`;
      cards.push({
        type: "basic",
        front,
        back,
        extra: "Draft generated from the learning brief; replace or verify this answer.",
        tags: ["draft", "needs-evidence", scopeItem.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")],
        scopeId: scopeItem.id,
        objective: "recall",
        difficulty: brief.difficulty === "adaptive" ? "foundational" : brief.difficulty,
        claimIds: [claimId],
        sourceIds: [source.id],
        typeRationale: "Basic recall is the safest draft interaction until the learning point is specified.",
      });
      claims.push({ id: claimId, text: back, sourceIds: [source.id], verificationStatus: "unverified" });
    }
    return { cards, sources: [source], claims: claims, provider: this.name };
  }

  async regenerate({ card, instruction = "Improve this card while preserving its learning objective." }) {
    return {
      ...card,
      front: `${card.front} (revised)`,
      extra: `${card.extra || ""}\nRegeneration instruction: ${instruction}`.trim(),
      evidenceStatus: "unverified",
      status: "needs-review",
    };
  }
}

export class OpenAIProvider {
  constructor({ apiKey, model = "gpt-5", fetchImpl = fetch } = {}) {
    this.apiKey = apiKey;
    this.model = model;
    this.fetch = fetchImpl;
    this.name = `openai-responses:${model}`;
  }

  async generate({ brief, plan, sources = [] }) {
    const prompt = [
      "Create a fact-checkable Anki deck from the following approved brief and plan.",
      "Return only JSON matching the schema. Do not invent sources or citations.",
      "Every material claim must reference a source ID from the supplied source list; if evidence is missing, mark the card as requiring review in extra.",
      `BRIEF:\n${JSON.stringify(brief, null, 2)}`,
      `PLAN:\n${JSON.stringify(plan, null, 2)}`,
      `SOURCES:\n${JSON.stringify(sources, null, 2)}`,
    ].join("\n\n");
    const response = await this.fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        input: prompt,
        text: { format: { type: "json_schema", name: "anki_deck", strict: true, schema: CARD_SCHEMA } },
      }),
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`AI provider failed (${response.status}): ${detail.slice(0, 500)}`);
    }
    const payload = await response.json();
    const output = payload.output_text || payload.output?.flatMap((item) => item.content || []).find((item) => item.type === "output_text")?.text;
    if (!output) throw new Error("AI provider returned no output text");
    let parsed;
    try {
      parsed = JSON.parse(output);
    } catch (error) {
      throw new Error(`AI provider returned invalid JSON: ${error.message}`);
    }
    return { ...parsed, provider: this.name };
  }

  async regenerate({ card, brief, plan, instruction = "Improve this card while preserving its learning objective." }) {
    const result = await this.generate({
      brief: { ...brief, regenerationInstruction: instruction, currentCard: card },
      plan,
      sources: [],
    });
    return result.cards?.[0] || card;
  }
}

export function createProvider(env = process.env) {
  if (env.ANKI_AI_PROVIDER === "openai") {
    if (!env.OPENAI_API_KEY) throw new Error("ANKI_AI_PROVIDER=openai requires OPENAI_API_KEY");
    return new OpenAIProvider({ apiKey: env.OPENAI_API_KEY, model: env.OPENAI_MODEL || "gpt-5" });
  }
  return new DeterministicProvider();
}

export function normalizeGeneratedDeck(result, { plan, brief }) {
  const sources = Array.isArray(result?.sources) ? result.sources : [];
  const claims = Array.isArray(result?.claims) ? result.claims : [];
  const cards = Array.isArray(result?.cards) ? result.cards : [];
  return {
    provider: result?.provider || "unknown",
    sources: sources.map((source) => ({ ...source, id: source.id || id("source"), retrievedAt: source.retrievedAt || isoNow() })),
    claims: claims.map((claim) => ({ ...claim, id: claim.id || id("claim"), verificationStatus: claim.verificationStatus || "unverified" })),
    cards: cards.map((card, index) => ({
      ...card,
      id: card.id || id("card"),
      stableId: card.stableId || `run-card-${index + 1}`,
      type: card.type || "basic",
      front: String(card.front || "").trim(),
      back: String(card.back || "").trim(),
      extra: String(card.extra || "").trim(),
      tags: Array.isArray(card.tags) ? card.tags : [],
      scopeId: card.scopeId || plan?.scope?.[index % (plan.scope.length || 1)]?.id || "scope_1",
      objective: card.objective || "recall",
      difficulty: card.difficulty || (brief.difficulty === "adaptive" ? "foundational" : brief.difficulty),
      claimIds: Array.isArray(card.claimIds) ? card.claimIds : [],
      sourceIds: Array.isArray(card.sourceIds) ? card.sourceIds : [],
      acceptedAnswers: Array.isArray(card.acceptedAnswers) ? card.acceptedAnswers : [],
      confidence: card.confidence === undefined ? undefined : Number(card.confidence),
      validUntil: card.validUntil || null,
      media: Array.isArray(card.media) ? card.media : [],
      evidenceStatus: card.evidenceStatus || "unverified",
      status: card.status || "draft",
      locked: Boolean(card.locked),
      createdAt: card.createdAt || isoNow(),
      updatedAt: isoNow(),
    })),
  };
}
