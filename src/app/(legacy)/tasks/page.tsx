"use client";

import {
  KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type TaskStatus = "Backlog" | "Todo" | "In Progress" | "Done" | "Canceled";

type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  scheduledDate: string | null;
  evening: boolean;
  createdAt: string;
  updatedAt: string;
};

type Habit = {
  id: string;
  icon: string;
  name: string;
  createdAt: string;
};

type TasksData = {
  version: 1;
  tasks: Task[];
  habits: Habit[];
  completions: Record<string, string[]>;
  updatedAt: string;
};

type EditTarget = { id: string; field: "title" | "description" };

type ParsedInput = {
  title: string;
  description: string;
  status: TaskStatus;
  scheduledDate: string | null;
  evening: boolean;
};

const STORAGE_KEY = "tasks:v1";
const LEGACY_GROVEWAY_KEY = "groveway-issues:v1";

const STATUS_OPTIONS: TaskStatus[] = [
  "Backlog",
  "Todo",
  "In Progress",
  "Done",
  "Canceled",
];

const STATUS_DROPDOWN_PREFIX = "status:";
const SCHEDULE_DROPDOWN_PREFIX = "schedule:";
const HABIT_ADD_KEY = "habit-add";

const DAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const MONTH_NAMES = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
] as const;

const nowIso = () => new Date().toISOString();

function createId(prefix: string = "task") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function parseDateToken(token: string, today: Date): string | null {
  const lower = token.toLowerCase();
  if (lower === "today") return formatDate(today);
  if (lower === "tomorrow" || lower === "tom") return formatDate(addDays(today, 1));

  const dayMatch = lower.match(/^(next-)?([a-z]{3})$/);
  if (dayMatch) {
    const isNext = !!dayMatch[1];
    const dayIdx = DAY_NAMES.indexOf(dayMatch[2] as (typeof DAY_NAMES)[number]);
    if (dayIdx >= 0) {
      const todayIdx = today.getDay();
      let offset = (dayIdx - todayIdx + 7) % 7;
      if (isNext) offset += 7;
      return formatDate(addDays(today, offset));
    }
  }

  const isoMatch = lower.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  const monthDayMatch = lower.match(/^([a-z]{3})(\d{1,2})$/);
  if (monthDayMatch) {
    const monthIdx = MONTH_NAMES.indexOf(monthDayMatch[1] as (typeof MONTH_NAMES)[number]);
    const day = parseInt(monthDayMatch[2], 10);
    if (monthIdx >= 0 && day >= 1 && day <= 31) {
      let year = today.getFullYear();
      const candidate = new Date(year, monthIdx, day);
      if (candidate < startOfDay(today)) year += 1;
      return `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  return null;
}

function parseStatusToken(token: string): TaskStatus | null {
  switch (token) {
    case "backlog":
      return "Backlog";
    case "todo":
      return "Todo";
    case "doing":
    case "in-progress":
    case "inprogress":
      return "In Progress";
    case "done":
      return "Done";
    case "canceled":
    case "cancelled":
      return "Canceled";
    default:
      return null;
  }
}

function parseTaskInput(input: string, today: Date): ParsedInput {
  let title = "";
  let description = "";
  let status: TaskStatus = "Todo";
  let scheduledDate: string | null = null;
  let evening = false;
  let dateExplicit = false;

  let body = input;
  const descMatch = input.match(/(^|\s)\+\s+/);
  if (descMatch) {
    const matchIndex = input.indexOf(descMatch[0]);
    body = input.slice(0, matchIndex);
    description = input.slice(matchIndex + descMatch[0].length).trim();
  }

  const tokens = body.split(/\s+/).filter((t) => t.length > 0);
  const titleParts: string[] = [];

  for (const token of tokens) {
    if (token.startsWith("@") && token.length > 1) {
      const value = token.slice(1).toLowerCase();
      if (value === "evening") {
        evening = true;
        if (!dateExplicit) scheduledDate = formatDate(today);
        continue;
      }
      if (value === "clear" || value === "none") {
        scheduledDate = null;
        dateExplicit = true;
        continue;
      }
      const parsed = parseDateToken(token.slice(1), today);
      if (parsed) {
        scheduledDate = parsed;
        dateExplicit = true;
        continue;
      }
      titleParts.push(token);
      continue;
    }
    if (token.startsWith("#") && token.length > 1) {
      const matched = parseStatusToken(token.slice(1).toLowerCase());
      if (matched) {
        status = matched;
        continue;
      }
      titleParts.push(token);
      continue;
    }
    titleParts.push(token);
  }

  title = titleParts.join(" ").trim();
  return { title, description, status, scheduledDate, evening };
}

function bucketTasks(
  tasks: Task[],
  today: Date
): { today: Task[]; evening: Task[]; rest: Task[] } {
  const todayStr = formatDate(today);
  const todayList: Task[] = [];
  const eveningList: Task[] = [];
  const restList: Task[] = [];

  for (const task of tasks) {
    if (task.scheduledDate === todayStr) {
      if (task.evening) eveningList.push(task);
      else todayList.push(task);
      continue;
    }
    if (
      task.scheduledDate &&
      task.scheduledDate < todayStr &&
      task.status !== "Done" &&
      task.status !== "Canceled"
    ) {
      todayList.push(task);
      continue;
    }
    restList.push(task);
  }

  todayList.sort((a, b) => {
    const aOverdue = !!(a.scheduledDate && a.scheduledDate < todayStr);
    const bOverdue = !!(b.scheduledDate && b.scheduledDate < todayStr);
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    if (aOverdue && bOverdue && a.scheduledDate && b.scheduledDate) {
      return a.scheduledDate.localeCompare(b.scheduledDate);
    }
    return a.createdAt.localeCompare(b.createdAt);
  });

  eveningList.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  restList.sort((a, b) => {
    const aDate = a.scheduledDate ?? "9999-99-99";
    const bDate = b.scheduledDate ?? "9999-99-99";
    const cmp = aDate.localeCompare(bDate);
    if (cmp !== 0) return cmp;
    return a.createdAt.localeCompare(b.createdAt);
  });

  return { today: todayList, evening: eveningList, rest: restList };
}

function formatDateLabel(date: string | null, today: Date): string {
  if (!date) return "—";
  const todayStr = formatDate(today);
  const tomorrowStr = formatDate(addDays(today, 1));
  if (date === todayStr) return "today";
  if (date === tomorrowStr) return "tomorrow";

  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;

  const diffDays = Math.round(
    (startOfDay(parsed).getTime() - startOfDay(today).getTime()) / 86400000
  );

  if (diffDays > 0 && diffDays < 7) {
    return parsed.toLocaleDateString("en-US", { weekday: "short" });
  }

  if (parsed.getFullYear() === today.getFullYear()) {
    return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPreviewLine(parsed: ParsedInput, today: Date): string {
  if (!parsed.title) return "";
  const parts: string[] = [`"${parsed.title}"`];
  if (parsed.scheduledDate) {
    let label = formatDateLabel(parsed.scheduledDate, today);
    if (parsed.evening && parsed.scheduledDate === formatDate(today)) {
      label = "this evening";
    }
    parts.push(label);
  } else if (parsed.evening) {
    parts.push("this evening");
  }
  parts.push(parsed.status);
  if (parsed.description) {
    parts.push(`description: "${parsed.description}"`);
  }
  return `→ ${parts.join(" · ")}`;
}

function isStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" && STATUS_OPTIONS.includes(value as TaskStatus);
}

function coerceTask(value: unknown): Task | null {
  if (!value || typeof value !== "object") return null;
  const t = value as Record<string, unknown>;
  if (typeof t.id !== "string") return null;
  if (typeof t.title !== "string") return null;
  if (!isStatus(t.status)) return null;
  if (typeof t.createdAt !== "string") return null;
  if (typeof t.updatedAt !== "string") return null;
  let scheduledDate: string | null = null;
  if (typeof t.scheduledDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(t.scheduledDate)) {
    scheduledDate = t.scheduledDate;
  }
  return {
    id: t.id,
    title: t.title,
    description: typeof t.description === "string" ? t.description : "",
    status: t.status,
    scheduledDate,
    evening: typeof t.evening === "boolean" ? t.evening : false,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

function coerceHabit(value: unknown): Habit | null {
  if (!value || typeof value !== "object") return null;
  const h = value as Record<string, unknown>;
  if (typeof h.id !== "string") return null;
  if (typeof h.icon !== "string" || h.icon.length === 0) return null;
  return {
    id: h.id,
    icon: h.icon,
    name: typeof h.name === "string" ? h.name : "",
    createdAt: typeof h.createdAt === "string" ? h.createdAt : nowIso(),
  };
}

function coerceCompletions(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, string[]> = {};
  for (const [habitId, dates] of Object.entries(value as Record<string, unknown>)) {
    if (!Array.isArray(dates)) continue;
    const valid = dates.filter(
      (d): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)
    );
    if (valid.length > 0) out[habitId] = Array.from(new Set(valid));
  }
  return out;
}

function validateData(value: unknown): TasksData | null {
  if (!value || typeof value !== "object") return null;
  const d = value as Record<string, unknown>;
  if (d.version !== 1 || !Array.isArray(d.tasks)) return null;
  const tasks: Task[] = [];
  for (const raw of d.tasks) {
    const task = coerceTask(raw);
    if (!task) return null;
    tasks.push(task);
  }
  const habits: Habit[] = [];
  if (Array.isArray(d.habits)) {
    for (const raw of d.habits) {
      const habit = coerceHabit(raw);
      if (habit) habits.push(habit);
    }
  }
  return {
    version: 1,
    tasks,
    habits,
    completions: coerceCompletions(d.completions),
    updatedAt: typeof d.updatedAt === "string" ? d.updatedAt : nowIso(),
  };
}

function migrateFromGroveway(): TasksData | null {
  try {
    const raw = localStorage.getItem(LEGACY_GROVEWAY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.issues)) {
      return null;
    }
    const tasks: Task[] = [];
    for (const issue of parsed.issues) {
      if (!issue || typeof issue !== "object") continue;
      const i = issue as Record<string, unknown>;
      if (typeof i.id !== "string" || typeof i.title !== "string") continue;
      let status: TaskStatus = "Todo";
      if (i.status === "In Review") status = "In Progress";
      else if (isStatus(i.status)) status = i.status;
      else continue;
      tasks.push({
        id: i.id,
        title: i.title,
        description: typeof i.description === "string" ? i.description : "",
        status,
        scheduledDate: null,
        evening: false,
        createdAt: typeof i.createdAt === "string" ? i.createdAt : nowIso(),
        updatedAt: typeof i.updatedAt === "string" ? i.updatedAt : nowIso(),
      });
    }
    return { version: 1, tasks, habits: [], completions: {}, updatedAt: nowIso() };
  } catch {
    return null;
  }
}

function emptyData(): TasksData {
  return {
    version: 1,
    tasks: [],
    habits: [],
    completions: {},
    updatedAt: nowIso(),
  };
}

export default function TasksPage() {
  const [data, setData] = useState<TasksData>(emptyData);
  const [mounted, setMounted] = useState(false);

  const [today, setTodayState] = useState<Date>(() => startOfDay(new Date()));

  const [input, setInput] = useState("");

  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [editValue, setEditValue] = useState("");

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const [habitDraftIcon, setHabitDraftIcon] = useState("");
  const [habitDraftName, setHabitDraftName] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? validateData(JSON.parse(stored)) : null;
      if (parsed) {
        setData(parsed);
      } else {
        const migrated = migrateFromGroveway();
        if (migrated) {
          setData(migrated);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        }
      }
    } catch {
      // ignore — start with empty
    } finally {
      setMounted(true);
      setTodayState(startOfDay(new Date()));
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  }, [data, mounted]);

  const buckets = useMemo(() => bucketTasks(data.tasks, today), [data.tasks, today]);

  const parsedPreview = useMemo(() => parseTaskInput(input, today), [input, today]);
  const previewLine = useMemo(
    () => formatPreviewLine(parsedPreview, today),
    [parsedPreview, today]
  );

  function update(updater: (current: TasksData) => TasksData) {
    setData((current) => ({ ...updater(current), updatedAt: nowIso() }));
  }

  function commitAdd() {
    if (!parsedPreview.title) {
      setInput("");
      return;
    }
    const task: Task = {
      id: createId(),
      title: parsedPreview.title,
      description: parsedPreview.description,
      status: parsedPreview.status,
      scheduledDate: parsedPreview.scheduledDate,
      evening: parsedPreview.evening,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    update((current) => ({ ...current, tasks: [...current.tasks, task] }));
    setInput("");
  }

  function changeStatus(id: string, status: TaskStatus) {
    update((current) => ({
      ...current,
      tasks: current.tasks.map((t) =>
        t.id === id ? { ...t, status, updatedAt: nowIso() } : t
      ),
    }));
    setOpenDropdownId(null);
  }

  function changeSchedule(
    id: string,
    scheduledDate: string | null,
    evening: boolean
  ) {
    update((current) => ({
      ...current,
      tasks: current.tasks.map((t) =>
        t.id === id
          ? { ...t, scheduledDate, evening, updatedAt: nowIso() }
          : t
      ),
    }));
    setOpenDropdownId(null);
  }

  function commitField(target: EditTarget, value: string) {
    if (target.field === "title") {
      const trimmed = value.trim();
      if (!trimmed) {
        setEditing(null);
        return;
      }
      update((current) => ({
        ...current,
        tasks: current.tasks.map((t) =>
          t.id === target.id ? { ...t, title: trimmed, updatedAt: nowIso() } : t
        ),
      }));
    } else {
      update((current) => ({
        ...current,
        tasks: current.tasks.map((t) =>
          t.id === target.id
            ? { ...t, description: value.trim(), updatedAt: nowIso() }
            : t
        ),
      }));
    }
    setEditing(null);
  }

  function startEditing(target: EditTarget, value: string) {
    setEditing(target);
    setEditValue(value);
  }

  function deleteTask(id: string) {
    if (typeof window !== "undefined" && !window.confirm("Delete this task?")) return;
    update((current) => ({
      ...current,
      tasks: current.tasks.filter((t) => t.id !== id),
    }));
  }

  function toggleHabitToday(habitId: string) {
    const todayKey = formatDate(today);
    update((current) => {
      const dates = current.completions[habitId] ?? [];
      const next = dates.includes(todayKey)
        ? dates.filter((d) => d !== todayKey)
        : [...dates, todayKey];
      return {
        ...current,
        completions: { ...current.completions, [habitId]: next },
      };
    });
  }

  function commitAddHabit() {
    const icon = habitDraftIcon.trim().slice(0, 2);
    if (!icon) {
      setOpenDropdownId(null);
      setHabitDraftIcon("");
      setHabitDraftName("");
      return;
    }
    const habit: Habit = {
      id: createId("habit"),
      icon,
      name: habitDraftName.trim() || icon,
      createdAt: nowIso(),
    };
    update((current) => ({ ...current, habits: [...current.habits, habit] }));
    setOpenDropdownId(null);
    setHabitDraftIcon("");
    setHabitDraftName("");
  }

  function deleteHabit(id: string) {
    if (typeof window !== "undefined" && !window.confirm("Delete this habit?")) return;
    update((current) => {
      const nextCompletions = { ...current.completions };
      delete nextCompletions[id];
      return {
        ...current,
        habits: current.habits.filter((h) => h.id !== id),
        completions: nextCompletions,
      };
    });
  }

  function handleEditKey(
    event: ReactKeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    isTextarea: boolean
  ) {
    if (event.key === "Escape") {
      setEditing(null);
      return;
    }
    if (event.key === "Enter" && (!isTextarea || event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      event.currentTarget.blur();
    }
  }

  const totalTasks = buckets.today.length + buckets.evening.length + buckets.rest.length;
  const todayStr = formatDate(today);
  const habitAddOpen = openDropdownId === HABIT_ADD_KEY;

  const rows: React.ReactNode[] = [];

  if (mounted) {
    rows.push(
      <p key="habits" className="task-habits-row">
        {data.habits.map((habit) => {
          const done = (data.completions[habit.id] ?? []).includes(todayStr);
          return (
            <span key={habit.id} className="task-habit-cell">
              <button
                type="button"
                className="task-habit-box"
                data-done={done ? "true" : "false"}
                onClick={() => toggleHabitToday(habit.id)}
                title={habit.name || habit.icon}
                aria-pressed={done}
              >
                <span className="task-habit-icon">{habit.icon}</span>
              </button>
              <button
                type="button"
                className="task-habit-delete"
                onClick={() => deleteHabit(habit.id)}
                aria-label={`Delete habit ${habit.name || habit.icon}`}
              >
                ×
              </button>
            </span>
          );
        })}
        <span className="task-habit-cell task-habit-cell--add">
          <HabitAddButton
            open={habitAddOpen}
            icon={habitDraftIcon}
            name={habitDraftName}
            onIconChange={setHabitDraftIcon}
            onNameChange={setHabitDraftName}
            onToggle={() =>
              setOpenDropdownId((prev) => (prev === HABIT_ADD_KEY ? null : HABIT_ADD_KEY))
            }
            onCommit={commitAddHabit}
            onClose={() => {
              setOpenDropdownId(null);
              setHabitDraftIcon("");
              setHabitDraftName("");
            }}
          />
        </span>
      </p>
    );
  }

  rows.push(
    <p key="input" className="task-input-row">
      <span className="task-input-prompt" aria-hidden="true">
        ▸
      </span>
      <input
        type="text"
        className="task-input"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commitAdd();
          } else if (event.key === "Escape") {
            setInput("");
          }
        }}
        placeholder="what needs doing?"
        autoComplete="off"
        spellCheck={false}
      />
    </p>
  );

  rows.push(
    <p key="preview" className="task-preview-row">
      {input.trim() === "" ? (
        <span className="task-preview-hint">
          try @today · @tomorrow · @evening · @mon–@sun · #todo · #doing · + description
        </span>
      ) : previewLine ? (
        <span className="task-preview">{previewLine}</span>
      ) : (
        <span className="task-preview-hint">title?</span>
      )}
    </p>
  );

  function renderTaskRow(task: Task) {
    const titleEditing = editing?.id === task.id && editing.field === "title";
    const descEditing = editing?.id === task.id && editing.field === "description";

    return (
      <p key={task.id} className="task-row">
        <StatusButton
          status={task.status}
          open={openDropdownId === `${STATUS_DROPDOWN_PREFIX}${task.id}`}
          onToggle={() =>
            setOpenDropdownId((prev) =>
              prev === `${STATUS_DROPDOWN_PREFIX}${task.id}`
                ? null
                : `${STATUS_DROPDOWN_PREFIX}${task.id}`
            )
          }
          onSelect={(status) => changeStatus(task.id, status)}
          onClose={() => setOpenDropdownId(null)}
        />
        <ScheduleButton
          scheduledDate={task.scheduledDate}
          evening={task.evening}
          today={today}
          open={openDropdownId === `${SCHEDULE_DROPDOWN_PREFIX}${task.id}`}
          onToggle={() =>
            setOpenDropdownId((prev) =>
              prev === `${SCHEDULE_DROPDOWN_PREFIX}${task.id}`
                ? null
                : `${SCHEDULE_DROPDOWN_PREFIX}${task.id}`
            )
          }
          onSelect={(scheduledDate, evening) =>
            changeSchedule(task.id, scheduledDate, evening)
          }
          onClose={() => setOpenDropdownId(null)}
        />
        <span className="task-row-body">
          {titleEditing ? (
            <input
              autoFocus
              type="text"
              className="task-input task-row-title-input"
              value={editValue}
              onChange={(event) => setEditValue(event.target.value)}
              onBlur={() => commitField(editing!, editValue)}
              onKeyDown={(event) => handleEditKey(event, false)}
            />
          ) : (
            <span
              className={`task-row-title${task.status === "Done" || task.status === "Canceled" ? " task-row-title--done" : ""}`}
              role="button"
              tabIndex={0}
              onClick={() =>
                startEditing({ id: task.id, field: "title" }, task.title)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  startEditing({ id: task.id, field: "title" }, task.title);
                }
              }}
            >
              {task.title}
            </span>
          )}

          {descEditing ? (
            <textarea
              autoFocus
              className="task-input task-row-description-input"
              value={editValue}
              onChange={(event) => setEditValue(event.target.value)}
              onBlur={() => commitField(editing!, editValue)}
              onKeyDown={(event) => handleEditKey(event, true)}
              rows={3}
              placeholder="description…"
            />
          ) : task.description ? (
            <span
              className="task-row-description"
              role="button"
              tabIndex={0}
              onClick={() =>
                startEditing(
                  { id: task.id, field: "description" },
                  task.description
                )
              }
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  startEditing(
                    { id: task.id, field: "description" },
                    task.description
                  );
                }
              }}
            >
              {task.description}
            </span>
          ) : (
            <button
              type="button"
              className="task-row-description-add"
              onClick={() =>
                startEditing({ id: task.id, field: "description" }, "")
              }
            >
              + description
            </button>
          )}
        </span>
        <button
          type="button"
          className="task-row-delete"
          onClick={() => deleteTask(task.id)}
          aria-label="Delete task"
        >
          ✕
        </button>
      </p>
    );
  }

  if (mounted) {
    if (buckets.today.length > 0) {
      const overdueCount = buckets.today.filter(
        (t) => t.scheduledDate && t.scheduledDate < todayStr
      ).length;
      rows.push(
        <p key="header-today" className="task-section-header">
          <span className="task-section-glyph" aria-hidden="true">▾</span>{" "}
          <span className="task-section-name">Today</span>
          <span className="task-section-count"> · {buckets.today.length}</span>
          {overdueCount > 0 ? (
            <span className="task-section-note"> · {overdueCount} overdue</span>
          ) : null}
        </p>
      );
      for (const task of buckets.today) {
        rows.push(renderTaskRow(task));
      }
    }

    if (buckets.evening.length > 0) {
      rows.push(
        <p key="header-evening" className="task-section-header">
          <span className="task-section-glyph" aria-hidden="true">▾</span>{" "}
          <span className="task-section-name">This evening</span>
          <span className="task-section-count"> · {buckets.evening.length}</span>
        </p>
      );
      for (const task of buckets.evening) {
        rows.push(renderTaskRow(task));
      }
    }

    if (buckets.rest.length > 0) {
      rows.push(
        <p key="header-rest" className="task-section-header">
          <span className="task-section-glyph" aria-hidden="true">▾</span>{" "}
          <span className="task-section-name">Rest of tasks</span>
          <span className="task-section-count"> · {buckets.rest.length}</span>
        </p>
      );
      for (const task of buckets.rest) {
        rows.push(renderTaskRow(task));
      }
    }

    if (totalTasks === 0) {
      rows.push(
        <p key="empty" className="task-empty">
          no tasks yet.
        </p>
      );
    }
  }

  return (
    <div className="homepage">
      <article className="article">
        <header>
          <p className="page-name">Cade Ross</p>
          <p className="page-greeting">Tasks</p>
        </header>
        <section className="about-section">{rows}</section>
      </article>
    </div>
  );
}

function StatusButton({
  status,
  open,
  onToggle,
  onSelect,
  onClose,
}: {
  status: TaskStatus;
  open: boolean;
  onToggle: () => void;
  onSelect: (status: TaskStatus) => void;
  onClose: () => void;
}) {
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointer(event: MouseEvent) {
      if (!wrapRef.current) return;
      if (wrapRef.current.contains(event.target as Node)) return;
      onClose();
    }
    function handleKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  return (
    <span className="task-status-wrap" ref={wrapRef}>
      <button
        type="button"
        className="task-status-trigger"
        onClick={onToggle}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="task-status-dot" data-status={status} aria-hidden="true">
          ●
        </span>
        <span className="task-status-label">{status}</span>
      </button>
      {open && (
        <span className="task-popover" role="listbox">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={option === status}
              className={`task-popover-option${
                option === status ? " task-popover-option--current" : ""
              }`}
              onClick={() => onSelect(option)}
            >
              <span
                className="task-status-dot"
                data-status={option}
                aria-hidden="true"
              >
                ●
              </span>
              <span>{option}</span>
            </button>
          ))}
        </span>
      )}
    </span>
  );
}

function ScheduleButton({
  scheduledDate,
  evening,
  today,
  open,
  onToggle,
  onSelect,
  onClose,
}: {
  scheduledDate: string | null;
  evening: boolean;
  today: Date;
  open: boolean;
  onToggle: () => void;
  onSelect: (scheduledDate: string | null, evening: boolean) => void;
  onClose: () => void;
}) {
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointer(event: MouseEvent) {
      if (!wrapRef.current) return;
      if (wrapRef.current.contains(event.target as Node)) return;
      onClose();
    }
    function handleKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  const todayStr = formatDate(today);
  const tomorrowStr = formatDate(addDays(today, 1));

  let label: string;
  if (!scheduledDate) {
    label = "—";
  } else if (scheduledDate === todayStr && evening) {
    label = "this evening";
  } else {
    label = formatDateLabel(scheduledDate, today);
  }

  return (
    <span className="task-schedule-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`task-schedule-trigger${scheduledDate ? "" : " task-schedule-trigger--empty"}`}
        onClick={onToggle}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="task-schedule-label">{label}</span>
      </button>
      {open && (
        <span className="task-popover" role="listbox">
          <button
            type="button"
            role="option"
            aria-selected={scheduledDate === todayStr && !evening}
            className={`task-popover-option${
              scheduledDate === todayStr && !evening
                ? " task-popover-option--current"
                : ""
            }`}
            onClick={() => onSelect(todayStr, false)}
          >
            today
          </button>
          <button
            type="button"
            role="option"
            aria-selected={scheduledDate === todayStr && evening}
            className={`task-popover-option${
              scheduledDate === todayStr && evening
                ? " task-popover-option--current"
                : ""
            }`}
            onClick={() => onSelect(todayStr, true)}
          >
            this evening
          </button>
          <button
            type="button"
            role="option"
            aria-selected={scheduledDate === tomorrowStr && !evening}
            className={`task-popover-option${
              scheduledDate === tomorrowStr && !evening
                ? " task-popover-option--current"
                : ""
            }`}
            onClick={() => onSelect(tomorrowStr, false)}
          >
            tomorrow
          </button>
          <span className="task-popover-divider" />
          <span className="task-popover-row">
            <input
              type="date"
              className="task-input task-popover-date-input"
              value={scheduledDate ?? ""}
              onChange={(event) => {
                const next = event.target.value || null;
                onSelect(next, evening && next === todayStr);
              }}
              aria-label="Pick a date"
            />
          </span>
          <span className="task-popover-divider" />
          <button
            type="button"
            role="option"
            aria-selected={scheduledDate === null}
            className={`task-popover-option${
              scheduledDate === null ? " task-popover-option--current" : ""
            }`}
            onClick={() => onSelect(null, false)}
          >
            clear
          </button>
        </span>
      )}
    </span>
  );
}

function HabitAddButton({
  open,
  icon,
  name,
  onIconChange,
  onNameChange,
  onToggle,
  onCommit,
  onClose,
}: {
  open: boolean;
  icon: string;
  name: string;
  onIconChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onToggle: () => void;
  onCommit: () => void;
  onClose: () => void;
}) {
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointer(event: MouseEvent) {
      if (!wrapRef.current) return;
      if (wrapRef.current.contains(event.target as Node)) return;
      onClose();
    }
    function handleKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  return (
    <span className="task-habit-add-wrap" ref={wrapRef}>
      <button
        type="button"
        className="task-habit-box task-habit-box--add"
        onClick={onToggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Add habit"
      >
        <span className="task-habit-icon">+</span>
      </button>
      {open && (
        <span className="task-popover task-habit-popover" role="dialog">
          <span className="task-popover-row">
            <span className="task-habit-popover-label">icon</span>
            <input
              autoFocus
              type="text"
              className="task-input task-habit-popover-input"
              value={icon}
              onChange={(event) => onIconChange(event.target.value.slice(0, 2))}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onCommit();
                }
              }}
              placeholder="X"
              maxLength={2}
              aria-label="Habit icon"
            />
          </span>
          <span className="task-popover-row">
            <span className="task-habit-popover-label">name</span>
            <input
              type="text"
              className="task-input task-habit-popover-input"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onCommit();
                }
              }}
              placeholder="post on X"
              aria-label="Habit name"
            />
          </span>
          <span className="task-popover-divider" />
          <button
            type="button"
            className="task-popover-option"
            onClick={onCommit}
          >
            + add habit
          </button>
        </span>
      )}
    </span>
  );
}
