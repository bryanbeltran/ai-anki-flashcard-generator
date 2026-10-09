import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const testTmp = existsSync("/var/tmp") ? "/var/tmp" : tmpdir();
const dataDir = mkdtempSync(join(testTmp, "recall-browser-data-"));
const downloadDir = mkdtempSync(join(testTmp, "recall-browser-downloads-"));
const session = `recall-e2e-${process.pid}`;
const child = spawn(process.execPath, ["src/server.js"], {
  cwd: root,
  env: { ...process.env, ANKI_DATA_DIR: dataDir, HOST: "127.0.0.1", PORT: "0", TMPDIR: testTmp },
  stdio: ["ignore", "pipe", "pipe"],
});

let output = "";
child.stdout.on("data", (chunk) => { output += chunk.toString(); });
child.stderr.on("data", (chunk) => { output += chunk.toString(); });

function browser(args) {
  return execFileSync("agent-browser", ["--session", session, "--args", "--no-sandbox", "--download-path", downloadDir, ...args], {
    cwd: root,
    env: { ...process.env, AGENT_BROWSER_IDLE_TIMEOUT_MS: "600000", TMPDIR: testTmp, AGENT_BROWSER_NAMESPACE: `recall-e2e-${process.pid}` },
    encoding: "utf8",
    maxBuffer: 2_000_000,
  });
}

async function waitForServer() {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const match = output.match(/Recall listening locally on http:\/\/127\.0\.0\.1:(\d+)/);
    if (match) return `http://127.0.0.1:${match[1]}`;
    if (child.exitCode !== null) throw new Error(`Recall server exited before startup:\n${output}`);
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 50));
  }
  throw new Error(`Timed out waiting for Recall server:\n${output}`);
}

function pageText() {
  return browser(["get", "text", "body"]);
}

function expectText(text, pattern) {
  assert.match(text, pattern);
}

async function main() {
  const base = await waitForServer();
  try {
    browser(["open", base]);
    browser(["wait", "--text", "Try the guided demo"]);
    browser(["wait", "--fn", "document.querySelectorAll('button[aria-label^=\"Open \"]').length === 6"]);
    assert.equal(Number(browser(["get", "count", "button[aria-label^=\"Open \"]"]).trim()), 6);

    browser(["click", "#empty-new-project"]);
    browser(["fill", "#project-name", "Browser E2E deck"]);
    browser(["click", "#new-project-form button[type=submit]"]);
    browser(["wait", "--fn", "document.querySelector('#project-view') && !document.querySelector('#project-view').hidden"]);
    browser(["fill", "textarea[name=topic]", "Graph algorithms"]);
    browser(["fill", "textarea[name=outcome]", "Recall BFS and DFS assumptions"]);
    browser(["fill", "input[name=audience]", "Engineer"]);
    browser(["fill", "input[name=cardCount]", "1"]);
    browser(["click", "#brief-form button[type=submit]"]);
    browser(["wait", "--text", "Brief saved"]);
    browser(["click", "#build-plan"]);
    browser(["wait", "--text", "Plan built"]);
    browser(["click", "#generate-project"]);
    browser(["wait", "--text", "Generation complete"]);
    browser(["click", "details.card-item summary"]);
    browser(["wait", "--fn", "document.querySelector('details.card-item[open] .evidence-panel') !== null"]);
    assert.match(browser(["get", "value", "textarea[data-field=back]"]), /Add a verified answer/);
    browser(["select", "select[data-field=sourceId]", ""]);
    browser(["click", "button[data-card-action=verify]"]);
    expectText(pageText(), /Choose a source before verifying this card/);

    browser(["fill", "#source-form input[name=title]", "E2E source notes"]);
    browser(["fill", "#source-form textarea[name=content]", "A graph traversal visits vertices and edges under a defined exploration rule."]);
    browser(["click", "#source-form button[type=submit]"]);
    browser(["wait", "--text", "Source added"]);
    browser(["click", "details.card-item summary"]);
    browser(["wait", "--fn", "document.querySelector('details.card-item[open] .evidence-panel') !== null"]);
    browser(["select", "select[data-field=sourceId]", "E2E source notes"]);
    browser(["fill", "textarea[data-field=claimText]", "The source notes support this graph traversal card."]);
    browser(["fill", "textarea[data-field=evidenceExcerpt]", "A graph traversal visits vertices and edges under a defined exploration rule."]);
    browser(["fill", "input[data-field=evidenceLocation]", "E2E source notes, line 1"]);
    browser(["click", "button[data-card-action=verify]"]);
    browser(["wait", "--text", "Evidence recorded and card approved"]);
    browser(["click", "details.card-item summary"]);
    browser(["wait", "--fn", "document.querySelector('details.card-item[open] .evidence-panel') !== null"]);
    expectText(pageText(), /Verified claim/);
    expectText(pageText(), /E2E source notes, line 1/);

    browser(["click", "#validate-project"]);
    browser(["wait", "--text", "Validation complete"]);
    browser(["select", "#export-format", "apkg"]);
    browser(["click", "#preview-export"]);
    browser(["wait", "--text", "Preview is ready"]);
    browser(["download", "#export-button", join(downloadDir, "browser-e2e.apkg")]);
    expectText(pageText(), /Downloaded 1 notes \/ 1 cards/);
    assert.equal(readFileSync(join(downloadDir, "browser-e2e.apkg")).subarray(0, 2).toString(), "PK");

    browser(["set", "viewport", "390", "844"]);
    assert.equal(browser(["eval", "document.documentElement.scrollWidth <= window.innerWidth"]).trim(), "true");
    expectText(pageText(), /Review cards/);
    console.log("Browser E2E passed: create → brief → plan → generate → review → verify → APKG export → mobile layout");
  } finally {
    try { browser(["close"]); } catch { /* Browser may not have launched. */ }
    if (child.exitCode === null) child.kill("SIGTERM");
    rmSync(dataDir, { recursive: true, force: true });
    rmSync(downloadDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  if (child.exitCode === null) child.kill("SIGTERM");
  rmSync(dataDir, { recursive: true, force: true });
  rmSync(downloadDir, { recursive: true, force: true });
  process.exitCode = 1;
});
