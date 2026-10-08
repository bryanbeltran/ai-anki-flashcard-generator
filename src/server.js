import { createServer as nodeCreateServer } from "node:http";
import { readFileSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createDefaultStore } from "./store.js";
import { createProvider } from "./provider.js";
import { buildExport, recordExport } from "./exporter.js";
import {
  addSource,
  bulkCards,
  cancelRun,
  createPlan,
  duplicateProject,
  fetchSource,
  generateProject,
  listPracticeDecks,
  patchCard,
  presentProject,
  regenerateCard,
  seedPracticeProject,
  updateBrief,
  verifyCard,
  validateAndSave,
} from "./service.js";

const root = resolve(fileURLToPath(new URL("./public", import.meta.url)));

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(body);
}

function sendText(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, { "content-type": "text/plain; charset=utf-8", ...headers });
  res.end(body);
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 2_000_000) {
      const error = new Error("Request body exceeds the 2 MB limit.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("Request body must be valid JSON.");
    error.statusCode = 400;
    throw error;
  }
}

function boolQuery(value) {
  return value === "true" || value === "1";
}

function apiPath(pathname) {
  return pathname.split("/").filter(Boolean).map(decodeURIComponent);
}

function staticFile(pathname) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const candidate = normalize(join(root, requested));
  if (!candidate.startsWith(root)) return null;
  try {
    if (!statSync(candidate).isFile()) return null;
    return { file: candidate, body: readFileSync(candidate), type: { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" }[extname(candidate)] || "application/octet-stream" };
  } catch {
    return null;
  }
}

export function createApp({ store = createDefaultStore(), provider = createProvider() } = {}) {
  return nodeCreateServer(async (req, res) => {
    const url = new URL(req.url || "/", "http://localhost");
    try {
      if (url.pathname.startsWith("/api/")) {
        const parts = apiPath(url.pathname);
        if (req.method === "GET" && url.pathname === "/api/health") {
          return sendJson(res, 200, { status: "ok", service: "ai-anki-flashcard-generator", provider: provider.name, time: new Date().toISOString() });
        }
        if (req.method === "GET" && url.pathname === "/api/projects") {
          return sendJson(res, 200, { projects: store.listProjects() });
        }
        if (req.method === "POST" && url.pathname === "/api/projects") {
          const body = await readJson(req);
          const project = store.createProject({ title: body.title, brief: body.brief });
          return sendJson(res, 201, presentProject(project));
        }
        if (req.method === "GET" && url.pathname === "/api/practice") {
          return sendJson(res, 200, { decks: listPracticeDecks() });
        }
        if (req.method === "POST" && parts[0] === "api" && parts[1] === "practice" && parts[2]) {
          return sendJson(res, 201, seedPracticeProject(store, parts[2]));
        }
        if (parts[0] === "api" && parts[1] === "projects" && parts[2]) {
          const projectId = parts[2];
          if (req.method === "GET" && parts.length === 3) {
            const project = store.getProject(projectId);
            return project ? sendJson(res, 200, presentProject(project)) : sendJson(res, 404, { error: "Project not found" });
          }
          if (req.method === "POST" && parts[3] === "brief") return sendJson(res, 200, updateBrief(store, projectId, await readJson(req)));
          if (req.method === "POST" && parts[3] === "plan") return sendJson(res, 200, createPlan(store, projectId));
          if (req.method === "POST" && parts[3] === "duplicate") return sendJson(res, 201, duplicateProject(store, projectId, (await readJson(req)).title));
          if (req.method === "POST" && parts[3] === "generate") {
            const body = await readJson(req);
            return sendJson(res, 200, await generateProject(store, projectId, { provider, idempotencyKey: body.idempotencyKey || req.headers["idempotency-key"] || null }));
          }
          if (req.method === "POST" && parts[3] === "validate") return sendJson(res, 200, validateAndSave(store, projectId));
          if (req.method === "POST" && parts[3] === "sources" && parts.length === 4) return sendJson(res, 201, addSource(store, projectId, await readJson(req)));
          if (req.method === "POST" && parts[3] === "sources" && parts[4] && parts[5] === "fetch") return sendJson(res, 200, await fetchSource(store, projectId, parts[4]));
          if (req.method === "POST" && parts[3] === "runs" && parts[4] && parts[5] === "cancel") return sendJson(res, 200, cancelRun(store, projectId, parts[4]));
          if (req.method === "GET" && parts[3] === "export") {
            const project = store.getProject(projectId);
            if (!project) return sendJson(res, 404, { error: "Project not found" });
            const artifact = buildExport(project, {
              format: url.searchParams.get("format") || project.brief.exportFormat || "tsv",
              cardType: url.searchParams.get("cardType") || "all",
              includeUnverified: boolQuery(url.searchParams.get("includeUnverified")),
            });
            recordExport(project, artifact);
            store.saveProject(project);
            return sendText(res, 200, artifact.text, {
              "content-type": artifact.format === "csv" ? "text/csv; charset=utf-8" : "text/tab-separated-values; charset=utf-8",
              "content-disposition": `attachment; filename="${artifact.fileName}"`,
              "x-anki-notes": String(artifact.notes),
              "x-anki-cards": String(artifact.cards),
            });
          }
          if (req.method === "POST" && parts[3] === "cards" && parts[4] === "bulk") return sendJson(res, 200, bulkCards(store, projectId, await readJson(req)));
          if (req.method === "POST" && parts[3] === "cards" && parts[4] && parts[5] === "verify") return sendJson(res, 200, verifyCard(store, projectId, parts[4], await readJson(req)));
          if (req.method === "PATCH" && parts[3] === "cards" && parts[4]) return sendJson(res, 200, patchCard(store, projectId, parts[4], await readJson(req)));
          if (req.method === "POST" && parts[3] === "cards" && parts[4] && parts[5] === "regenerate") return sendJson(res, 200, await regenerateCard(store, projectId, parts[4], { provider, ...(await readJson(req)) }));
        }
        return sendJson(res, 404, { error: "API route not found" });
      }
      const asset = staticFile(url.pathname);
      if (!asset) return sendText(res, 404, "Not found");
      res.writeHead(200, { "content-type": `${asset.type}; charset=utf-8`, "cache-control": "no-cache" });
      res.end(asset.body);
    } catch (error) {
      const status = error.statusCode || (error.code === "EXPORT_BLOCKED" || error.code === "NO_EXPORTABLE_CARDS" ? 409 : 500);
      sendJson(res, status, {
        error: error.message || "Unexpected server error",
        code: error.code || "INTERNAL_ERROR",
        validation: error.validation ? { metrics: error.validation.metrics, findings: error.validation.findings } : undefined,
      });
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000);
  const server = createApp();
  server.listen(port, () => console.log(`AI Anki Flashcard Generator listening on http://localhost:${port}`));
}
