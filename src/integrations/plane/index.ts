import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { readToken } from "@/core/env";
import type { Context, Milestone, Person, Priority, WorkItem } from "@/core/types";
import type { Provider } from "../types";

const API = "https://api.plane.so/api/v1";
const APP = "https://app.plane.so";

interface Page<T> {
  results: T[];
  next_cursor?: string;
  next_page_results?: boolean;
}

interface PlaneProject {
  id: string;
  name: string;
  identifier: string;
  archived_at?: string | null;
}

interface PlaneState {
  id: string;
  name: string;
  /** backlog | unstarted | started | completed | cancelled | triage */
  group: string;
}

interface PlaneWorkItem {
  id: string;
  name: string;
  sequence_id: number;
  priority: "urgent" | "high" | "medium" | "low" | "none" | null;
  state: string | PlaneState;
  assignees: (string | { id: string })[];
  labels: (string | { id: string; name: string; color?: string })[];
  target_date: string | null;
  created_at?: string;
  updated_at: string;
}

const PRIORITY: Record<string, Priority> = { urgent: 0, high: 1, medium: 2, low: 3 };

async function api<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers: { "X-API-Key": token, Accept: "application/json" } });
  if (!res.ok) throw new Error(`Plane ${res.status} em ${path.split("?")[0]}`);
  return res.json() as Promise<T>;
}

async function all<T>(token: string, path: string, max = 5): Promise<T[]> {
  const out: T[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < max; i++) {
    const sep = path.includes("?") ? "&" : "?";
    const page = await api<Page<T> | T[]>(token, `${path}${sep}per_page=100${cursor ? `&cursor=${cursor}` : ""}`);
    if (Array.isArray(page)) return page;
    out.push(...page.results);
    if (!page.next_page_results || !page.next_cursor) break;
    cursor = page.next_cursor;
  }
  return out;
}

const idOf = (v: string | { id: string }) => (typeof v === "string" ? v : v.id);

async function identify(ctx: Context): Promise<string> {
  "use cache";
  cacheLife("hours");
  cacheTag("provider", `provider:${ctx.id}`);
  const me = await api<{ display_name?: string; email?: string }>(readToken("plane", ctx.planeTokenEnv), "/users/me/");
  return me.display_name || me.email || "conectado";
}

interface PlaneCycle {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
}

interface PlaneMember {
  id?: string;
  member?: string | { id: string; display_name?: string; avatar_url?: string; avatar?: string };
  display_name?: string;
  avatar_url?: string;
}

/** Não essencial: se falhar (permissão, plano), seguimos sem o dado. */
async function optional<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (e) {
    console.warn(`[plane] ${e instanceof Error ? e.message : e}`);
    return fallback;
  }
}

/** Membros do workspace por id, para mostrar responsáveis. */
async function members(token: string, slug: string) {
  const list = await optional(() => api<PlaneMember[] | Page<PlaneMember>>(token, `/workspaces/${slug}/members/`), []);
  const rows = Array.isArray(list) ? list : list.results;
  const map = new Map<string, Person>();
  for (const m of rows) {
    const user = typeof m.member === "object" ? m.member : null;
    const id = user?.id ?? (typeof m.member === "string" ? m.member : m.id);
    const login = user?.display_name ?? m.display_name;
    if (id && login) map.set(id, { login, avatarUrl: user?.avatar_url || user?.avatar || m.avatar_url || undefined });
  }
  return map;
}

/** Ciclo em andamento do projeto (a "sprint") e os itens dele. */
async function currentCycle(token: string, base: string, today: string) {
  const cycles = await optional(() => all<PlaneCycle>(token, `${base}/cycles/`), []);
  const cycle = cycles.find((c) => c.start_date && c.end_date && c.start_date.slice(0, 10) <= today && today <= c.end_date.slice(0, 10));
  if (!cycle) return null;
  const items = await optional(() => all<{ id?: string; issue?: string; work_item?: string }>(token, `${base}/cycles/${cycle.id}/cycle-issues/`), []);
  const ids = new Set(items.map((i) => i.issue ?? i.work_item ?? i.id).filter(Boolean) as string[]);
  return { milestone: { title: cycle.name, dueOn: cycle.end_date } satisfies Milestone, ids };
}

async function fetchItems(ctx: Context): Promise<WorkItem[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("provider", `provider:${ctx.id}`);

  const token = readToken("plane", ctx.planeTokenEnv);
  const slug = ctx.planeWorkspace;
  if (!slug) throw new Error("workspace do Plane não definido");
  const today = new Date().toISOString().slice(0, 10);

  const [me, people, allProjects] = await Promise.all([
    api<{ id: string }>(token, "/users/me/"),
    members(token, slug),
    all<PlaneProject>(token, `/workspaces/${slug}/projects/`),
  ]);
  const wanted = new Set(ctx.planeProjects.map((p) => p.toUpperCase()));
  const projects = allProjects.filter((p) => !p.archived_at && (wanted.size === 0 || wanted.has(p.identifier.toUpperCase())));

  const perProject = await Promise.all(
    projects.map(async (project) => {
      const base = `/workspaces/${slug}/projects/${project.id}`;
      const [states, items, cycle] = await Promise.all([
        all<PlaneState>(token, `${base}/states/`),
        all<PlaneWorkItem>(token, `${base}/work-items/?expand=labels&order_by=-updated_at`),
        currentCycle(token, base, today),
      ]);
      const stateById = new Map(states.map((s) => [s.id, s]));

      return items.flatMap((w): WorkItem[] => {
        const state = typeof w.state === "string" ? stateById.get(w.state) : w.state;
        if (state && (state.group === "completed" || state.group === "cancelled")) return [];
        const assigneeIds = w.assignees.map(idOf);
        const key = `${project.identifier}-${w.sequence_id}`;
        return [
          {
            uid: `plane:${w.id}`,
            source: "plane",
            externalId: w.id,
            contextId: ctx.id,
            kind: "task",
            key,
            title: w.name,
            url: `${APP}/${slug}/browse/${key}/`,
            container: project.name,
            status: state?.name ?? "Sem estado",
            stateGroup: state?.group,
            started: state?.group === "started",
            sourcePriority: PRIORITY[w.priority ?? "none"] ?? null,
            labels: w.labels.flatMap((l) => (typeof l === "string" ? [] : [{ name: l.name, color: (l.color ?? "").replace("#", "") || "9a9aa3" }])),
            dueDate: w.target_date,
            createdAt: w.created_at,
            updatedAt: w.updated_at,
            mine: assigneeIds.includes(me.id),
            assignees: assigneeIds.map((id) => people.get(id) ?? { login: "membro" }),
            milestone: cycle?.ids.has(w.id) ? cycle.milestone : null,
          },
        ];
      });
    }),
  );
  return perProject.flat();
}

export const plane: Provider = {
  source: "plane",
  enabled: (ctx) => Boolean(ctx.planeWorkspace),
  identify,
  fetchItems,
};
