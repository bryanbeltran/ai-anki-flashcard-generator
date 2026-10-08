const state = { project: null, projects: [], practice: [], filter: "all" };

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function rich(value) {
  return escapeHtml(value).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replaceAll("\n", "<br>");
}

async function api(path, options = {}) {
  const response = await fetch(path, { headers: { "content-type": "application/json", ...(options.headers || {}) }, ...options });
  const type = response.headers.get("content-type") || "";
  const payload = type.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    const error = new Error(payload?.error || payload || `Request failed (${response.status})`);
    error.payload = payload;
    throw error;
  }
  return payload;
}

function showMessage(selector, message, kind = "") {
  const element = $(selector);
  element.textContent = message;
  element.className = `form-message ${kind}`.trim();
}

async function loadProjects() {
  const payload = await api("/api/projects");
  state.projects = payload.projects || [];
  renderProjectList();
  if (!state.project && state.projects[0]) await loadProject(state.projects[0].id);
}

async function loadPractice() {
  const payload = await api("/api/practice");
  state.practice = payload.decks || [];
  renderPractice();
}

async function loadProject(id) {
  try {
    state.project = await api(`/api/projects/${encodeURIComponent(id)}`);
    renderAll();
  } catch (error) {
    showMessage("#brief-message", error.message, "error");
  }
}

function renderProjectList() {
  const list = $("#project-list");
  if (!state.projects.length) {
    list.innerHTML = '<li class="muted small">No projects yet.</li>';
    return;
  }
  list.innerHTML = state.projects.map((project) => `
    <li><button class="project-link ${state.project?.id === project.id ? "active" : ""}" data-project-id="${escapeHtml(project.id)}">
      <strong>${escapeHtml(project.title)}</strong><small>${escapeHtml(project.status)} · ${project.cardCount || 0} cards</small>
    </button></li>`).join("");
}

function renderPractice() {
  $("#practice-decks").innerHTML = state.practice.map((deck) => `
    <article class="practice-card">
      <strong>${escapeHtml(deck.title)}</strong>
      <span class="muted small">${deck.cardCount} verified cards</span>
      <button class="button secondary" data-practice-slug="${escapeHtml(deck.slug)}">Open practice deck</button>
    </article>`).join("");
}

function setFormValue(form, name, value) {
  const input = form.elements.namedItem(name);
  if (input) input.value = value ?? "";
}

function fillBrief() {
  const project = state.project;
  if (!project) return;
  const form = $("#brief-form");
  const brief = project.brief || {};
  ["topic", "outcome", "audience", "prerequisites", "cardCount", "difficulty", "sourcePolicy", "exportFormat", "deckName", "includedScope", "excludedScope"].forEach((name) => setFormValue(form, name, brief[name]));
  $$('input[name="allowedTypes"]', form).forEach((input) => { input.checked = (brief.allowedTypes || []).includes(input.value); });
  $("#export-format").value = brief.exportFormat || "tsv";
}

function renderMetrics() {
  const metrics = state.project?.computedMetrics || state.project?.metrics || {};
  const values = [
    [metrics.generatedCandidates ?? 0, "Candidates"],
    [metrics.approvedCards ?? 0, "Approved"],
    [metrics.verifiedCards ?? 0, "Verified"],
    [`${metrics.coveragePercent ?? 0}%`, "Required coverage"],
    [metrics.hardGateCount ?? 0, "Hard gates"],
    [metrics.warningCount ?? 0, "Warnings"],
  ];
  $("#metrics").innerHTML = values.map(([value, label]) => `<div class="metric"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`).join("");
}

function renderQuestions() {
  const questions = state.project?.clarifyingQuestions || [];
  $("#brief-pill").textContent = questions.some((question) => question.required) ? "Needs clarification" : "Brief ready";
  $("#brief-pill").className = `pill ${questions.some((question) => question.required) ? "" : "good"}`.trim();
  $("#questions").innerHTML = questions.length
    ? `<p class="muted small">Resolve these decisions before generation:</p>${questions.map((question) => `<div class="question"><strong>${escapeHtml(question.label)}${question.required ? " · required" : ""}</strong>${escapeHtml(question.question)}</div>`).join("")}`
    : '<div class="question" style="background: var(--accent-soft); border-color: var(--accent)"><strong>Brief ready.</strong>The planner has enough information to build a scoped generation plan.</div>';
}

function renderPlan() {
  const plan = state.project?.plan;
  if (!plan) {
    $("#plan-content").innerHTML = '<p class="muted">No plan yet. Save the brief, then build a plan before generating.</p>';
    return;
  }
  $("#plan-content").innerHTML = `
    <p class="muted small">${plan.requestedCardCount} planned cards · ${escapeHtml(plan.difficulty)} difficulty · ${Object.entries(plan.typeDistribution || {}).map(([type, count]) => `${escapeHtml(type)} ${count}`).join(" · ")}</p>
    <div class="plan-grid">${(plan.scope || []).map((scope) => `<div class="scope-item"><strong>${escapeHtml(scope.label)}</strong><span>${scope.allocatedCards} cards</span></div>`).join("")}</div>`;
}

function renderSources() {
  const sources = state.project?.sources || [];
  $("#source-count").textContent = `${sources.length} source${sources.length === 1 ? "" : "s"}`;
  $("#sources").innerHTML = sources.length ? sources.map((source) => `<div class="source-row"><div><strong>${escapeHtml(source.title)}</strong><small>${escapeHtml(source.url || source.contentPreview || "Pasted source")}</small></div><div>${source.url ? `<button class="button secondary" data-source-action="fetch" data-source-id="${escapeHtml(source.id)}">Refresh snapshot</button>` : ""}<span class="pill ${source.accessStatus === "available" ? "good" : ""}">${escapeHtml(source.accessStatus || "available")}</span></div></div>`).join("") : '<p class="muted small">No sources yet. Mixed-source drafts can generate, but verified export requires evidence.</p>';
}

function renderCoverage() {
  const coverage = state.project?.coverage || [];
  $("#coverage").innerHTML = coverage.length ? coverage.map((item) => `<span class="coverage-item ${item.covered ? "good" : "bad"}">${item.covered ? "✓" : "!"} ${escapeHtml(item.label)} · ${item.cardCount}</span>`).join("") : "";
}

function statusLabel(card) {
  if (card.locked) return "Locked";
  if (card.status === "approved" && card.evidenceStatus === "verified") return "Approved · verified";
  if (card.status === "approved") return "Approved · review evidence";
  return card.status || "Draft";
}

function option(value, label, current) {
  return `<option value="${escapeHtml(value)}" ${value === current ? "selected" : ""}>${escapeHtml(label)}</option>`;
}

function renderCards() {
  const cards = (state.project?.cards || []).filter((card) => state.filter === "all" || card.status === state.filter);
  const findings = state.project?.validations || [];
  if (!cards.length) {
    $("#cards").innerHTML = '<p class="muted">No cards match this filter yet.</p>';
    return;
  }
  $("#cards").innerHTML = cards.map((card, index) => {
    const cardFindings = findings.filter((finding) => finding.cardId === card.id);
    const disabled = card.locked ? "disabled" : "";
    const sourceOptions = (state.project?.sources || []).map((source) => `<option value="${escapeHtml(source.id)}" ${(card.sourceIds || []).includes(source.id) ? "selected" : ""}>${escapeHtml(source.title)}</option>`).join("");
    return `<details class="card-item" data-card-id="${escapeHtml(card.id)}">
      <summary class="card-summary"><span class="card-number">${index + 1}</span><span class="card-front"><strong>${rich(card.front)}</strong><small>${escapeHtml(card.type)} · ${escapeHtml(card.difficulty)} · ${escapeHtml(card.tags?.join(" · ") || "untagged")}</small></span><span class="card-status ${card.evidenceStatus === "verified" && card.status === "approved" ? "good" : "warn"}">${escapeHtml(statusLabel(card))}</span></summary>
      <div class="card-editor">
        <div class="editor-grid">
          <label>Front / prompt<textarea data-field="front" rows="3" ${disabled}>${escapeHtml(card.front)}</textarea></label>
          <label>Back / answer<textarea data-field="back" rows="3" ${disabled}>${escapeHtml(card.back)}</textarea></label>
          <label>Extra / explanation<textarea data-field="extra" rows="3" ${disabled}>${escapeHtml(card.extra)}</textarea></label>
          <label>Tags<input data-field="tags" value="${escapeHtml((card.tags || []).join(", "))}" ${disabled} /></label>
          <label>Card type<select data-field="type" ${disabled}>${option("basic", "Basic", card.type)}${option("reversed-basic", "Reversed basic", card.type)}${option("cloze", "Cloze", card.type)}${option("type-in", "Type-in", card.type)}</select></label>
          <label>Difficulty<select data-field="difficulty" ${disabled}>${option("beginner", "Beginner", card.difficulty)}${option("foundational", "Foundational", card.difficulty)}${option("intermediate", "Intermediate", card.difficulty)}${option("advanced", "Advanced", card.difficulty)}</select></label>
          <label>Evidence source<select data-field="sourceId" ${disabled}><option value="">Choose a source</option>${sourceOptions}</select></label>
        </div>
        ${cardFindings.length ? `<ul class="finding-list">${cardFindings.map((finding) => `<li class="${finding.severity === "error" ? "error" : ""}">${escapeHtml(finding.severity)}: ${escapeHtml(finding.message)}</li>`).join("")}</ul>` : ""}
        <div class="editor-actions">
          <button class="button secondary" data-card-action="save" ${disabled}>Save edits</button>
          <button class="button secondary" data-card-action="toggle-lock">${card.locked ? "Unlock" : "Lock"}</button>
          <button class="button secondary" data-card-action="regenerate" ${disabled}>Regenerate</button>
          <button class="button secondary" data-card-action="verify" ${disabled}>Verify with source</button>
          <button class="button ${card.status === "approved" ? "secondary" : "primary"}" data-card-action="approve" ${disabled}>${card.status === "approved" ? "Approved" : "Approve"}</button>
        </div>
      </div>
    </details>`;
  }).join("");
}

function renderAll() {
  const project = state.project;
  const hasProject = Boolean(project);
  $("#empty-state").hidden = hasProject;
  $("#project-view").hidden = !hasProject;
  if (!hasProject) return;
  $("#project-status").textContent = project.status;
  $("#project-title").textContent = project.title;
  $("#project-subtitle").textContent = `${project.brief?.topic || "No topic yet"} · ${project.cards?.length || 0} cards`;
  fillBrief();
  renderMetrics();
  renderQuestions();
  renderSources();
  renderPlan();
  renderCoverage();
  renderCards();
  const canExport = Boolean(project.canExport);
  $("#export-pill").textContent = canExport ? "Export ready" : "Review required";
  $("#export-pill").className = `pill ${canExport ? "good" : ""}`.trim();
  renderProjectList();
}

async function createProject() {
  const title = window.prompt("Project name", "New Anki deck");
  if (!title) return;
  try {
    state.project = await api("/api/projects", { method: "POST", body: JSON.stringify({ title }) });
    await loadProjects();
    renderAll();
  } catch (error) { showMessage("#brief-message", error.message, "error"); }
}

async function saveBrief(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const allowedTypes = $$('input[name="allowedTypes"]:checked', form).map((input) => input.value);
  const body = {
    topic: form.elements.topic.value,
    outcome: form.elements.outcome.value,
    audience: form.elements.audience.value,
    cardCount: form.elements.cardCount.value ? Number(form.elements.cardCount.value) : null,
    difficulty: form.elements.difficulty.value,
    sourcePolicy: form.elements.sourcePolicy.value,
    exportFormat: form.elements.exportFormat.value,
    deckName: form.elements.deckName.value,
    includedScope: form.elements.includedScope.value,
    excludedScope: form.elements.excludedScope.value,
    allowedTypes,
    confirmed: true,
  };
  try {
    state.project = await api(`/api/projects/${state.project.id}/brief`, { method: "POST", body: JSON.stringify(body) });
    showMessage("#brief-message", "Brief saved. Build or revise the plan next.", "success");
    renderAll();
  } catch (error) { showMessage("#brief-message", error.message, "error"); }
}

async function withProjectAction(action, successMessage = "Updated") {
  try {
    state.project = await action();
    showMessage("#brief-message", successMessage, "success");
    renderAll();
    await loadProjects();
  } catch (error) { showMessage("#brief-message", error.message, "error"); }
}

document.addEventListener("click", async (event) => {
  const projectButton = event.target.closest("[data-project-id]");
  if (projectButton) return loadProject(projectButton.dataset.projectId);
  const practiceButton = event.target.closest("[data-practice-slug]");
  if (practiceButton) {
    try { state.project = await api(`/api/practice/${encodeURIComponent(practiceButton.dataset.practiceSlug)}`, { method: "POST", body: "{}" }); renderAll(); await loadProjects(); }
    catch (error) { showMessage("#brief-message", error.message, "error"); }
    return;
  }
  const sourceAction = event.target.closest("[data-source-action]");
  if (sourceAction) {
    if (sourceAction.dataset.sourceAction === "fetch") {
      try { state.project = await api(`/api/projects/${state.project.id}/sources/${sourceAction.dataset.sourceId}/fetch`, { method: "POST", body: "{}" }); renderAll(); showMessage("#source-message", "Source snapshot refreshed.", "success"); }
      catch (error) { showMessage("#source-message", error.message, "error"); }
    }
    return;
  }
  const cardAction = event.target.closest("[data-card-action]");
  if (cardAction) {
    const details = cardAction.closest("[data-card-id]");
    const cardId = details.dataset.cardId;
    const action = cardAction.dataset.cardAction;
    if (action === "save") {
      const get = (field) => details.querySelector(`[data-field="${field}"]`);
      const sourceId = get("sourceId")?.value;
      await withProjectAction(() => api(`/api/projects/${state.project.id}/cards/${cardId}`, { method: "PATCH", body: JSON.stringify({ front: get("front").value, back: get("back").value, extra: get("extra").value, tags: get("tags").value.split(",").map((tag) => tag.trim()).filter(Boolean), type: get("type").value, difficulty: get("difficulty").value, ...(sourceId ? { sourceIds: [sourceId] } : {}) }) }), "Card saved and sent back through validation.");
    }
    if (action === "toggle-lock") {
      const card = state.project.cards.find((item) => item.id === cardId);
      await withProjectAction(() => api(`/api/projects/${state.project.id}/cards/${cardId}`, { method: "PATCH", body: JSON.stringify({ locked: !card.locked }) }), card.locked ? "Card unlocked." : "Card locked.");
    }
    if (action === "approve") {
      await withProjectAction(() => api(`/api/projects/${state.project.id}/cards/bulk`, { method: "POST", body: JSON.stringify({ cardIds: [cardId], action: "approve" }) }), "Card approved. Validation will determine export readiness.");
    }
    if (action === "regenerate") {
      const instruction = window.prompt("Regeneration instruction", "Improve clarity while preserving the learning objective and evidence.");
      if (instruction) await withProjectAction(() => api(`/api/projects/${state.project.id}/cards/${cardId}/regenerate`, { method: "POST", body: JSON.stringify({ instruction }) }), "Card regenerated and returned to review.");
    }
    if (action === "verify") {
      const sourceId = details.querySelector('[data-field="sourceId"]')?.value;
      if (!sourceId) { showMessage("#brief-message", "Choose a source before verifying this card.", "error"); return; }
      await withProjectAction(() => api(`/api/projects/${state.project.id}/cards/${cardId}/verify`, { method: "POST", body: JSON.stringify({ sourceIds: [sourceId] }) }), "Evidence recorded and card approved.");
    }
  }
});

$("#new-project").addEventListener("click", createProject);
$("#empty-new-project").addEventListener("click", createProject);
$("#refresh-projects").addEventListener("click", async () => { await loadProjects(); await loadPractice(); renderAll(); });
$("#brief-form").addEventListener("submit", saveBrief);
$("#source-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    state.project = await api(`/api/projects/${state.project.id}/sources`, { method: "POST", body: JSON.stringify({ title: form.elements.title.value, url: form.elements.url.value, content: form.elements.content.value, quality: form.elements.quality.value }) });
    form.reset();
    showMessage("#source-message", "Source added. Select it on a card to verify evidence.", "success");
    renderAll();
  } catch (error) { showMessage("#source-message", error.message, "error"); }
});
$("#build-plan").addEventListener("click", () => withProjectAction(() => api(`/api/projects/${state.project.id}/plan`, { method: "POST", body: "{}" }), "Plan built. Review the scope contract before generating."));
$("#generate-project").addEventListener("click", () => withProjectAction(() => api(`/api/projects/${state.project.id}/generate`, { method: "POST", body: JSON.stringify({ idempotencyKey: `ui-${Date.now()}` }) }), "Generation complete. Review findings and approve cards before export."));
$("#validate-project").addEventListener("click", () => withProjectAction(() => api(`/api/projects/${state.project.id}/validate`, { method: "POST", body: "{}" }), "Validation complete."));
$("#card-filter").addEventListener("change", (event) => { state.filter = event.target.value; renderCards(); });
$("#approve-visible").addEventListener("click", () => {
  const visible = (state.project.cards || []).filter((card) => state.filter === "all" || card.status === state.filter).map((card) => card.id);
  withProjectAction(() => api(`/api/projects/${state.project.id}/cards/bulk`, { method: "POST", body: JSON.stringify({ cardIds: visible, action: "approve" }) }), `${visible.length} visible cards approved.`);
});
$("#export-button").addEventListener("click", async () => {
  const message = "#export-message";
  try {
    const params = new URLSearchParams({ format: $("#export-format").value, cardType: $("#export-type").value });
    if ($("#include-unverified").checked) params.set("includeUnverified", "true");
    const response = await fetch(`/api/projects/${state.project.id}/export?${params}`);
    if (!response.ok) { const body = await response.json(); throw new Error(body.error || "Export failed"); }
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = response.headers.get("content-disposition")?.match(/filename="([^"]+)/)?.[1] || "anki-export.tsv";
    link.click();
    URL.revokeObjectURL(link.href);
    showMessage(message, `Downloaded ${response.headers.get("x-anki-notes")} notes / ${response.headers.get("x-anki-cards")} cards.`, "success");
  } catch (error) { showMessage(message, error.message, "error"); }
});
$("#preview-export").addEventListener("click", async () => {
  try {
    const params = new URLSearchParams({ format: $("#export-format").value, cardType: $("#export-type").value });
    if ($("#include-unverified").checked) params.set("includeUnverified", "true");
    const preview = await api(`/api/projects/${state.project.id}/export/preview?${params}`);
    $("#export-preview").hidden = false;
    $("#export-preview").textContent = JSON.stringify(preview, null, 2);
    showMessage("#export-message", preview.blocked ? "Preview generated; resolve validation blockers before downloading." : "Preview is ready.", preview.blocked ? "error" : "success");
  } catch (error) { showMessage("#export-message", error.message, "error"); }
});

await Promise.all([loadProjects(), loadPractice()]);
renderAll();
