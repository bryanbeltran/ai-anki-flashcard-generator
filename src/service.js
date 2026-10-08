import { createHash } from "node:crypto";
import { buildClarifyingQuestions, buildPlan, clone, createRun, id, normalizeBrief, touch } from "./domain.js";
import { normalizeGeneratedDeck } from "./provider.js";
import { applyValidation, validateProject } from "./validator.js";
import { buildPracticeDecks, practiceDeckBySlug } from "./practice-data.js";

function requireProject(store, projectId) {
  const project = store.getProject(projectId);
  if (!project) {
    const error = new Error(`Project not found: ${projectId}`);
    error.statusCode = 404;
    throw error;
  }
  return project;
}

function save(store, project) {
  touch(project);
  return store.saveProject(project);
}

export function presentProject(project) {
  const validation = validateProject(project);
  const safeSources = (project.sources || []).map((source) => {
    const { content, ...safe } = source;
    return content ? { ...safe, contentPreview: content.slice(0, 280) } : safe;
  });
  return {
    ...clone(project),
    sources: safeSources,
    clarifyingQuestions: buildClarifyingQuestions(project.brief),
    coverage: validation.coverage,
    computedMetrics: validation.metrics,
    canExport: validation.canExport,
  };
}

function sourceHash(content) {
  return createHash("sha256").update(String(content || ""), "utf8").digest("hex");
}

export function addSource(store, projectId, input = {}) {
  const project = requireProject(store, projectId);
  const content = String(input.content || "").slice(0, 1_000_000);
  const url = String(input.url || "").trim();
  const title = String(input.title || url || "Untitled source").trim();
  if (!url && !content) {
    const error = new Error("A source needs a URL or pasted content.");
    error.statusCode = 400;
    throw error;
  }
  if (url && !/^https?:\/\//i.test(url)) {
    const error = new Error("Source URLs must use http or https.");
    error.statusCode = 400;
    throw error;
  }
  const duplicate = project.sources.find((source) => (url && source.url === url) || (content && source.contentHash === sourceHash(content)));
  if (duplicate) return presentProject(project);
  const source = {
    id: id("source"),
    title,
    url,
    type: String(input.type || (url ? "public-url" : "user-provided")),
    quality: String(input.quality || "user-provided"),
    licenseNotes: String(input.licenseNotes || "").trim(),
    publishedAt: input.publishedAt || null,
    retrievedAt: new Date().toISOString(),
    content: content || "",
    contentHash: content ? sourceHash(content) : null,
    accessStatus: "available",
    snapshotId: id("snapshot"),
  };
  project.sources.push(source);
  project.brief.sources = [...new Set([...(project.brief.sources || []), url].filter(Boolean))];
  project.status = "Draft";
  return presentProject(save(store, project));
}

export async function fetchSource(store, projectId, sourceId) {
  const project = requireProject(store, projectId);
  const source = project.sources.find((item) => item.id === sourceId);
  if (!source) {
    const error = new Error(`Source not found: ${sourceId}`);
    error.statusCode = 404;
    throw error;
  }
  let parsedUrl;
  try { parsedUrl = new URL(source.url); } catch {
    const error = new Error("Source URL is invalid.");
    error.statusCode = 400;
    throw error;
  }
  if (!/^https?:$/i.test(parsedUrl.protocol)) {
    const error = new Error("Only http(s) source URLs can be fetched.");
    error.statusCode = 400;
    throw error;
  }
  const response = await fetch(source.url, { signal: AbortSignal.timeout(10_000), headers: { accept: "text/plain,text/html,application/xhtml+xml" } });
  if (!response.ok) {
    source.accessStatus = `error:${response.status}`;
    source.lastError = `Source returned HTTP ${response.status}`;
    save(store, project);
    const error = new Error(source.lastError);
    error.statusCode = 502;
    throw error;
  }
  const type = response.headers.get("content-type") || "";
  if (!/(text\/|application\/(xhtml\+xml|json))/.test(type)) {
    source.accessStatus = "unsupported-content-type";
    source.lastError = `Unsupported content type: ${type}`;
    save(store, project);
    const error = new Error(source.lastError);
    error.statusCode = 415;
    throw error;
  }
  const raw = await response.text();
  if (raw.length > 1_000_000) {
    source.accessStatus = "too-large";
    source.lastError = "Source exceeds the 1 MB snapshot limit.";
    save(store, project);
    const error = new Error(source.lastError);
    error.statusCode = 413;
    throw error;
  }
  const content = type.includes("html")
    ? raw.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    : raw;
  source.content = content;
  source.contentHash = sourceHash(content);
  source.retrievedAt = new Date().toISOString();
  source.snapshotId = id("snapshot");
  source.accessStatus = "available";
  delete source.lastError;
  return presentProject(save(store, project));
}

export function verifyCard(store, projectId, cardId, input = {}) {
  const project = requireProject(store, projectId);
  const card = project.cards.find((item) => item.id === cardId);
  if (!card) {
    const error = new Error(`Card not found: ${cardId}`);
    error.statusCode = 404;
    throw error;
  }
  const sourceIds = Array.isArray(input.sourceIds) && input.sourceIds.length ? input.sourceIds : card.sourceIds;
  const knownSources = new Set(project.sources.map((source) => source.id));
  if (!sourceIds?.length || sourceIds.some((sourceId) => !knownSources.has(sourceId))) {
    const error = new Error("Verification requires one or more known source IDs.");
    error.statusCode = 400;
    throw error;
  }
  const claim = {
    id: id("claim"),
    text: String(input.claimText || `${card.front} — ${card.back}`),
    sourceIds,
    evidenceExcerpt: String(input.evidenceExcerpt || card.back),
    evidenceLocation: String(input.evidenceLocation || "User-selected source snapshot"),
    evidenceStrength: "user-reviewed",
    verificationStatus: "verified",
    checkedAt: new Date().toISOString(),
    verifier: "user-review",
  };
  project.claims.push(claim);
  card.sourceIds = sourceIds;
  card.claimIds = [...new Set([...(card.claimIds || []), claim.id])];
  card.evidenceStatus = "verified";
  if (!card.locked) card.status = "approved";
  card.updatedAt = new Date().toISOString();
  applyValidation(project);
  return presentProject(save(store, project));
}

export function listPracticeDecks() {
  const decks = [...buildPracticeDecks(), practiceDeckBySlug("korean-alphabet"), practiceDeckBySlug("korean-sight-words")].filter(Boolean);
  return decks.map((deck) => ({
    slug: deck.id.replace(/^practice_/, "").replaceAll("_", "-"),
    id: deck.id,
    title: deck.title,
    cardCount: deck.cards.length,
    metrics: deck.metrics,
  }));
}

export function updateBrief(store, projectId, patch) {
  const project = requireProject(store, projectId);
  project.brief = normalizeBrief(patch, project.brief);
  if (patch.deckName && project.title === "Untitled Anki Project") project.title = patch.deckName;
  project.status = buildClarifyingQuestions(project.brief).some((question) => question.required) ? "Needs clarification" : "Draft";
  return presentProject(save(store, project));
}

export function createPlan(store, projectId) {
  const project = requireProject(store, projectId);
  project.plan = buildPlan(project.brief);
  const requiredQuestions = buildClarifyingQuestions(project.brief).filter((question) => question.required);
  project.status = requiredQuestions.length ? "Needs clarification" : "Plan ready";
  return presentProject(save(store, project));
}

export async function generateProject(store, projectId, { provider, idempotencyKey = null } = {}) {
  const project = requireProject(store, projectId);
  if (!project.plan) {
    const error = new Error("Create and review a plan before generating cards.");
    error.statusCode = 409;
    throw error;
  }
  const requiredQuestions = buildClarifyingQuestions(project.brief).filter((question) => question.required);
  if (!project.brief.confirmed || requiredQuestions.length) {
    const error = new Error("Confirm the required learning-brief decisions before generating cards.");
    error.statusCode = 409;
    error.questions = requiredQuestions;
    throw error;
  }
  if (idempotencyKey) {
    const existing = project.runs.find((run) => run.idempotencyKey === idempotencyKey && run.status === "succeeded");
    if (existing) return presentProject(project);
  }
  const run = createRun(project, "generation");
  run.idempotencyKey = idempotencyKey;
  run.provider = provider?.name || "unknown";
  project.status = "Generating";
  save(store, project);
  try {
    const result = await provider.generate({ brief: project.brief, plan: project.plan, sources: project.sources });
    const normalized = normalizeGeneratedDeck(result, { plan: project.plan, brief: project.brief });
    project.sources = mergeById(project.sources, normalized.sources);
    project.claims = mergeById(project.claims, normalized.claims);
    project.cards = normalized.cards;
    run.status = "succeeded";
    run.provider = normalized.provider;
    run.completedAt = new Date().toISOString();
    applyValidation(project);
    return presentProject(save(store, project));
  } catch (error) {
    run.status = "failed";
    run.error = error.message;
    run.completedAt = new Date().toISOString();
    project.status = "Failed";
    save(store, project);
    throw error;
  }
}

export function duplicateProject(store, projectId, title = null) {
  const original = requireProject(store, projectId);
  const copy = store.createProject({ title: title || `${original.title} — copy`, brief: original.brief });
  copy.plan = clone(original.plan);
  copy.sources = clone(original.sources);
  const claimMap = new Map();
  copy.claims = (original.claims || []).map((claim) => {
    const nextId = id("claim");
    claimMap.set(claim.id, nextId);
    return { ...clone(claim), id: nextId };
  });
  copy.cards = (original.cards || []).map((card) => ({
    ...clone(card),
    id: id("card"),
    claimIds: (card.claimIds || []).map((claimId) => claimMap.get(claimId) || claimId),
    status: card.status === "rejected" ? "draft" : card.status,
    locked: false,
  }));
  copy.runs = [];
  copy.exports = [];
  applyValidation(copy);
  return presentProject(store.saveProject(copy));
}

export function cancelRun(store, projectId, runId) {
  const project = requireProject(store, projectId);
  const run = project.runs.find((item) => item.id === runId);
  if (!run) {
    const error = new Error(`Run not found: ${runId}`);
    error.statusCode = 404;
    throw error;
  }
  if (["succeeded", "failed", "canceled"].includes(run.status)) return presentProject(project);
  run.status = "canceled";
  run.completedAt = new Date().toISOString();
  project.status = project.cards.length ? "Needs review" : "Draft";
  return presentProject(save(store, project));
}

function mergeById(current, incoming) {
  const merged = new Map((current || []).map((item) => [item.id, item]));
  for (const item of incoming || []) merged.set(item.id, item);
  return [...merged.values()];
}

export function validateAndSave(store, projectId) {
  const project = requireProject(store, projectId);
  applyValidation(project);
  return presentProject(save(store, project));
}

const EDITABLE_CARD_FIELDS = new Set(["front", "back", "extra", "tags", "type", "difficulty", "acceptedAnswers", "evidenceStatus", "status", "locked", "sourceIds", "claimIds", "typeRationale", "notes"]);

export function patchCard(store, projectId, cardId, patch) {
  const project = requireProject(store, projectId);
  const card = project.cards.find((item) => item.id === cardId);
  if (!card) {
    const error = new Error(`Card not found: ${cardId}`);
    error.statusCode = 404;
    throw error;
  }
  if (card.locked && patch.locked !== false) {
    const error = new Error("Card is locked. Unlock it before editing.");
    error.statusCode = 409;
    throw error;
  }
  const contentChanged = Object.keys(patch).some((key) => ["front", "back", "extra", "type", "difficulty", "acceptedAnswers", "sourceIds", "claimIds"].includes(key));
  const before = clone(card);
  for (const key of Object.keys(patch)) {
    if (EDITABLE_CARD_FIELDS.has(key)) card[key] = patch[key];
  }
  if (contentChanged && patch.status === undefined) {
    card.status = "needs-review";
    if (patch.evidenceStatus === undefined) card.evidenceStatus = "unverified";
  }
  if (contentChanged) {
    card.revisions = [...(card.revisions || []), { id: id("revision"), changedAt: new Date().toISOString(), actor: "local-user", reason: "manual-edit", before: { front: before.front, back: before.back, type: before.type }, after: { front: card.front, back: card.back, type: card.type } }];
  }
  card.updatedAt = new Date().toISOString();
  applyValidation(project);
  return presentProject(save(store, project));
}

export function bulkCards(store, projectId, { cardIds = [], action, tag = null } = {}) {
  const project = requireProject(store, projectId);
  const allowed = new Set(cardIds);
  for (const card of project.cards.filter((item) => allowed.has(item.id))) {
    if (action === "approve" && !card.locked) card.status = "approved";
    if (action === "reject" && !card.locked) card.status = "rejected";
    if (action === "lock") card.locked = true;
    if (action === "unlock") card.locked = false;
    if (action === "tag" && tag) card.tags = [...new Set([...(card.tags || []), String(tag).trim()])];
    card.updatedAt = new Date().toISOString();
  }
  applyValidation(project);
  return presentProject(save(store, project));
}

export async function regenerateCard(store, projectId, cardId, { provider, instruction = "Improve clarity and preserve the learning objective.", field = null } = {}) {
  const project = requireProject(store, projectId);
  const card = project.cards.find((item) => item.id === cardId);
  if (!card) {
    const error = new Error(`Card not found: ${cardId}`);
    error.statusCode = 404;
    throw error;
  }
  if (card.locked) {
    const error = new Error("Card is locked. Unlock it before regenerating.");
    error.statusCode = 409;
    throw error;
  }
  const before = clone(card);
  const regenerated = await provider.regenerate({ card: clone(card), brief: project.brief, plan: project.plan, instruction, field });
  const preserve = { id: card.id, stableId: card.stableId, createdAt: card.createdAt, locked: false };
  const allowedFields = new Set(["front", "back", "extra", "type", "difficulty", "tags", "acceptedAnswers"]);
  const changes = field && allowedFields.has(field) && regenerated[field] !== undefined ? { [field]: regenerated[field] } : regenerated;
  Object.assign(card, changes, preserve, { status: "needs-review", evidenceStatus: regenerated.evidenceStatus || "unverified", updatedAt: new Date().toISOString() });
  card.revisions = [...(card.revisions || []), { id: id("revision"), changedAt: new Date().toISOString(), actor: "provider", reason: instruction, field: field || "card", before: { front: before.front, back: before.back, type: before.type }, after: { front: card.front, back: card.back, type: card.type } }];
  applyValidation(project);
  return presentProject(save(store, project));
}

export function seedPracticeProject(store, slug) {
  const deck = practiceDeckBySlug(slug);
  if (!deck) {
    const error = new Error(`Unknown practice deck: ${slug}`);
    error.statusCode = 404;
    throw error;
  }
  const existing = store.getProject(deck.id);
  if (existing) return presentProject(existing);
  return presentProject(store.insertProject(deck));
}
