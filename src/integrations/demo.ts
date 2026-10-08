import "server-only";
import type { Context, Label, Milestone, Person, RepoBranches, WorkItem } from "@/core/types";
import type { Provider } from "./types";

/** Dados fictícios para ver a interface sem chaves. Ativo só com DEMO_DATA=1. */
const H = 3_600_000;

const L = {
  bug: { name: "bug", color: "d73a4a" },
  feat: { name: "feature", color: "a2eeef" },
  front: { name: "frontend", color: "5319e7" },
  back: { name: "backend", color: "0e8a16" },
  docs: { name: "docs", color: "0075ca" },
  p1: { name: "P1", color: "e99695" },
} satisfies Record<string, Label>;

const me: Person = { login: "voce" };
const ana: Person = { login: "ana" };
const rui: Person = { login: "rui" };

type Seed = Partial<WorkItem> & Pick<WorkItem, "source" | "kind" | "key" | "title" | "status">;

function items(ctx: Context): WorkItem[] {
  const now = Date.now();
  const day = (d: number) => new Date(now + d * 24 * H).toISOString().slice(0, 10);
  const ago = (h: number) => new Date(now - h * H).toISOString();
  const sprint: Milestone = { title: "Sprint 14", dueOn: day(5), url: "https://github.com" };
  const next: Milestone = { title: "Sprint 15", dueOn: day(19), url: "https://github.com" };
  const cycle: Milestone = { title: "Ciclo outubro", dueOn: day(9) };

  const seeds: Seed[] = [
    { source: "github", kind: "review", key: "web#412", title: "Refatorar fluxo de checkout com novo gateway", status: "PR aberto", started: true, updatedAt: ago(3), checks: "pending", review: "pending", assignees: [ana], author: "ana", labels: [L.feat, L.front], milestone: sprint, comments: 6 },
    { source: "github", kind: "pr", key: "api#88", title: "Cache de sessão no Redis", status: "PR aberto", started: true, updatedAt: ago(26), checks: "failure", review: "changes", assignees: [me], author: "voce", labels: [L.back], milestone: sprint, comments: 4, dueDate: day(-2) },
    { source: "github", kind: "pr", key: "web#430", title: "Página de configurações de notificações", status: "Rascunho", started: true, updatedAt: ago(50), draft: true, checks: "success", assignees: [me], author: "voce", labels: [L.front], milestone: next },
    { source: "github", kind: "issue", key: "api#91", title: "Timeout ao exportar relatórios grandes", status: "Aberta", updatedAt: ago(5), assignees: [me], labels: [L.bug, L.back, L.p1], milestone: sprint, comments: 3, issueType: { name: "Bug", color: "RED" }, dueDate: day(0) },
    { source: "github", kind: "issue", key: "web#433", title: "Filtro por período no histórico de pedidos", status: "Aberta", updatedAt: ago(30), assignees: [me, rui], labels: [L.feat, L.front], milestone: sprint, comments: 1, subIssues: { total: 4, completed: 1 }, issueType: { name: "Feature", color: "BLUE" } },
    { source: "github", kind: "issue", key: "web#440", title: "Tela de login quebra em telas pequenas", status: "Sem responsável", updatedAt: ago(12), assignees: [], labels: [L.bug, L.front], milestone: sprint, comments: 2, issueType: { name: "Bug", color: "RED" } },
    { source: "github", kind: "issue", key: "api#95", title: "Documentar endpoints de faturamento", status: "Aberta", updatedAt: ago(90), assignees: [ana], labels: [L.docs], milestone: next },
    { source: "github", kind: "issue", key: "api#97", title: "Avaliar troca do ORM", status: "Sem responsável", updatedAt: ago(300), assignees: [], labels: [L.back], milestone: null, comments: 9 },
    { source: "plane", kind: "task", key: "WEB-128", title: "Definir escopo da release 2.4", status: "Em andamento", stateGroup: "started", started: true, sourcePriority: 1, updatedAt: ago(8), assignees: [me], milestone: cycle, dueDate: day(3), labels: [{ name: "planejamento", color: "d8b04a" }] },
    { source: "plane", kind: "task", key: "WEB-131", title: "Revisar textos do onboarding", status: "A fazer", stateGroup: "unstarted", sourcePriority: 2, updatedAt: ago(72), assignees: [me], milestone: cycle, dueDate: day(12) },
    { source: "plane", kind: "task", key: "OPS-12", title: "Rotacionar credenciais do ambiente de staging", status: "Backlog", stateGroup: "backlog", sourcePriority: 3, updatedAt: ago(200), assignees: [rui] },
  ];

  return seeds.map((s, i) => {
    const assignees = s.assignees ?? [];
    return {
      uid: `${s.source}:demo-${ctx.id}-${i}`,
      externalId: `demo-${ctx.id}-${i}`,
      contextId: ctx.id,
      url: s.source === "github" ? "https://github.com" : "https://app.plane.so",
      container: s.source === "github" ? `${ctx.id}/${s.key.split("#")[0]}` : s.key.split("-")[0],
      started: false,
      sourcePriority: s.labels?.some((l) => l.name === "P1") ? 1 : null,
      labels: [],
      dueDate: null,
      updatedAt: ago(1),
      milestone: null,
      mine: s.kind === "review" || assignees.some((a) => a.login === "voce") || s.author === "voce",
      ...s,
      assignees,
    } satisfies WorkItem;
  });
}

function branches(ctx: Context): RepoBranches[] {
  const now = Date.now();
  const at = (h: number) => new Date(now - h * H).toISOString();
  const repo = `${ctx.id}/web`;
  const b = (name: string, h: number, ahead: number, behind: number, pr: RepoBranches["branches"][number]["pr"], msg: string, author = "voce") => ({
    contextId: ctx.id, repo, name, url: "https://github.com", lastCommitAt: at(h), lastCommitMessage: msg, author, ahead, behind, pr,
  });
  return [
    {
      contextId: ctx.id,
      repo,
      defaultBranch: "main",
      url: "https://github.com",
      branches: [
        b("feat/checkout-gateway", 3, 12, 2, { number: 412, url: "https://github.com", draft: false, review: "approved", checks: "success" }, "ajusta tratamento de erro do gateway"),
        b("fix/session-cache", 26, 4, 9, { number: 88, url: "https://github.com", draft: false, review: "changes", checks: "failure" }, "usa TTL configurável"),
        b("feat/notificacoes", 50, 7, 31, { number: 430, url: "https://github.com", draft: true, review: null, checks: "pending" }, "wip: tela de preferências"),
        b("spike/graphql", 24 * 40, 3, 140, null, "experimento com schema stitching", "colega"),
      ],
    },
  ];
}

export const demo: Provider = {
  source: "github",
  enabled: () => true,
  identify: async () => "@demo",
  fetchItems: async (ctx) => items(ctx),
  fetchBranches: async (ctx) => branches(ctx),
};
