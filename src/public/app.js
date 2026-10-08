const state = { project: null, projects: [], practice: [], filter: "all", search: "", cardLimit: 20, toastTimer: null, pendingRegeneration: null };

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

function showToast(message, kind = "") {
  const toast = $("#toast");
  if (!toast) return;
  clearTimeout(state.toastTimer);
  toast.textContent = message;
  toast.className = `toast ${kind}`.trim();
  toast.hidden = false;
  state.toastTimer = setTimeout(() => { toast.hidden = true; }, 4200);
}

function showMessage(selector, message, kind = "") {
  const element = $(selector);
  if (element) {
    element.textContent = message;
    element.className = `form-message ${kind}`.trim();
  }
  if (message) showToast(message, kind);
}

function setBusy(element, busy) {
  if (!element) return;
  element.disabled = busy;
  element.setAttribute("aria-busy", String(busy));
  element.classList.toggle("is-busy", busy);
}

function statusTone(status) {
  const value = String(status || "").toLowerCase();
  if (value.includes("ready") || value === "approved" || value === "export ready") return "good";
  if (value.includes("failed") || value.includes("blocked") || value === "rejected") return "bad";
  return "";
}

function formatCount(value, noun = "card") {
  const count = Number(value) || 0;
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function resetCardView() {
  state.filter = "all";
  state.search = "";
  state.cardLimit = 20;
  const search = $("#card-search");
  const filter = $("#card-filter");
  if (search) search.value = "";
  if (filter) filter.value = "all";
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
    resetCardView();
    renderAll();
  } catch (error) {
    showMessage("#brief-message", error.message, "error");
  }
}

function renderProjectList() {
  const list = $("#project-list");
  $("#project-count").textContent = state.projects.length;
  if (!state.projects.length) {
    list.innerHTML = '<li class="sidebar-empty"><span aria-hidden="true">＋</span><span>No projects yet.<br /><small>Create one to start a deck.</small></span></li>';
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
      <div class="practice-card-title"><span class="practice-dot" aria-hidden="true">✦</span><strong>${escapeHtml(deck.title)}</strong></div>
      <span class="muted small">${formatCount(deck.cardCount)} · ${deck.metrics?.coveragePercent ?? 0}% covered</span>
      <button class="button secondary" data-practice-slug="${escapeHtml(deck.slug)}" type="button">Open deck <span aria-hidden="true">→</span></button>
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
  ["topic", "outcome", "audience", "prerequisites", "cardCount", "difficulty", "sourcePolicy", "exportFormat", "deckName", "includedScope", "excludedScope", "sensitiveContent"].forEach((name) => setFormValue(form, name, brief[name]));
  $$('input[name="allowedTypes"]', form).forEach((input) => { input.checked = (brief.allowedTypes || []).includes(input.value); });
  $("#export-format").value = brief.exportFormat || "tsv";
}

function buildApkgLink() {
  if (!state.project) return "";
  const params = new URLSearchParams({ cardType: $("#export-type").value || "all" });
  if ($("#include-unverified").checked) params.set("includeUnverified", "true");
  return new URL(`/api/projects/${encodeURIComponent(state.project.id)}/export.apkg?${params}`, window.location.origin).href;
}

function updateExportFormatUi() {
  const isApkg = $("#export-format").value === "apkg";
  const copyButton = $("#copy-apkg-link");
  const hint = $("#apkg-link-hint");
  const link = $("#apkg-link");
  if (copyButton) copyButton.hidden = !isApkg;
  if (hint) hint.hidden = !isApkg;
  if (link) {
    link.hidden = !isApkg;
    link.href = isApkg ? buildApkgLink() : "";
    link.textContent = isApkg ? buildApkgLink() : "";
  }
}

function renderMetrics() {
  const metrics = state.project?.computedMetrics || state.project?.metrics || {};
  const values = [
    { value: metrics.generatedCandidates ?? 0, label: "Candidates" },
    { value: metrics.approvedCards ?? 0, label: "Approved" },
    { value: metrics.verifiedCards ?? 0, label: "Verified", tone: metrics.verifiedCards ? "good" : "" },
    { value: `${metrics.coveragePercent ?? 0}%`, label: "Required coverage", tone: metrics.coveragePercent === 100 ? "good" : "warning" },
    { value: metrics.hardGateCount ?? 0, label: "Hard gates", tone: metrics.hardGateCount ? "bad" : "good" },
    { value: metrics.warningCount ?? 0, label: "Warnings", tone: metrics.warningCount ? "warning" : "good" },
  ];
  $("#metrics").innerHTML = values.map(({ value, label, tone = "" }) => `<div class="metric ${tone}" aria-label="${escapeHtml(`${value} ${label}`)}"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`).join("");
}

function renderQuestions() {
  const questions = state.project?.clarifyingQuestions || [];
  $("#brief-pill").textContent = questions.some((question) => question.required) ? "Needs clarification" : "Brief ready";
  $("#brief-pill").className = `pill ${questions.some((question) => question.required) ? "" : "good"}`.trim();
  $("#questions").innerHTML = questions.length
    ? `<p class="muted small">Resolve these decisions before generation:</p>${questions.map((question) => `<div class="question"><strong>${escapeHtml(question.label)}${question.required ? " · required" : ""}</strong>${escapeHtml(question.question)}</div>`).join("")}`
    : '<div class="question ready"><strong>Brief ready.</strong>The planner has enough information to build a scoped generation plan.</div>';
}

function renderPlan() {
  const plan = state.project?.plan;
  if (!plan) {
    $("#plan-content").innerHTML = '<p class="muted">No plan yet. Save the brief, then build a plan before generating.</p>';
    return;
  }
  $("#plan-content").innerHTML = `
    <div class="plan-summary"><strong>${formatCount(plan.requestedCardCount)}</strong><span>planned · ${escapeHtml(plan.difficulty)} difficulty</span><span class="plan-types">${Object.entries(plan.typeDistribution || {}).map(([type, count]) => `${escapeHtml(type)} ${count}`).join(" · ")}</span></div>
    <div class="plan-grid">${(plan.scope || []).map((scope) => `<div class="scope-item"><span class="scope-index" aria-hidden="true">${String(scope.allocatedCards).padStart(2, "0")}</span><span><strong>${escapeHtml(scope.label)}</strong><small>${scope.allocatedCards} allocated · ${escapeHtml(scope.coverageStatus || "planned")}</small></span></div>`).join("")}</div>`;
}

function renderSources() {
  const sources = state.project?.sources || [];
  $("#source-count").textContent = `${sources.length} source${sources.length === 1 ? "" : "s"}`;
  $("#sources").innerHTML = sources.length ? sources.map((source) => `<div class="source-row"><div class="source-info"><span class="source-icon" aria-hidden="true">⌁</span><span><strong>${escapeHtml(source.title)}</strong><small>${escapeHtml(source.url || source.contentPreview || "Pasted source")}</small></span></div><div class="source-actions">${source.url ? `<button class="button secondary" data-source-action="fetch" data-source-id="${escapeHtml(source.id)}" type="button">Refresh snapshot</button>` : ""}<span class="pill ${source.accessStatus === "available" ? "good" : ""}">${escapeHtml(source.accessStatus || "available")}</span></div></div>`).join("") : '<div class="empty-list"><span aria-hidden="true">⌁</span><span><strong>No sources yet</strong><small>Mixed-source drafts can generate, but verified export requires evidence.</small></span></div>';
}

function renderCoverage() {
  const coverage = state.project?.coverage || [];
  $("#coverage").innerHTML = coverage.length ? coverage.map((item) => `<span class="coverage-item ${item.covered ? "good" : "bad"}" aria-label="${escapeHtml(`${item.label}: ${item.covered ? "covered" : "missing"}`)}"><span aria-hidden="true">${item.covered ? "✓" : "!"}</span> ${escapeHtml(item.label)} <small>${item.cardCount} ${item.cardCount === 1 ? "card" : "cards"}</small></span>`).join("") : "";
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
  const allCards = state.project?.cards || [];
  const query = state.search.trim().toLowerCase();
  const cards = allCards.filter((card) => {
    const matchesFilter = state.filter === "all" || card.status === state.filter;
    const haystack = [card.front, card.back, card.extra, ...(card.tags || [])].join(" ").toLowerCase();
    return matchesFilter && (!query || haystack.includes(query));
  });
  const findings = state.project?.validations || [];
  $("#review-count").textContent = query || state.filter !== "all" ? `${cards.length} of ${formatCount(allCards.length)}` : formatCount(cards.length);
  if (!cards.length) {
    $("#cards").innerHTML = `<div class="empty-list card-empty"><span aria-hidden="true">⌕</span><span><strong>${allCards.length ? "No cards match this view" : "No cards yet"}</strong><small>${allCards.length ? "Try a different filter or search term." : "Build a plan, then generate your first candidates."}</small></span></div>`;
    $("#card-pagination").innerHTML = "";
    return;
  }
  const visibleCards = cards.slice(0, state.cardLimit);
  $("#cards").innerHTML = visibleCards.map((card, index) => {
    const cardNumber = allCards.indexOf(card) + 1 || index + 1;
    const cardFindings = findings.filter((finding) => finding.cardId === card.id);
    const disabled = card.locked ? "disabled" : "";
    const sourceOptions = (state.project?.sources || []).map((source) => `<option value="${escapeHtml(source.id)}" ${(card.sourceIds || []).includes(source.id) ? "selected" : ""}>${escapeHtml(source.title)}</option>`).join("");
    return `<details class="card-item" data-card-id="${escapeHtml(card.id)}">
      <summary class="card-summary"><span class="card-number">${String(cardNumber).padStart(2, "0")}</span><span class="card-front"><strong>${rich(card.front)}</strong><small>${escapeHtml(card.type)} · ${escapeHtml(card.difficulty)} · ${escapeHtml(card.tags?.join(" · ") || "untagged")}</small></span><span class="card-status ${card.evidenceStatus === "verified" && card.status === "approved" ? "good" : "warn"}">${escapeHtml(statusLabel(card))}</span></summary>
      <div class="card-editor">
        <div class="editor-grid">
          <label>Front / prompt<textarea name="front" autocomplete="off" data-field="front" rows="3" ${disabled}>${escapeHtml(card.front)}</textarea></label>
          <label>Back / answer<textarea name="back" autocomplete="off" data-field="back" rows="3" ${disabled}>${escapeHtml(card.back)}</textarea></label>
          <label>Extra / explanation<textarea name="extra" autocomplete="off" data-field="extra" rows="3" ${disabled}>${escapeHtml(card.extra)}</textarea></label>
          <label>Tags<input name="tags" autocomplete="off" data-field="tags" value="${escapeHtml((card.tags || []).join(", "))}" ${disabled} /></label>
          <label>Card type<select name="type" data-field="type" ${disabled}>${option("basic", "Basic", card.type)}${option("reversed-basic", "Reversed basic", card.type)}${option("cloze", "Cloze", card.type)}${option("type-in", "Type-in", card.type)}</select></label>
          <label>Difficulty<select name="difficulty" data-field="difficulty" ${disabled}>${option("beginner", "Beginner", card.difficulty)}${option("foundational", "Foundational", card.difficulty)}${option("intermediate", "Intermediate", card.difficulty)}${option("advanced", "Advanced", card.difficulty)}</select></label>
          <label>Evidence source<select name="sourceId" data-field="sourceId" ${disabled}><option value="">Choose a source</option>${sourceOptions}</select></label>
        </div>
        ${cardFindings.length ? `<ul class="finding-list">${cardFindings.map((finding) => `<li class="${finding.severity === "error" ? "error" : ""}">${escapeHtml(finding.severity)}: ${escapeHtml(finding.message)}</li>`).join("")}</ul>` : ""}
        <div class="editor-actions">
          <button class="button secondary" data-card-action="save" type="button" ${disabled}>Save edits</button>
          <button class="button secondary" data-card-action="toggle-lock" type="button">${card.locked ? "Unlock" : "Lock"}</button>
          <button class="button secondary" data-card-action="regenerate" type="button" ${disabled}>Regenerate</button>
          <button class="button secondary" data-card-action="verify" type="button" ${disabled}>Verify with source</button>
          <button class="button ${card.status === "approved" ? "secondary" : "primary"}" data-card-action="approve" type="button" ${disabled}>${card.status === "approved" ? "Approved" : "Approve"}</button>
          <button class="button danger" data-card-action="reject" type="button" ${disabled}>${card.status === "rejected" ? "Rejected" : "Reject"}</button>
        </div>
      </div>
    </details>`;
  }).join("");
  const remaining = cards.length - visibleCards.length;
  $("#card-pagination").innerHTML = remaining > 0 ? `<button class="button secondary" data-card-more type="button">Show ${Math.min(20, remaining)} more <span aria-hidden="true">↓</span></button><span class="muted small">${remaining} more ${remaining === 1 ? "card" : "cards"} in this view</span>` : "";
}

function renderAll() {
  const project = state.project;
  const hasProject = Boolean(project);
  $("#empty-state").hidden = hasProject;
  $("#project-view").hidden = !hasProject;
  if (!hasProject) return;
  $("#project-status").textContent = project.status;
  $("#project-status").className = `eyebrow status-label ${statusTone(project.status)}`.trim();
  $("#project-title").textContent = project.title;
  $("#project-subtitle").textContent = `${project.brief?.topic || "No topic yet"} · ${formatCount(project.cards?.length || 0)} · ${project.brief?.difficulty || "adaptive"} difficulty`;
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
  const requiredQuestions = (project.clarifyingQuestions || []).some((question) => question.required);
  const generateButton = $("#generate-project");
  generateButton.disabled = !project.plan || requiredQuestions || project.status === "Generating";
  generateButton.title = !project.plan ? "Build a plan before generating" : requiredQuestions ? "Complete the required brief fields first" : "Generate card candidates";
  const buildPlanButton = $("#build-plan");
  buildPlanButton.disabled = requiredQuestions;
  updateExportFormatUi();
  updateWorkflow(project, requiredQuestions);
  renderProjectList();
}

function updateWorkflow(project, requiredQuestions) {
  const steps = [
    { id: "brief-panel", complete: !requiredQuestions },
    { id: "source-panel", complete: (project.sources || []).length > 0 },
    { id: "plan-panel", complete: Boolean(project.plan) },
    { id: "review-panel", complete: Boolean(project.cards?.length) && (project.computedMetrics?.approvedCards || 0) === project.cards.length },
    { id: "export-panel", complete: Boolean(project.canExport) },
  ];
  let activeAssigned = false;
  $$(".workflow-step").forEach((step, index) => {
    const item = steps[index];
    const active = !activeAssigned && !item.complete;
    if (active) activeAssigned = true;
    step.classList.toggle("complete", item.complete);
    step.classList.toggle("active", active || (!activeAssigned && index === steps.length - 1));
  });
}

function openProjectDialog() {
  const dialog = $("#project-dialog");
  const input = $("#project-name");
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
  input.value = "";
  requestAnimationFrame(() => input.focus());
}

function closeProjectDialog() {
  const dialog = $("#project-dialog");
  if (typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
}

function openRegenerateDialog(cardId, trigger) {
  const dialog = $("#regenerate-dialog");
  state.pendingRegeneration = { cardId, trigger };
  $("#regenerate-instruction").value = "Improve clarity while preserving the learning objective and evidence.";
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
  requestAnimationFrame(() => $("#regenerate-instruction").focus());
}

function closeRegenerateDialog() {
  const dialog = $("#regenerate-dialog");
  state.pendingRegeneration = null;
  if (typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
}

async function createProject(title, submitButton) {
  setBusy(submitButton, true);
  try {
    state.project = await api("/api/projects", { method: "POST", body: JSON.stringify({ title }) });
    resetCardView();
    closeProjectDialog();
    await loadProjects();
    renderAll();
    showToast("Workspace created. Define the learning brief to begin.", "success");
  } catch (error) {
    showMessage("#brief-message", error.message, "error");
  } finally {
    setBusy(submitButton, false);
  }
}

async function saveBrief(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const submitButton = form.querySelector('button[type="submit"]');
  const allowedTypes = $$('input[name="allowedTypes"]:checked', form).map((input) => input.value);
  const body = {
    topic: form.elements.topic.value,
    outcome: form.elements.outcome.value,
    audience: form.elements.audience.value,
    prerequisites: form.elements.prerequisites.value,
    cardCount: form.elements.cardCount.value ? Number(form.elements.cardCount.value) : null,
    difficulty: form.elements.difficulty.value,
    sourcePolicy: form.elements.sourcePolicy.value,
    exportFormat: form.elements.exportFormat.value,
    deckName: form.elements.deckName.value,
    includedScope: form.elements.includedScope.value,
    excludedScope: form.elements.excludedScope.value,
    sensitiveContent: form.elements.sensitiveContent.value,
    allowedTypes,
    confirmed: true,
  };
  setBusy(submitButton, true);
  try {
    state.project = await api(`/api/projects/${state.project.id}/brief`, { method: "POST", body: JSON.stringify(body) });
    showMessage("#brief-message", "Brief saved. Build or revise the plan next.", "success");
    renderAll();
  } catch (error) { showMessage("#brief-message", error.message, "error"); }
  finally { setBusy(submitButton, false); }
}

async function withProjectAction(action, successMessage = "Updated", trigger = null) {
  setBusy(trigger, true);
  try {
    state.project = await action();
    showMessage("#brief-message", successMessage, "success");
    renderAll();
    await loadProjects();
  } catch (error) { showMessage("#brief-message", error.message, "error"); }
  finally { setBusy(trigger, false); }
}

document.addEventListener("click", async (event) => {
  const projectButton = event.target.closest("[data-project-id]");
  if (projectButton) return loadProject(projectButton.dataset.projectId);
  const practiceButton = event.target.closest("[data-practice-slug]");
  if (practiceButton) {
    try { setBusy(practiceButton, true); state.project = await api(`/api/practice/${encodeURIComponent(practiceButton.dataset.practiceSlug)}`, { method: "POST", body: "{}" }); resetCardView(); renderAll(); await loadProjects(); }
    catch (error) { showMessage("#brief-message", error.message, "error"); }
    finally { setBusy(practiceButton, false); }
    return;
  }
  const moreButton = event.target.closest("[data-card-more]");
  if (moreButton) {
    state.cardLimit += 20;
    renderCards();
    return;
  }
  const sourceAction = event.target.closest("[data-source-action]");
  if (sourceAction) {
    if (sourceAction.dataset.sourceAction === "fetch") {
      setBusy(sourceAction, true);
      try { state.project = await api(`/api/projects/${state.project.id}/sources/${sourceAction.dataset.sourceId}/fetch`, { method: "POST", body: "{}" }); renderAll(); showMessage("#source-message", "Source snapshot refreshed.", "success"); }
      catch (error) { showMessage("#source-message", error.message, "error"); }
      finally { setBusy(sourceAction, false); }
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
      await withProjectAction(() => api(`/api/projects/${state.project.id}/cards/${cardId}`, { method: "PATCH", body: JSON.stringify({ front: get("front").value, back: get("back").value, extra: get("extra").value, tags: get("tags").value.split(",").map((tag) => tag.trim()).filter(Boolean), type: get("type").value, difficulty: get("difficulty").value, ...(sourceId ? { sourceIds: [sourceId] } : {}) }) }), "Card saved and sent back through validation.", cardAction);
    }
    if (action === "toggle-lock") {
      const card = state.project.cards.find((item) => item.id === cardId);
      await withProjectAction(() => api(`/api/projects/${state.project.id}/cards/${cardId}`, { method: "PATCH", body: JSON.stringify({ locked: !card.locked }) }), card.locked ? "Card unlocked." : "Card locked.", cardAction);
    }
    if (action === "approve") {
      await withProjectAction(() => api(`/api/projects/${state.project.id}/cards/bulk`, { method: "POST", body: JSON.stringify({ cardIds: [cardId], action: "approve" }) }), "Card approved. Validation will determine export readiness.", cardAction);
    }
    if (action === "reject") {
      if (state.project.cards.find((card) => card.id === cardId)?.status !== "rejected" && !window.confirm("Reject this card? You can approve it again from the card review.")) return;
      await withProjectAction(() => api(`/api/projects/${state.project.id}/cards/bulk`, { method: "POST", body: JSON.stringify({ cardIds: [cardId], action: "reject" }) }), "Card rejected and excluded from export.", cardAction);
    }
    if (action === "regenerate") {
      openRegenerateDialog(cardId, cardAction);
      return;
    }
    if (action === "verify") {
      const sourceId = details.querySelector('[data-field="sourceId"]')?.value;
      if (!sourceId) { showMessage("#brief-message", "Choose a source before verifying this card.", "error"); return; }
      await withProjectAction(() => api(`/api/projects/${state.project.id}/cards/${cardId}/verify`, { method: "POST", body: JSON.stringify({ sourceIds: [sourceId] }) }), "Evidence recorded and card approved.", cardAction);
    }
  }
});

$("#new-project").addEventListener("click", openProjectDialog);
$("#empty-new-project").addEventListener("click", openProjectDialog);
$("#cancel-project-dialog").addEventListener("click", closeProjectDialog);
$("#close-project-dialog").addEventListener("click", closeProjectDialog);
$("#cancel-regenerate-dialog").addEventListener("click", closeRegenerateDialog);
$("#close-regenerate-dialog").addEventListener("click", closeRegenerateDialog);
$("#new-project-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  createProject(form.elements.title.value.trim(), form.querySelector('button[type="submit"]'));
});
$("#regenerate-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const pending = state.pendingRegeneration;
  if (!pending) return;
  const instruction = form.elements.instruction.value.trim();
  if (!instruction) return;
  const submitButton = form.querySelector('button[type="submit"]');
  setBusy(submitButton, true);
  try {
    closeRegenerateDialog();
    await withProjectAction(() => api(`/api/projects/${state.project.id}/cards/${pending.cardId}/regenerate`, { method: "POST", body: JSON.stringify({ instruction }) }), "Card regenerated and returned to review.", pending.trigger);
  } finally {
    setBusy(submitButton, false);
  }
});
$("#refresh-projects").addEventListener("click", async (event) => { setBusy(event.currentTarget, true); try { await loadProjects(); await loadPractice(); renderAll(); showToast("Workspace refreshed.", "success"); } catch (error) { showToast(error.message, "error"); } finally { setBusy(event.currentTarget, false); } });
$("#brief-form").addEventListener("submit", saveBrief);
$("#source-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const submitButton = form.querySelector('button[type="submit"]');
  setBusy(submitButton, true);
  try {
    state.project = await api(`/api/projects/${state.project.id}/sources`, { method: "POST", body: JSON.stringify({ title: form.elements.title.value, url: form.elements.url.value, content: form.elements.content.value, quality: form.elements.quality.value }) });
    form.reset();
    showMessage("#source-message", "Source added. Select it on a card to verify evidence.", "success");
    renderAll();
  } catch (error) { showMessage("#source-message", error.message, "error"); }
  finally { setBusy(submitButton, false); }
});
$("#build-plan").addEventListener("click", (event) => withProjectAction(() => api(`/api/projects/${state.project.id}/plan`, { method: "POST", body: "{}" }), "Plan built. Review the scope contract before generating.", event.currentTarget));
$("#generate-project").addEventListener("click", (event) => withProjectAction(() => api(`/api/projects/${state.project.id}/generate`, { method: "POST", body: JSON.stringify({ idempotencyKey: `ui-${Date.now()}` }) }), "Generation complete. Review findings and approve cards before export.", event.currentTarget));
$("#validate-project").addEventListener("click", (event) => withProjectAction(() => api(`/api/projects/${state.project.id}/validate`, { method: "POST", body: "{}" }), "Validation complete.", event.currentTarget));
$("#card-filter").addEventListener("change", (event) => { state.filter = event.target.value; state.cardLimit = 20; renderCards(); });
$("#card-search").addEventListener("input", (event) => { state.search = event.target.value; state.cardLimit = 20; renderCards(); });
$("#approve-visible").addEventListener("click", (event) => {
  const visible = (state.project.cards || []).filter((card) => (state.filter === "all" || card.status === state.filter) && !card.locked && card.status !== "rejected").filter((card) => {
    const haystack = [card.front, card.back, card.extra, ...(card.tags || [])].join(" ").toLowerCase();
    return !state.search.trim() || haystack.includes(state.search.trim().toLowerCase());
  }).map((card) => card.id);
  if (!visible.length) { showToast("No eligible cards in this view.", "error"); return; }
  withProjectAction(() => api(`/api/projects/${state.project.id}/cards/bulk`, { method: "POST", body: JSON.stringify({ cardIds: visible, action: "approve" }) }), `${visible.length} visible cards approved.`, event.currentTarget);
});
$("#export-button").addEventListener("click", async () => {
  const message = "#export-message";
  const button = $("#export-button");
  setBusy(button, true);
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
  finally { setBusy(button, false); }
});
$("#export-format").addEventListener("change", updateExportFormatUi);
$("#export-type").addEventListener("change", updateExportFormatUi);
$("#include-unverified").addEventListener("change", updateExportFormatUi);
$("#copy-apkg-link").addEventListener("click", async (event) => {
  const link = buildApkgLink();
  if (!link) return;
  setBusy(event.currentTarget, true);
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(link);
      showMessage("#export-message", "Anki download link copied.", "success");
    } else {
      showMessage("#export-message", `Copy this Anki URL: ${link}`, "success");
    }
  } catch (error) {
    showMessage("#export-message", `Copy this Anki URL: ${link}`, "error");
  } finally {
    setBusy(event.currentTarget, false);
  }
});
$("#preview-export").addEventListener("click", async () => {
  const button = $("#preview-export");
  setBusy(button, true);
  try {
    const params = new URLSearchParams({ format: $("#export-format").value, cardType: $("#export-type").value });
    if ($("#include-unverified").checked) params.set("includeUnverified", "true");
    const preview = await api(`/api/projects/${state.project.id}/export/preview?${params}`);
    $("#export-preview").hidden = false;
    $("#export-preview").textContent = JSON.stringify(preview, null, 2);
    showMessage("#export-message", preview.blocked ? "Preview generated; resolve validation blockers before downloading." : "Preview is ready.", preview.blocked ? "error" : "success");
  } catch (error) { showMessage("#export-message", error.message, "error"); }
  finally { setBusy(button, false); }
});

async function init() {
  try {
    await Promise.all([loadProjects(), loadPractice()]);
    renderAll();
  } catch (error) {
    showToast(`Could not load the workspace: ${error.message}`, "error");
  }
}

init();
