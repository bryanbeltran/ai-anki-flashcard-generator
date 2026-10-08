import { isoNow } from "./domain.js";

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function finding({ ruleId, severity, message, cardId = null, scopeId = null, evidence = null }) {
  return { id: `${ruleId}_${cardId || scopeId || "run"}`, ruleId, severity, message, cardId, scopeId, evidence, status: "open", createdAt: isoNow() };
}

function validateCard(card, project) {
  const findings = [];
  const sourceIds = new Set((project.sources || []).map((source) => source.id));
  const claimIds = new Set((project.claims || []).map((claim) => claim.id));

  if (!card.front) findings.push(finding({ ruleId: "required.front", severity: "error", message: "Front/prompt is required.", cardId: card.id }));
  if (!card.back && card.type !== "cloze") findings.push(finding({ ruleId: "required.back", severity: "error", message: "Back/answer is required.", cardId: card.id }));
  if (!card.scopeId) findings.push(finding({ ruleId: "required.scope", severity: "error", message: "Card must map to a scope item.", cardId: card.id }));
  if (!card.type || !["basic", "reversed-basic", "cloze", "type-in"].includes(card.type)) {
    findings.push(finding({ ruleId: "type.unsupported", severity: "error", message: `Unsupported card type: ${card.type || "missing"}.`, cardId: card.id }));
  }
  if (card.type === "cloze" && !/{{c\d+::[^}]+}}/.test(card.front)) {
    findings.push(finding({ ruleId: "type.cloze-syntax", severity: "error", message: "Cloze cards need a {{c1::answer}} deletion in the front field.", cardId: card.id }));
  }
  if (card.type === "type-in" && !(card.acceptedAnswers || []).length) {
    findings.push(finding({ ruleId: "type.accepted-answers", severity: "error", message: "Type-in cards need at least one canonical or accepted answer.", cardId: card.id }));
  }
  if ((card.front.match(/\?/g) || []).length > 1) {
    findings.push(finding({ ruleId: "quality.atomicity", severity: "warning", message: "Prompt appears to contain multiple questions; split or make the retrieval target explicit.", cardId: card.id }));
  }
  if (card.front.length > 260 || card.back.length > 600) {
    findings.push(finding({ ruleId: "quality.reading-load", severity: "warning", message: "This card is unusually long; review whether it should be split.", cardId: card.id }));
  }
  const unknownSources = (card.sourceIds || []).filter((sourceId) => !sourceIds.has(sourceId));
  if (unknownSources.length) findings.push(finding({ ruleId: "evidence.unknown-source", severity: "error", message: `Card references unknown source IDs: ${unknownSources.join(", ")}.`, cardId: card.id }));
  const unknownClaims = (card.claimIds || []).filter((claimId) => !claimIds.has(claimId));
  if (unknownClaims.length) findings.push(finding({ ruleId: "evidence.unknown-claim", severity: "error", message: `Card references unknown claim IDs: ${unknownClaims.join(", ")}.`, cardId: card.id }));
  if (!(card.sourceIds || []).length || !(card.claimIds || []).length) {
    const severity = project.brief.sourcePolicy === "source-only" ? "error" : "warning";
    findings.push(finding({ ruleId: "evidence.missing", severity, message: "Card has no complete claim/evidence trail.", cardId: card.id }));
  }
  if (card.evidenceStatus !== "verified") {
    const severity = project.brief.sourcePolicy === "source-only" ? "error" : "warning";
    findings.push(finding({ ruleId: "evidence.unverified", severity, message: `Evidence status is ${card.evidenceStatus || "missing"}; verify before export.`, cardId: card.id }));
  }
  if (card.evidenceStatus === "conflicting") {
    findings.push(finding({ ruleId: "evidence.conflict", severity: "error", message: "Conflicting evidence must be resolved or explicitly excluded before export.", cardId: card.id }));
  }
  if (card.confidence !== undefined && (Number(card.confidence) < 0 || Number(card.confidence) > 1)) {
    findings.push(finding({ ruleId: "evidence.confidence-range", severity: "error", message: "Confidence must be between 0 and 1.", cardId: card.id }));
  }
  if (card.confidence !== undefined && Number(card.confidence) < 0.6) {
    findings.push(finding({ ruleId: "evidence.low-confidence", severity: "warning", message: "Low model/source confidence; review the evidence before studying.", cardId: card.id }));
  }
  if (card.validUntil && new Date(card.validUntil).getTime() < Date.now()) {
    findings.push(finding({ ruleId: "evidence.stale", severity: "warning", message: `Evidence validity ended on ${card.validUntil}.`, cardId: card.id }));
  }
  if ((/!\[|<img\b|\[sound:/i.test(`${card.front}\n${card.back}`)) && !(card.media || []).length) {
    findings.push(finding({ ruleId: "media.missing", severity: "error", message: "Card references media but has no packaged media assets.", cardId: card.id }));
  }
  if (["rejected", "needs-review", "draft"].includes(card.status)) {
    findings.push(finding({ ruleId: "review.not-approved", severity: "warning", message: `Card status is ${card.status}; approve it before export.`, cardId: card.id }));
  }
  return findings;
}

export function validateProject(project) {
  const findings = [];
  const cards = project.cards || [];
  const cardFindings = new Map();
  for (const card of cards) {
    const local = validateCard(card, project);
    cardFindings.set(card.id, local);
    findings.push(...local);
  }

  const seen = new Map();
  for (const card of cards) {
    const key = `${normalizeText(card.front)}|${normalizeText(card.back)}`;
    if (!key || key === "|") continue;
    if (seen.has(key)) {
      findings.push(finding({ ruleId: "quality.duplicate", severity: "warning", message: `Card duplicates ${seen.get(key)}. Keep, merge, or specialize it.`, cardId: card.id }));
    } else {
      seen.set(key, card.id);
    }
  }

  const requiredScope = (project.plan?.scope || []).filter((scope) => scope.required !== false);
  const coveredScopeIds = new Set(cards.map((card) => card.scopeId));
  const coverage = requiredScope.map((scope) => ({
    scopeId: scope.id,
    label: scope.label,
    required: scope.required !== false,
    cardCount: cards.filter((card) => card.scopeId === scope.id).length,
    covered: coveredScopeIds.has(scope.id),
  }));
  for (const item of coverage.filter((item) => !item.covered)) {
    findings.push(finding({ ruleId: "coverage.required", severity: "error", message: `Required scope item is uncovered: ${item.label}.`, scopeId: item.scopeId }));
  }

  const requested = project.brief.cardCount || project.plan?.requestedCardCount || null;
  if (requested && cards.length !== requested) {
    findings.push(finding({ ruleId: "count.exact", severity: "error", message: `Requested exactly ${requested} cards, but the run contains ${cards.length}.` }));
  }
  const requestedRange = project.brief.cardCountRange || project.plan?.requestedCardCountRange || null;
  if (!requested && requestedRange && (cards.length < requestedRange.min || cards.length > requestedRange.max)) {
    findings.push(finding({ ruleId: "count.range", severity: "error", message: `Requested between ${requestedRange.min} and ${requestedRange.max} cards, but the run contains ${cards.length}.` }));
  }

  const hardGateCount = findings.filter((item) => item.severity === "error").length;
  const warningCount = findings.filter((item) => item.severity === "warning").length;
  const approvedCards = cards.filter((card) => ["approved", "locked"].includes(card.status));
  const exportableCards = approvedCards.filter((card) => {
    const local = cardFindings.get(card.id) || [];
    return !local.some((item) => item.severity === "error") && (project.brief.sourcePolicy !== "source-only" || card.evidenceStatus === "verified");
  });
  const verifiedCards = cards.filter((card) => card.evidenceStatus === "verified");
  const requiredCovered = coverage.filter((item) => item.covered).length;
  const coveragePercent = requiredScope.length ? Math.round((requiredCovered / requiredScope.length) * 100) : 100;
  const duplicateCount = findings.filter((item) => item.ruleId === "quality.duplicate").length;
  const distribution = {
    byScope: countBy(cards, (card) => card.scopeId),
    byType: countBy(cards, (card) => card.type),
    byDifficulty: countBy(cards, (card) => card.difficulty),
    byObjective: countBy(cards, (card) => card.objective),
  };
  const metrics = {
    requestedCards: requested,
    generatedCandidates: cards.length,
    approvedCards: approvedCards.length,
    exportableCards: exportableCards.length,
    verifiedCards: verifiedCards.length,
    unverifiedCards: cards.length - verifiedCards.length,
    conflictingCards: cards.filter((card) => card.evidenceStatus === "conflicting").length,
    requiredScopeItems: requiredScope.length,
    coveredRequiredScopeItems: requiredCovered,
    coveragePercent,
    duplicateCount,
    distribution,
    hardGateCount,
    warningCount,
    notes: cards.length - exportableCards.length,
    updatedAt: isoNow(),
  };
  const canExport = hardGateCount === 0 && exportableCards.length === cards.length && cards.length > 0;
  return { findings, coverage, metrics, canExport, exportableCards };
}

function countBy(items, keyFn) {
  return items.reduce((counts, item) => {
    const key = keyFn(item) || "unknown";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

export function applyValidation(project, { timestamp = isoNow() } = {}) {
  const result = validateProject(project);
  project.validations = result.findings;
  project.metrics = result.metrics;
  project.metrics.updatedAt = timestamp;
  if (!project.cards.length) project.status = "Draft";
  else if (result.canExport) project.status = "Export ready";
  else project.status = "Needs review";
  project.updatedAt = timestamp;
  return result;
}

export function isExportable(project, card, { includeUnverified = false } = {}) {
  if (!["approved", "locked"].includes(card.status)) return false;
  if (!includeUnverified && card.evidenceStatus !== "verified") return false;
  const result = validateProject({
    ...project,
    brief: { ...(project.brief || {}), cardCount: null },
    cards: [card],
    plan: { ...(project.plan || {}), requestedCardCount: null, scope: (project.plan?.scope || []).filter((scope) => scope.id === card.scopeId) },
  });
  return !result.findings.some((item) => item.severity === "error");
}

export { normalizeText };
