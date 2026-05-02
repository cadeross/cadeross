"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type FocusStatus = "Backlog" | "Todo" | "Doing" | "Done";
type FocusPriority = "Low" | "Medium" | "High" | "Urgent";
type ProjectStatus = "Planning" | "Active" | "Paused" | "Done";
type MediaType = "Screenshot" | "Link" | "Document" | "Reference";

type FocusResource = {
  id: string;
  title: string;
  url: string;
  note: string;
};

type FocusProject = {
  id: string;
  name: string;
  description: string;
  brief: string;
  timeline: string;
  status: ProjectStatus;
  resources: FocusResource[];
  createdAt: string;
  updatedAt: string;
};

type FocusIssue = {
  id: string;
  projectId: string;
  title: string;
  status: FocusStatus;
  priority: FocusPriority;
  dueDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

type ContextMedia = {
  id: string;
  projectId: string;
  title: string;
  type: MediaType;
  url: string;
  note: string;
  createdAt: string;
  updatedAt: string;
};

type FocusData = {
  version: 2;
  projects: FocusProject[];
  issues: FocusIssue[];
  contextMedia: ContextMedia[];
  updatedAt: string;
};

type LegacyProject = Omit<FocusProject, "brief" | "timeline" | "resources">;
type LegacyData = {
  version: 1;
  projects: LegacyProject[];
  issues: FocusIssue[];
  updatedAt: string;
};

const STORAGE_KEY = "focus-tracker:v2";
const LEGACY_STORAGE_KEY = "focus-tracker:v1";
const STATUS_OPTIONS: FocusStatus[] = ["Backlog", "Todo", "Doing", "Done"];
const PRIORITY_OPTIONS: FocusPriority[] = ["Low", "Medium", "High", "Urgent"];
const PROJECT_STATUS_OPTIONS: ProjectStatus[] = ["Planning", "Active", "Paused", "Done"];
const MEDIA_TYPE_OPTIONS: MediaType[] = ["Screenshot", "Link", "Document", "Reference"];

const priorityRank: Record<FocusPriority, number> = {
  Urgent: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

const nowIso = () => new Date().toISOString();

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createResource(title: string, url: string, note: string): FocusResource {
  return {
    id: createId("resource"),
    title,
    url,
    note,
  };
}

function enrichProject(project: LegacyProject): FocusProject {
  return {
    ...project,
    brief: project.description,
    timeline: project.status === "Active" ? "Now" : project.status,
    resources: [],
  };
}

function createSeedData(): FocusData {
  const timestamp = nowIso();
  const openwritId = "project-openwrit";
  const focusId = "project-focus";
  const vlyssId = "project-vlyss";

  return {
    version: 2,
    updatedAt: timestamp,
    projects: [
      {
        id: openwritId,
        name: "OpenWrit",
        description: "Ship the calm reading experience and prepare the open source foundation.",
        brief:
          "A focused reading app where the interface gets out of the way. The current push is about keeping the reading surface quiet while making the project durable enough to share.",
        timeline: "Active build",
        status: "Active",
        resources: [
          createResource("Repository", "https://openwrit.com", "Public project home and release surface."),
        ],
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: focusId,
        name: "Focus",
        description: "Personal project and issue tracking for current work.",
        brief:
          "A local-first project dashboard for keeping active work visible without turning the page into a full SaaS tool.",
        timeline: "Interface refactor",
        status: "Active",
        resources: [
          createResource("Design reference", "https://benji.org", "Reference for restraint, spacing, and quiet lists."),
        ],
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: vlyssId,
        name: "Vlyss archive",
        description: "Collect case study notes and polish older project writeups.",
        brief:
          "A slower archive pass for older client work, focused on turning loose notes into clear project narratives.",
        timeline: "Planning",
        status: "Planning",
        resources: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    issues: [
      {
        id: "issue-reading-progress",
        projectId: openwritId,
        title: "Define reading progress behavior",
        status: "Doing",
        priority: "High",
        dueDate: "",
        notes: "Decide what should be visible during focused reading and what can stay hidden.",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: "issue-focus-backup",
        projectId: focusId,
        title: "Add local backup controls",
        status: "Todo",
        priority: "Medium",
        dueDate: "",
        notes: "Export and import JSON so browser data can be moved safely.",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: "issue-case-study-copy",
        projectId: vlyssId,
        title: "Tighten Baylor case study copy",
        status: "Backlog",
        priority: "Low",
        dueDate: "",
        notes: "",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    contextMedia: [
      {
        id: "media-openwrit-reading",
        projectId: openwritId,
        title: "Reading surface reference",
        type: "Reference",
        url: "https://openwrit.com",
        note: "Keep controls secondary to the text.",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: "media-focus-layout",
        projectId: focusId,
        title: "Compact list rhythm",
        type: "Link",
        url: "https://benji.org",
        note: "Use as a restraint reference, not a layout clone.",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
  };
}

function isFocusStatus(value: unknown): value is FocusStatus {
  return typeof value === "string" && STATUS_OPTIONS.includes(value as FocusStatus);
}

function isFocusPriority(value: unknown): value is FocusPriority {
  return typeof value === "string" && PRIORITY_OPTIONS.includes(value as FocusPriority);
}

function isProjectStatus(value: unknown): value is ProjectStatus {
  return typeof value === "string" && PROJECT_STATUS_OPTIONS.includes(value as ProjectStatus);
}

function isMediaType(value: unknown): value is MediaType {
  return typeof value === "string" && MEDIA_TYPE_OPTIONS.includes(value as MediaType);
}

function isResource(value: unknown): value is FocusResource {
  if (!value || typeof value !== "object") return false;
  const resource = value as Record<string, unknown>;
  return (
    typeof resource.id === "string" &&
    typeof resource.title === "string" &&
    typeof resource.url === "string" &&
    typeof resource.note === "string"
  );
}

function isLegacyProject(value: unknown): value is LegacyProject {
  if (!value || typeof value !== "object") return false;
  const project = value as Record<string, unknown>;
  return (
    typeof project.id === "string" &&
    typeof project.name === "string" &&
    typeof project.description === "string" &&
    isProjectStatus(project.status) &&
    typeof project.createdAt === "string" &&
    typeof project.updatedAt === "string"
  );
}

function isFocusProject(value: unknown): value is FocusProject {
  if (!value || typeof value !== "object" || !isLegacyProject(value)) return false;
  const project = value as Record<string, unknown>;
  return (
    typeof project.brief === "string" &&
    typeof project.timeline === "string" &&
    Array.isArray(project.resources) &&
    project.resources.every(isResource)
  );
}

function isFocusIssue(value: unknown): value is FocusIssue {
  if (!value || typeof value !== "object") return false;
  const issue = value as Record<string, unknown>;
  return (
    typeof issue.id === "string" &&
    typeof issue.projectId === "string" &&
    typeof issue.title === "string" &&
    isFocusStatus(issue.status) &&
    isFocusPriority(issue.priority) &&
    typeof issue.dueDate === "string" &&
    typeof issue.notes === "string" &&
    typeof issue.createdAt === "string" &&
    typeof issue.updatedAt === "string"
  );
}

function isContextMedia(value: unknown): value is ContextMedia {
  if (!value || typeof value !== "object") return false;
  const media = value as Record<string, unknown>;
  return (
    typeof media.id === "string" &&
    typeof media.projectId === "string" &&
    typeof media.title === "string" &&
    isMediaType(media.type) &&
    typeof media.url === "string" &&
    typeof media.note === "string" &&
    typeof media.createdAt === "string" &&
    typeof media.updatedAt === "string"
  );
}

function validateLegacyData(value: unknown): LegacyData | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  if (data.version !== 1 || !Array.isArray(data.projects) || !Array.isArray(data.issues)) return null;

  const projects = data.projects.filter(isLegacyProject);
  const projectIds = new Set(projects.map((project) => project.id));
  const issues = data.issues.filter((issue): issue is FocusIssue => {
    return isFocusIssue(issue) && projectIds.has(issue.projectId);
  });

  if (projects.length !== data.projects.length || issues.length !== data.issues.length) return null;
  return {
    version: 1,
    projects,
    issues,
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : nowIso(),
  };
}

function migrateLegacyData(legacy: LegacyData): FocusData {
  return {
    version: 2,
    projects: legacy.projects.map(enrichProject),
    issues: legacy.issues,
    contextMedia: [],
    updatedAt: nowIso(),
  };
}

function validateFocusData(value: unknown): FocusData | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;

  if (data.version === 1) {
    const legacy = validateLegacyData(data);
    return legacy ? migrateLegacyData(legacy) : null;
  }

  if (
    data.version !== 2 ||
    !Array.isArray(data.projects) ||
    !Array.isArray(data.issues) ||
    !Array.isArray(data.contextMedia)
  ) {
    return null;
  }

  const projects = data.projects.filter(isFocusProject);
  const projectIds = new Set(projects.map((project) => project.id));
  const issues = data.issues.filter((issue): issue is FocusIssue => {
    return isFocusIssue(issue) && projectIds.has(issue.projectId);
  });
  const contextMedia = data.contextMedia.filter((media): media is ContextMedia => {
    return isContextMedia(media) && projectIds.has(media.projectId);
  });

  if (
    projects.length !== data.projects.length ||
    issues.length !== data.issues.length ||
    contextMedia.length !== data.contextMedia.length
  ) {
    return null;
  }

  return {
    version: 2,
    projects,
    issues,
    contextMedia,
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : nowIso(),
  };
}

function getDefaultProjectId(projects: FocusProject[]) {
  return projects.find((project) => project.status === "Active")?.id ?? projects[0]?.id ?? "";
}

function formatDate(value: string) {
  if (!value) return "No date";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "No date";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

function compactDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function emptyProjectDraft() {
  return {
    name: "",
    description: "",
    brief: "",
    timeline: "",
    status: "Active" as ProjectStatus,
  };
}

function emptyIssueDraft(projectId = "") {
  return {
    title: "",
    projectId,
    status: "Todo" as FocusStatus,
    priority: "Medium" as FocusPriority,
    dueDate: "",
    notes: "",
  };
}

function emptyMediaDraft(projectId = "") {
  return {
    projectId,
    title: "",
    type: "Reference" as MediaType,
    url: "",
    note: "",
  };
}

function emptyResourceDraft() {
  return {
    title: "",
    url: "",
    note: "",
  };
}

export default function FocusPage() {
  const [data, setData] = useState<FocusData>(() => createSeedData());
  const [mounted, setMounted] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectDraft, setProjectDraft] = useState(emptyProjectDraft);
  const [issueDraft, setIssueDraft] = useState(() => emptyIssueDraft());
  const [mediaDraft, setMediaDraft] = useState(() => emptyMediaDraft());
  const [resourceDraft, setResourceDraft] = useState(emptyResourceDraft);
  const [importDraft, setImportDraft] = useState("");
  const [importMessage, setImportMessage] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const legacyStored = localStorage.getItem(LEGACY_STORAGE_KEY);
      const parsed = stored ? validateFocusData(JSON.parse(stored)) : null;
      const migrated = !parsed && legacyStored ? validateFocusData(JSON.parse(legacyStored)) : null;
      const nextData = parsed ?? migrated ?? createSeedData();
      const projectId = getDefaultProjectId(nextData.projects);

      setData(nextData);
      setSelectedProjectId(projectId);
      setIssueDraft(emptyIssueDraft(projectId));
      setMediaDraft(emptyMediaDraft(projectId));
    } catch {
      const seeded = createSeedData();
      const projectId = getDefaultProjectId(seeded.projects);
      setData(seeded);
      setSelectedProjectId(projectId);
      setIssueDraft(emptyIssueDraft(projectId));
      setMediaDraft(emptyMediaDraft(projectId));
    } finally {
      setMounted(true);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, mounted]);

  useEffect(() => {
    const fallbackProjectId = getDefaultProjectId(data.projects);
    if (!selectedProjectId || !data.projects.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(fallbackProjectId);
    }
  }, [data.projects, selectedProjectId]);

  const selectedProject =
    data.projects.find((project) => project.id === selectedProjectId) ?? data.projects[0] ?? null;
  const currentProjectId = selectedProject?.id ?? "";

  useEffect(() => {
    if (!currentProjectId) return;
    setIssueDraft((current) => ({ ...current, projectId: currentProjectId }));
    setMediaDraft((current) => ({ ...current, projectId: currentProjectId }));
  }, [currentProjectId]);

  const selectedIssues = useMemo(() => {
    return data.issues.filter((issue) => issue.projectId === currentProjectId);
  }, [currentProjectId, data.issues]);

  const selectedMedia = useMemo(() => {
    return data.contextMedia.filter((media) => media.projectId === currentProjectId);
  }, [currentProjectId, data.contextMedia]);

  const issueCounts = useMemo(() => {
    return STATUS_OPTIONS.reduce<Record<FocusStatus, number>>(
      (acc, status) => {
        acc[status] = selectedIssues.filter((issue) => issue.status === status).length;
        return acc;
      },
      { Backlog: 0, Todo: 0, Doing: 0, Done: 0 }
    );
  }, [selectedIssues]);

  const doneCount = issueCounts.Done;
  const openCount = selectedIssues.length - doneCount;
  const progress = selectedIssues.length > 0 ? Math.round((doneCount / selectedIssues.length) * 100) : 0;
  const nextActions = selectedIssues
    .filter((issue) => issue.status === "Doing" || issue.status === "Todo")
    .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority])
    .slice(0, 3);

  function updateData(updater: (current: FocusData) => FocusData) {
    setData((current) => ({
      ...updater(current),
      updatedAt: nowIso(),
    }));
  }

  function addProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = projectDraft.name.trim();
    if (!name) return;

    const timestamp = nowIso();
    const project: FocusProject = {
      id: createId("project"),
      name,
      description: projectDraft.description.trim(),
      brief: projectDraft.brief.trim() || projectDraft.description.trim(),
      timeline: projectDraft.timeline.trim(),
      status: projectDraft.status,
      resources: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    updateData((current) => ({
      ...current,
      projects: [project, ...current.projects],
    }));
    setSelectedProjectId(project.id);
    setProjectDraft(emptyProjectDraft());
  }

  function updateProject(projectId: string, patch: Partial<FocusProject>) {
    updateData((current) => ({
      ...current,
      projects: current.projects.map((project) =>
        project.id === projectId ? { ...project, ...patch, updatedAt: nowIso() } : project
      ),
    }));
  }

  function deleteProject(projectId: string) {
    updateData((current) => ({
      ...current,
      projects: current.projects.filter((project) => project.id !== projectId),
      issues: current.issues.filter((issue) => issue.projectId !== projectId),
      contextMedia: current.contextMedia.filter((media) => media.projectId !== projectId),
    }));
    if (selectedProjectId === projectId) setSelectedProjectId("");
  }

  function addResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProject) return;
    const title = resourceDraft.title.trim();
    if (!title) return;

    const resource = createResource(title, resourceDraft.url.trim(), resourceDraft.note.trim());
    updateProject(selectedProject.id, {
      resources: [...selectedProject.resources, resource],
    });
    setResourceDraft(emptyResourceDraft());
  }

  function deleteResource(resourceId: string) {
    if (!selectedProject) return;
    updateProject(selectedProject.id, {
      resources: selectedProject.resources.filter((resource) => resource.id !== resourceId),
    });
  }

  function addIssue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = issueDraft.title.trim();
    if (!title || !currentProjectId) return;

    const timestamp = nowIso();
    const issue: FocusIssue = {
      id: createId("issue"),
      projectId: currentProjectId,
      title,
      status: issueDraft.status,
      priority: issueDraft.priority,
      dueDate: issueDraft.dueDate,
      notes: issueDraft.notes.trim(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    updateData((current) => ({
      ...current,
      issues: [issue, ...current.issues],
    }));
    setIssueDraft(emptyIssueDraft(currentProjectId));
  }

  function updateIssue(issueId: string, patch: Partial<FocusIssue>) {
    updateData((current) => ({
      ...current,
      issues: current.issues.map((issue) =>
        issue.id === issueId ? { ...issue, ...patch, updatedAt: nowIso() } : issue
      ),
    }));
  }

  function deleteIssue(issueId: string) {
    updateData((current) => ({
      ...current,
      issues: current.issues.filter((issue) => issue.id !== issueId),
    }));
  }

  function addMedia(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = mediaDraft.title.trim();
    if (!title || !currentProjectId) return;

    const timestamp = nowIso();
    const media: ContextMedia = {
      id: createId("media"),
      projectId: currentProjectId,
      title,
      type: mediaDraft.type,
      url: mediaDraft.url.trim(),
      note: mediaDraft.note.trim(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    updateData((current) => ({
      ...current,
      contextMedia: [media, ...current.contextMedia],
    }));
    setMediaDraft(emptyMediaDraft(currentProjectId));
  }

  function deleteMedia(mediaId: string) {
    updateData((current) => ({
      ...current,
      contextMedia: current.contextMedia.filter((media) => media.id !== mediaId),
    }));
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `focus-tracker-v2-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function importData() {
    setImportMessage("");
    try {
      const parsed = validateFocusData(JSON.parse(importDraft));
      if (!parsed) {
        setImportMessage("Import failed. The JSON does not match Focus data.");
        return;
      }

      const projectId = getDefaultProjectId(parsed.projects);
      setData({ ...parsed, updatedAt: nowIso() });
      setSelectedProjectId(projectId);
      setIssueDraft(emptyIssueDraft(projectId));
      setMediaDraft(emptyMediaDraft(projectId));
      setImportDraft("");
      setImportMessage("Import complete.");
    } catch {
      setImportMessage("Import failed. Paste valid JSON exported from Focus.");
    }
  }

  function resetSeedData() {
    const seeded = createSeedData();
    const projectId = getDefaultProjectId(seeded.projects);
    setData(seeded);
    setSelectedProjectId(projectId);
    setIssueDraft(emptyIssueDraft(projectId));
    setMediaDraft(emptyMediaDraft(projectId));
    setResourceDraft(emptyResourceDraft());
  }

  return (
    <div className="focus-page">
      <header className="focus-header">
        <Link href="/" className="back-link">
          ← Home
        </Link>
        <div>
          <p className="page-name">Focus</p>
          <p className="page-greeting">Project dashboard</p>
        </div>
      </header>

      <nav className="focus-project-toggle" aria-label="Projects">
        {data.projects.map((project) => (
          <button
            key={project.id}
            type="button"
            data-active={project.id === currentProjectId}
            onClick={() => setSelectedProjectId(project.id)}
          >
            <span>{project.name}</span>
            <small>{data.issues.filter((issue) => issue.projectId === project.id && issue.status !== "Done").length}</small>
          </button>
        ))}
      </nav>

      {selectedProject ? (
        <>
          <section className="focus-hero" aria-label="Selected project">
            <span className="focus-kicker">{selectedProject.status}</span>
            <h1>{selectedProject.name}</h1>
            <p>{selectedProject.brief || selectedProject.description || "No project brief yet."}</p>
          </section>

          <section className="focus-module-grid" aria-label="Project modules">
            <div className="focus-module focus-progress-module">
              <div className="focus-module-header">
                <h2>Status</h2>
                <span>{progress}%</span>
              </div>
              <div className="focus-progress-track" aria-label={`${progress}% complete`}>
                <span style={{ width: `${progress}%` }} />
              </div>
              <p>
                {openCount} open · {doneCount} done
              </p>
            </div>

            <div className="focus-module">
              <div className="focus-module-header">
                <h2>Timeline</h2>
                <span>{selectedProject.timeline || "Unset"}</span>
              </div>
              <p>{selectedProject.description || "Use project settings to add a short operating note."}</p>
            </div>
          </section>

          <section className="focus-module" aria-label="Next actions">
            <div className="focus-module-header">
              <h2>Next actions</h2>
              <span>{nextActions.length}</span>
            </div>
            {nextActions.length === 0 ? (
              <p className="focus-empty">No active next actions.</p>
            ) : (
              <div className="focus-action-list">
                {nextActions.map((issue) => (
                  <button
                    key={issue.id}
                    type="button"
                    onClick={() => updateIssue(issue.id, { status: issue.status === "Doing" ? "Done" : "Doing" })}
                  >
                    <span>{issue.title}</span>
                    <small>
                      {issue.status} · {issue.priority} · {formatDate(issue.dueDate)}
                    </small>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="focus-module" aria-label="Resources">
            <div className="focus-module-header">
              <h2>Resources</h2>
              <span>{selectedProject.resources.length}</span>
            </div>
            {selectedProject.resources.length === 0 ? (
              <p className="focus-empty">No resources yet.</p>
            ) : (
              <div className="focus-media-list">
                {selectedProject.resources.map((resource) => (
                  <div className="focus-media-row" key={resource.id}>
                    <span>
                      <strong>{resource.title}</strong>
                      <small>{resource.note || resource.url || "No note"}</small>
                    </span>
                    {resource.url && (
                      <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        Open
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="focus-module" aria-label="Context media">
            <div className="focus-module-header">
              <h2>Context media</h2>
              <span>{selectedMedia.length}</span>
            </div>
            {selectedMedia.length === 0 ? (
              <p className="focus-empty">Add screenshots, references, docs, or links for this project.</p>
            ) : (
              <div className="focus-media-list">
                {selectedMedia.map((media) => (
                  <div className="focus-media-row" key={media.id}>
                    <span>
                      <strong>{media.title}</strong>
                      <small>
                        {media.type} · {media.note || media.url || "No note"}
                      </small>
                    </span>
                    <div>
                      {media.url && (
                        <a href={media.url} target="_blank" rel="noopener noreferrer">
                          Open
                        </a>
                      )}
                      <button type="button" onClick={() => deleteMedia(media.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <details className="focus-module focus-disclosure">
            <summary>
              <span>
                <strong>Project settings</strong>
                <small>Brief, timeline, resources, and project metadata</small>
              </span>
            </summary>
            <div className="focus-disclosure-body">
              <div className="focus-form">
                <input
                  aria-label="Project name"
                  value={selectedProject.name}
                  onChange={(event) => updateProject(selectedProject.id, { name: event.target.value })}
                />
                <select
                  aria-label="Project status"
                  value={selectedProject.status}
                  onChange={(event) =>
                    updateProject(selectedProject.id, { status: event.target.value as ProjectStatus })
                  }
                >
                  {PROJECT_STATUS_OPTIONS.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
                <input
                  aria-label="Project timeline"
                  placeholder="Timeline"
                  value={selectedProject.timeline}
                  onChange={(event) => updateProject(selectedProject.id, { timeline: event.target.value })}
                />
                <textarea
                  aria-label="Project description"
                  rows={2}
                  value={selectedProject.description}
                  onChange={(event) => updateProject(selectedProject.id, { description: event.target.value })}
                />
                <textarea
                  aria-label="Project brief"
                  rows={4}
                  value={selectedProject.brief}
                  onChange={(event) => updateProject(selectedProject.id, { brief: event.target.value })}
                />
                <button type="button" onClick={() => deleteProject(selectedProject.id)}>
                  Delete project
                </button>
              </div>

              <form className="focus-form" onSubmit={addResource}>
                <input
                  aria-label="Resource title"
                  placeholder="Resource title"
                  value={resourceDraft.title}
                  onChange={(event) => setResourceDraft((current) => ({ ...current, title: event.target.value }))}
                />
                <input
                  aria-label="Resource URL"
                  placeholder="https://"
                  value={resourceDraft.url}
                  onChange={(event) => setResourceDraft((current) => ({ ...current, url: event.target.value }))}
                />
                <textarea
                  aria-label="Resource note"
                  placeholder="Note"
                  rows={2}
                  value={resourceDraft.note}
                  onChange={(event) => setResourceDraft((current) => ({ ...current, note: event.target.value }))}
                />
                <div className="focus-form-row">
                  <span>{selectedProject.resources.length} resources saved</span>
                  <button type="submit">Add resource</button>
                </div>
              </form>

              {selectedProject.resources.map((resource) => (
                <div className="focus-edit-row" key={resource.id}>
                  <span>
                    <strong>{resource.title}</strong>
                    <small>{resource.url || "No URL"}</small>
                  </span>
                  <button type="button" onClick={() => deleteResource(resource.id)}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </details>

          <details className="focus-module focus-disclosure">
            <summary>
              <span>
                <strong>Add media</strong>
                <small>Attach contextual links, docs, screenshots, or references</small>
              </span>
            </summary>
            <form className="focus-disclosure-body focus-form" onSubmit={addMedia}>
              <input
                aria-label="Media title"
                placeholder="Media title"
                value={mediaDraft.title}
                onChange={(event) => setMediaDraft((current) => ({ ...current, title: event.target.value }))}
              />
              <div className="focus-form-grid">
                <select
                  aria-label="Media type"
                  value={mediaDraft.type}
                  onChange={(event) =>
                    setMediaDraft((current) => ({ ...current, type: event.target.value as MediaType }))
                  }
                >
                  {MEDIA_TYPE_OPTIONS.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
                <input
                  aria-label="Media URL"
                  placeholder="https://"
                  value={mediaDraft.url}
                  onChange={(event) => setMediaDraft((current) => ({ ...current, url: event.target.value }))}
                />
              </div>
              <textarea
                aria-label="Media note"
                placeholder="Why this matters"
                rows={2}
                value={mediaDraft.note}
                onChange={(event) => setMediaDraft((current) => ({ ...current, note: event.target.value }))}
              />
              <div className="focus-form-row">
                <span>{selectedProject.name}</span>
                <button type="submit">Add media</button>
              </div>
            </form>
          </details>

          <section className="focus-module" aria-labelledby="issues-heading">
            <div className="focus-module-header">
              <h2 id="issues-heading">Issues</h2>
              <span>{selectedIssues.length}</span>
            </div>
            <div className="focus-issue-summary" aria-label="Issue summary">
              {STATUS_OPTIONS.map((status) => (
                <span key={status}>
                  {status} <strong>{issueCounts[status]}</strong>
                </span>
              ))}
            </div>

            <details className="focus-disclosure focus-nested-disclosure">
              <summary>
                <span>
                  <strong>Add issue</strong>
                  <small>Create an issue for {selectedProject.name}</small>
                </span>
              </summary>
              <form className="focus-disclosure-body focus-form" onSubmit={addIssue}>
                <input
                  aria-label="Issue title"
                  placeholder="New issue"
                  value={issueDraft.title}
                  onChange={(event) => setIssueDraft((current) => ({ ...current, title: event.target.value }))}
                />
                <div className="focus-form-grid">
                  <select
                    aria-label="Issue status"
                    value={issueDraft.status}
                    onChange={(event) =>
                      setIssueDraft((current) => ({ ...current, status: event.target.value as FocusStatus }))
                    }
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Issue priority"
                    value={issueDraft.priority}
                    onChange={(event) =>
                      setIssueDraft((current) => ({ ...current, priority: event.target.value as FocusPriority }))
                    }
                  >
                    {PRIORITY_OPTIONS.map((priority) => (
                      <option key={priority}>{priority}</option>
                    ))}
                  </select>
                  <input
                    aria-label="Issue due date"
                    type="date"
                    value={issueDraft.dueDate}
                    onChange={(event) => setIssueDraft((current) => ({ ...current, dueDate: event.target.value }))}
                  />
                </div>
                <textarea
                  aria-label="Issue notes"
                  placeholder="Notes"
                  rows={2}
                  value={issueDraft.notes}
                  onChange={(event) => setIssueDraft((current) => ({ ...current, notes: event.target.value }))}
                />
                <div className="focus-form-row">
                  <span>{selectedProject.name}</span>
                  <button type="submit">Add issue</button>
                </div>
              </form>
            </details>

            <div className="focus-issue-groups">
              {STATUS_OPTIONS.map((status) => {
                const issues = selectedIssues.filter((issue) => issue.status === status);
                return (
                  <section className="focus-issue-group" key={status} aria-label={`${status} issues`}>
                    <div className="focus-group-header">
                      <h3>{status}</h3>
                      <span>{issues.length}</span>
                    </div>

                    {issues.length === 0 ? (
                      <p className="focus-empty">No issues here.</p>
                    ) : (
                      issues.map((issue) => (
                        <details className="focus-issue" key={issue.id}>
                          <summary>
                            <span>
                              <strong>{issue.title}</strong>
                              <small>
                                {issue.priority} · {formatDate(issue.dueDate)}
                              </small>
                            </span>
                          </summary>

                          <div className="focus-issue-edit">
                            <input
                              aria-label={`${issue.title} title`}
                              value={issue.title}
                              onChange={(event) => updateIssue(issue.id, { title: event.target.value })}
                            />
                            <div className="focus-form-grid">
                              <select
                                aria-label={`${issue.title} status`}
                                value={issue.status}
                                onChange={(event) =>
                                  updateIssue(issue.id, { status: event.target.value as FocusStatus })
                                }
                              >
                                {STATUS_OPTIONS.map((option) => (
                                  <option key={option}>{option}</option>
                                ))}
                              </select>
                              <select
                                aria-label={`${issue.title} priority`}
                                value={issue.priority}
                                onChange={(event) =>
                                  updateIssue(issue.id, { priority: event.target.value as FocusPriority })
                                }
                              >
                                {PRIORITY_OPTIONS.map((option) => (
                                  <option key={option}>{option}</option>
                                ))}
                              </select>
                              <input
                                aria-label={`${issue.title} due date`}
                                type="date"
                                value={issue.dueDate}
                                onChange={(event) => updateIssue(issue.id, { dueDate: event.target.value })}
                              />
                            </div>
                            <textarea
                              aria-label={`${issue.title} notes`}
                              rows={3}
                              value={issue.notes}
                              placeholder="Notes"
                              onChange={(event) => updateIssue(issue.id, { notes: event.target.value })}
                            />
                            <div className="focus-form-row">
                              <span>Updated {compactDate(issue.updatedAt)}</span>
                              <button type="button" onClick={() => deleteIssue(issue.id)}>
                                Delete
                              </button>
                            </div>
                          </div>
                        </details>
                      ))
                    )}
                  </section>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <section className="focus-hero">
          <span className="focus-kicker">Empty</span>
          <h1>No projects yet</h1>
          <p>Add a project below to create a focused dashboard.</p>
        </section>
      )}

      <details className="focus-module focus-disclosure">
        <summary>
          <span>
            <strong>Add project</strong>
            <small>Create another project toggle</small>
          </span>
        </summary>
        <form className="focus-disclosure-body focus-form" onSubmit={addProject}>
          <input
            aria-label="New project name"
            placeholder="Project name"
            value={projectDraft.name}
            onChange={(event) => setProjectDraft((current) => ({ ...current, name: event.target.value }))}
          />
          <select
            aria-label="New project status"
            value={projectDraft.status}
            onChange={(event) =>
              setProjectDraft((current) => ({ ...current, status: event.target.value as ProjectStatus }))
            }
          >
            {PROJECT_STATUS_OPTIONS.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
          <input
            aria-label="New project timeline"
            placeholder="Timeline"
            value={projectDraft.timeline}
            onChange={(event) => setProjectDraft((current) => ({ ...current, timeline: event.target.value }))}
          />
          <textarea
            aria-label="New project description"
            placeholder="Description"
            rows={2}
            value={projectDraft.description}
            onChange={(event) => setProjectDraft((current) => ({ ...current, description: event.target.value }))}
          />
          <textarea
            aria-label="New project brief"
            placeholder="Brief"
            rows={3}
            value={projectDraft.brief}
            onChange={(event) => setProjectDraft((current) => ({ ...current, brief: event.target.value }))}
          />
          <div className="focus-form-row">
            <span>{data.projects.length} projects saved</span>
            <button type="submit">Add project</button>
          </div>
        </form>
      </details>

      <details className="focus-module focus-disclosure">
        <summary>
          <span>
            <strong>Data</strong>
            <small>Export, import, or reset local browser data</small>
          </span>
        </summary>
        <div className="focus-disclosure-body">
          <div className="focus-data-actions">
            <button type="button" onClick={exportData}>
              Export JSON
            </button>
            <button type="button" onClick={resetSeedData}>
              Reset seed
            </button>
          </div>
          <textarea
            aria-label="Import JSON"
            className="focus-import"
            placeholder="Paste exported Focus JSON"
            rows={5}
            value={importDraft}
            onChange={(event) => setImportDraft(event.target.value)}
          />
          <div className="focus-form-row">
            <span>{importMessage || "Import replaces current local tracker data after validation."}</span>
            <button type="button" onClick={importData} disabled={!importDraft.trim()}>
              Import
            </button>
          </div>
        </div>
      </details>

      <footer className="page-footer">
        <div className="footer-row">
          <p>Focus is stored in this browser.</p>
          <div className="footer-links">
            <a href="mailto:hello@cadeross.com">Email</a>
            <a href="https://github.com/cadeross" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
