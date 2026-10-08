import test from "node:test";
import assert from "node:assert/strict";
import { buildClarifyingQuestions, buildPlan, createProject, normalizeBrief } from "../src/domain.js";

test("normalizeBrief preserves explicit constraints and safe defaults", () => {
  const brief = normalizeBrief({ topic: "Korean", cardCount: "24", allowedTypes: ["basic", "not-real"], exportFormat: "csv" });
  assert.equal(brief.topic, "Korean");
  assert.equal(brief.cardCount, 24);
  assert.deepEqual(brief.allowedTypes, ["basic"]);
  assert.equal(brief.exportFormat, "csv");
  assert.equal(brief.sourcePolicy, "mixed");
});

test("clarifying questions prioritize missing required decisions", () => {
  const project = createProject({ title: "Test" });
  const questions = buildClarifyingQuestions(project.brief);
  assert.deepEqual(questions.filter((question) => question.required).map((question) => question.id), ["topic", "outcome", "audience", "cardCount"]);
});

test("plan creates an exact card budget across scope", () => {
  const brief = normalizeBrief({ topic: "Graphs", outcome: "Interview recall", audience: "Engineer", cardCount: 11, includedScope: "BFS, DFS, shortest paths" });
  const plan = buildPlan(brief);
  assert.equal(plan.requestedCardCount, 11);
  assert.equal(plan.scope.reduce((total, item) => total + item.allocatedCards, 0), 11);
  assert.equal(plan.scope.length, 3);
});
