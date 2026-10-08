import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../src/public/index.html", import.meta.url), "utf8");
const app = readFileSync(new URL("../src/public/app.js", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/public/styles.css", import.meta.url), "utf8");

test("Recall workspace keeps its accessibility and review-quality contract visible", () => {
  assert.match(html, /class="skip-link" href="#workspace"/);
  assert.match(html, /id="project-dialog" class="modal"/);
  assert.match(html, /id="regenerate-dialog" class="modal"/);
  assert.match(html, /id="card-search" type="search"/);
  assert.match(html, /value="apkg"/);
  assert.match(html, /id="copy-apkg-link"/);
  assert.match(html, /role="status" aria-live="polite"/);
  assert.match(app, /state\.cardLimit = 20/);
  assert.match(app, /data-card-more/);
  assert.match(app, /window\.confirm\("Reject this card\?/);
  assert.doesNotMatch(app, /window\.prompt/);
  assert.match(app, /export\.apkg/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.match(styles, /\*\:focus-visible/);
  assert.match(styles, /@media \(max-width: 650px\)/);
});
