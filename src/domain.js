import { randomUUID } from "node:crypto";

export const CARD_TYPES = ["basic", "reversed-basic", "cloze", "type-in"];
export const DIFFICULTIES = ["beginner", "foundational", "intermediate", "advanced", "adaptive"];

export function id(prefix = "id") {
  return `${prefix}_${randomUUID()}`;
}

export function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

export function isoNow() {
  return new Date().toISOString();
}

export function normalizeBrief(input = {}, existing = {}) {
  const merged = { ...existing, ...input };
  const cardCount = Number.isFinite(Number(merged.cardCount)) && Number(merged.cardCount) > 0
    ? Math.min(500, Math.floor(Number(merged.cardCount)))
    : null;
  const allowedTypes = Array.isArray(merged.allowedTypes) && merged.allowedTypes.length
    ? merged.allowedTypes.filter((type) => CARD_TYPES.includes(type))
    : ["basic", "reversed-basic", "cloze"];

  return {
    topic: String(merged.topic || "").trim(),
    outcome: String(merged.outcome || "").trim(),
    audience: String(merged.audience || "").trim(),
    prerequisites: String(merged.prerequisites || "").trim(),
    cardCount,
    difficulty: DIFFICULTIES.includes(merged.difficulty) ? merged.difficulty : "adaptive",
    allowedTypes,
    direction: String(merged.direction || "").trim(),
    sourcePolicy: ["source-only", "trusted-external", "mixed"].includes(merged.sourcePolicy)
      ? merged.sourcePolicy
      : "mixed",
    language: String(merged.language || "English").trim(),
    deckName: String(merged.deckName || merged.topic || "Untitled Anki Deck").trim(),
    exportFormat: ["tsv", "csv"].includes(merged.exportFormat) ? merged.exportFormat : "tsv",
    includedScope: String(merged.includedScope || "").trim(),
    excludedScope: String(merged.excludedScope || "").trim(),
    sources: Array.isArray(merged.sources) ? merged.sources : [],
    sensitiveContent: String(merged.sensitiveContent || "").trim(),
    confirmed: Boolean(merged.confirmed),
    assumptions: Array.isArray(merged.assumptions) ? merged.assumptions : [],
    updatedAt: isoNow(),
  };
}

export function createProject({ title = "Untitled Anki Project", brief = {} } = {}) {
  const projectId = id("project");
  const now = isoNow();
  return {
    id: projectId,
    title: String(title).trim() || "Untitled Anki Project",
    createdAt: now,
    updatedAt: now,
    status: "Draft",
    brief: normalizeBrief(brief),
    plan: null,
    sources: [],
    claims: [],
    cards: [],
    validations: [],
    runs: [],
    exports: [],
    metrics: null,
  };
}

function splitScope(text, topic) {
  const pieces = String(text || "")
    .split(/[,;\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
  return pieces.length ? pieces : [topic || "Core concepts"];
}

export function buildClarifyingQuestions(brief) {
  const questions = [];
  if (!brief.topic) {
    questions.push({ id: "topic", label: "Topic and boundaries", question: "What do you want to learn, and what should be explicitly out of scope?", required: true });
  }
  if (!brief.outcome) {
    questions.push({ id: "outcome", label: "Learning outcome", question: "What should you be able to do after studying: recall facts, pass an exam, apply a skill, interview, or something else?", required: true });
  }
  if (!brief.audience) {
    questions.push({ id: "audience", label: "Learner level", question: "Who is the learner and what prerequisite knowledge can the cards assume?", required: true });
  }
  if (!brief.cardCount) {
    questions.push({ id: "cardCount", label: "Card count", question: "How many cards do you want, or what range should the planner use?", required: true });
  }
  if (!brief.difficulty || brief.difficulty === "adaptive") {
    questions.push({ id: "difficulty", label: "Difficulty", question: "Should the deck be beginner, foundational, intermediate, advanced, or an adaptive mix?", required: false });
  }
  if (!brief.allowedTypes?.length) {
    questions.push({ id: "allowedTypes", label: "Card format", question: "Should the tool choose among basic, reversed, cloze, and type-in cards, or should you restrict the formats?", required: false });
  }
  if (!brief.sourcePolicy || brief.sourcePolicy === "mixed") {
    questions.push({ id: "sourcePolicy", label: "Source policy", question: "Use only supplied sources, trusted external sources, or both?", required: false });
  }
  if (!brief.exportFormat) {
    questions.push({ id: "exportFormat", label: "Export format", question: "Do you want UTF-8 TSV or CSV for Anki import?", required: true });
  }
  return questions;
}

export function buildPlan(brief) {
  const scopeLabels = splitScope(brief.includedScope, brief.topic);
  const requestedCount = brief.cardCount || Math.max(10, scopeLabels.length * 5);
  const base = Math.floor(requestedCount / scopeLabels.length);
  const remainder = requestedCount % scopeLabels.length;
  const scope = scopeLabels.map((label, index) => ({
    id: `scope_${index + 1}`,
    label,
    required: true,
    priority: "required",
    objectiveTypes: ["recall", "explain", "distinguish"],
    allocatedCards: base + (index < remainder ? 1 : 0),
    coverageStatus: "uncovered",
  }));

  const typeDistribution = {};
  const allowed = brief.allowedTypes?.length ? brief.allowedTypes : ["basic"];
  allowed.forEach((type, index) => {
    typeDistribution[type] = index === 0 ? Math.ceil(requestedCount / allowed.length) : Math.floor(requestedCount / allowed.length);
  });

  return {
    id: id("plan"),
    version: 1,
    createdAt: isoNow(),
    scope,
    objectives: scope.flatMap((item) => item.objectiveTypes.map((type) => ({
      id: `objective_${item.id}_${type}`,
      scopeId: item.id,
      type,
      statement: `${type[0].toUpperCase()}${type.slice(1)} the key ideas in ${item.label}.`,
      priority: "required",
    }))),
    requestedCardCount: requestedCount,
    difficulty: brief.difficulty,
    typeDistribution,
    sourcePolicy: brief.sourcePolicy,
    exclusions: brief.excludedScope ? splitScope(brief.excludedScope, "").map((label) => ({ label, required: false })) : [],
    risks: brief.audience ? [] : ["Learner prerequisites are not confirmed."],
    approvedAt: brief.confirmed ? isoNow() : null,
  };
}

export function createRun(project, kind = "generation") {
  const run = {
    id: id("run"),
    kind,
    createdAt: isoNow(),
    status: "started",
    briefSnapshot: clone(project.brief),
    planSnapshot: clone(project.plan),
    sourceSnapshot: clone(project.sources),
    provider: null,
    error: null,
    completedAt: null,
  };
  project.runs.push(run);
  return run;
}

export function touch(project) {
  project.updatedAt = isoNow();
  return project;
}

export function sanitizeFileName(value) {
  return String(value || "deck")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "deck";
}
