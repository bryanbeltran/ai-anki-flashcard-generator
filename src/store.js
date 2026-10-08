import { dirname } from "node:path";
import { mkdirSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { clone, createProject, id, isoNow } from "./domain.js";

function emptyState() {
  return { projects: [], version: 1 };
}

export class JsonStore {
  constructor(file) {
    this.file = file;
    mkdirSync(dirname(file), { recursive: true });
    if (!existsSync(file)) {
      this.save(emptyState());
    }
  }

  load() {
    try {
      const parsed = JSON.parse(readFileSync(this.file, "utf8"));
      return parsed && Array.isArray(parsed.projects) ? parsed : emptyState();
    } catch {
      return emptyState();
    }
  }

  save(state) {
    const temporary = `${this.file}.tmp`;
    writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`, "utf8");
    renameSync(temporary, this.file);
  }

  listProjects() {
    return this.load().projects
      .map((project) => ({
        id: project.id,
        title: project.title,
        status: project.status,
        updatedAt: project.updatedAt,
        cardCount: project.cards?.length || 0,
        metrics: project.metrics || null,
      }))
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  }

  getProject(projectId) {
    return clone(this.load().projects.find((project) => project.id === projectId) || null);
  }

  createProject({ title, brief } = {}) {
    const state = this.load();
    const project = createProject({ title, brief });
    state.projects.push(project);
    this.save(state);
    return clone(project);
  }

  insertProject(project) {
    const state = this.load();
    if (state.projects.some((item) => item.id === project.id)) return clone(state.projects.find((item) => item.id === project.id));
    state.projects.push(clone(project));
    this.save(state);
    return clone(project);
  }

  saveProject(project) {
    const state = this.load();
    const index = state.projects.findIndex((item) => item.id === project.id);
    if (index === -1) throw new Error(`Project not found: ${project.id}`);
    state.projects[index] = clone(project);
    this.save(state);
    return clone(project);
  }

  deleteProject(projectId) {
    const state = this.load();
    const before = state.projects.length;
    state.projects = state.projects.filter((project) => project.id !== projectId);
    if (state.projects.length !== before) this.save(state);
    return before !== state.projects.length;
  }
}

export class MemoryStore {
  constructor(projects = []) {
    this.projects = clone(projects);
  }

  load() {
    return { projects: clone(this.projects), version: 1 };
  }

  save(state) {
    this.projects = clone(state.projects || []);
  }

  listProjects() {
    return this.projects.map((project) => ({
      id: project.id,
      title: project.title,
      status: project.status,
      updatedAt: project.updatedAt,
      cardCount: project.cards?.length || 0,
      metrics: project.metrics || null,
    }));
  }

  getProject(projectId) {
    return clone(this.projects.find((project) => project.id === projectId) || null);
  }

  createProject({ title, brief } = {}) {
    const project = createProject({ title, brief });
    this.projects.push(project);
    return clone(project);
  }

  insertProject(project) {
    const existing = this.projects.find((item) => item.id === project.id);
    if (existing) return clone(existing);
    this.projects.push(clone(project));
    return clone(project);
  }

  saveProject(project) {
    const index = this.projects.findIndex((item) => item.id === project.id);
    if (index === -1) throw new Error(`Project not found: ${project.id}`);
    this.projects[index] = clone(project);
    return clone(project);
  }

  deleteProject(projectId) {
    const before = this.projects.length;
    this.projects = this.projects.filter((project) => project.id !== projectId);
    return before !== this.projects.length;
  }
}

export function createDefaultStore(env = process.env) {
  const dataDir = env.ANKI_DATA_DIR || "data";
  return new JsonStore(`${dataDir}/store.json`);
}
