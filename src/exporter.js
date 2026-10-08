import { isExportable, validateProject } from "./validator.js";
import { isoNow, sanitizeFileName } from "./domain.js";
import { buildApkg } from "./apkg.js";

function escapeTsv(value) {
  return String(value ?? "")
    .replace(/\r?\n/g, "<br>")
    .replace(/\t/g, "    ");
}

function escapeCsv(value) {
  const text = String(value ?? "").replace(/\r?\n/g, "<br>");
  return /[",\t]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function sourceText(card, project) {
  return (card.sourceIds || [])
    .map((sourceId) => project.sources.find((source) => source.id === sourceId))
    .filter(Boolean)
    .map((source) => source.url || source.title)
    .join(" ");
}

export function exportRows(project, { cardType = "all", includeUnverified = false } = {}) {
  const validation = validateProject(project);
  if (validation.metrics.hardGateCount > 0) {
    const error = new Error("Export blocked by hard validation gates.");
    error.code = "EXPORT_BLOCKED";
    error.validation = validation;
    throw error;
  }
  const cards = project.cards.filter((card) => (cardType === "all" || card.type === cardType) && isExportable(project, card, { includeUnverified }));
  if (!cards.length) {
    const error = new Error("No approved cards are available for this export.");
    error.code = "NO_EXPORTABLE_CARDS";
    throw error;
  }
  return cards.map((card) => ({
    Front: card.front,
    Back: card.back,
    Extra: card.extra,
    Tags: (card.tags || []).join(" "),
    CardType: card.type,
    Source: sourceText(card, project),
    StableId: card.stableId || card.id,
  }));
}

export function buildExport(project, { format = "tsv", cardType = "all", includeUnverified = false, timestamp = Date.now() } = {}) {
  if (!["tsv", "csv", "apkg"].includes(format)) throw new Error(`Unsupported export format: ${format}`);
  const rows = exportRows(project, { cardType, includeUnverified });
  if (format === "apkg") return buildApkg(project, rows, { timestamp, cardType });
  const columns = ["Front", "Back", "Extra", "Tags", "CardType", "Source"];
  const delimiter = format === "csv" ? "," : "\t";
  const escape = format === "csv" ? escapeCsv : escapeTsv;
  const directives = format === "csv"
    ? [`#separator:Comma`, `#html:true`, `#deck:${project.brief.deckName || project.title}`, `#columns:${columns.join(delimiter)}`]
    : [`#separator:Tab`, `#html:true`, `#deck:${project.brief.deckName || project.title}`, `#columns:${columns.join(delimiter)}`];
  const body = rows.map((row) => columns.map((column) => escape(row[column])).join(delimiter));
  return {
    text: `${directives.concat(body).join("\n")}\n`,
    format,
    cardType,
    notes: rows.length,
    cards: rows.length,
    fileName: `${sanitizeFileName(project.brief.deckName || project.title)}${cardType === "all" ? "" : `-${cardType}`}.${format}`,
    exportedAt: isoNow(),
    columns,
  };
}

export function previewExport(project, { format = "tsv", cardType = "all", includeUnverified = false } = {}) {
  const validation = validateProject(project);
  let rows = [];
  let blocked = validation.metrics.hardGateCount > 0;
  try {
    rows = exportRows(project, { cardType, includeUnverified });
  } catch {
    blocked = true;
    rows = project.cards
      .filter((card) => cardType === "all" || card.type === cardType)
      .slice(0, 5)
      .map((card) => ({ Front: card.front, Back: card.back, Extra: card.extra, Tags: (card.tags || []).join(" "), CardType: card.type, Source: sourceText(card, project) }));
  }
  return {
    format,
    cardType,
    columns: format === "apkg" ? ["Front", "Back", "Extra", "Tags", "CardType", "Source"] : ["Front", "Back", "Extra", "Tags", "CardType", "Source"],
    mapping: format === "apkg"
      ? { package: "Anki deck package (.apkg)", Front: "note prompt", Back: "note answer", Extra: "note explanation", Tags: "Anki tags", CardType: "Anki note template", Source: "hidden provenance field" }
      : { Front: "prompt", Back: "answer", Extra: "explanation/notes", Tags: "space-delimited tags", CardType: "Anki note template selector", Source: "provenance URL/title" },
    sampleRows: rows.slice(0, 5),
    validation: { metrics: validation.metrics, findings: validation.findings },
    blocked,
  };
}

export function recordExport(project, artifact) {
  project.exports = project.exports || [];
  const { body, text, ...metadata } = artifact;
  project.exports.push({
    id: `export_${Date.now()}`,
    ...metadata,
    text: undefined,
  });
  project.updatedAt = isoNow();
  return project;
}
