export type Source = "github" | "plane";

/** 0 = urgente … 3 = baixa; null = sem prioridade. */
export type Priority = 0 | 1 | 2 | 3 | null;

export type CheckState = "success" | "failure" | "pending" | null;
export type ReviewState = "approved" | "changes" | "pending" | null;

export interface Context {
  id: string;
  name: string;
  color: string;
  position: number;
  githubTokenEnv: string | null;
  githubOwner: string | null;
  githubRepos: string[];
  planeTokenEnv: string | null;
  planeWorkspace: string | null;
  planeProjects: string[];
}

export interface Label {
  name: string;
  /** Hex sem `#`, como vem do GitHub. */
  color: string;
}

export interface Person {
  login: string;
  avatarUrl?: string;
}

export interface Milestone {
  title: string;
  dueOn: string | null;
  url?: string;
}

export interface WorkItem {
  /** `${source}:${externalId}` — chave usada em item_meta. */
  uid: string;
  source: Source;
  externalId: string;
  contextId: string;
  kind: "issue" | "pr" | "review" | "task";
  /** Identificador curto exibido em mono: `repo#12`, `WEB-34`. */
  key: string;
  title: string;
  url: string;
  /** Repo (GitHub) ou projeto (Plane). */
  container: string;
  status: string;
  /** Grupo do estado no Plane: backlog | unstarted | started | triage. */
  stateGroup?: string;
  started: boolean;
  sourcePriority: Priority;
  labels: Label[];
  dueDate: string | null;
  createdAt?: string;
  updatedAt: string;
  /** Responsável é você (issues/tarefas) ou autor (PRs). */
  mine: boolean;
  assignees: Person[];
  author?: string;
  /** Milestone do GitHub ou ciclo do Plane: a "sprint". */
  milestone: Milestone | null;
  comments?: number;
  /** Tipo de issue do GitHub (Bug, Feature, Task…). */
  issueType?: { name: string; color: string } | null;
  subIssues?: { total: number; completed: number } | null;
  draft?: boolean;
  checks?: CheckState;
  review?: ReviewState;
}

export interface ItemMeta {
  priority: Priority;
  focus: "today" | "week" | null;
  snoozedUntil: Date | null;
  note: string | null;
}

export interface Item extends WorkItem {
  meta: ItemMeta;
  priority: Priority;
  score: number;
  snoozed: boolean;
}

export interface Branch {
  contextId: string;
  repo: string;
  name: string;
  url: string;
  lastCommitAt: string;
  lastCommitMessage: string;
  author: string;
  /** Commits à frente / atrás da branch padrão. */
  ahead: number;
  behind: number;
  /** Sem PR aberto e todos os commits já estão na branch de integração (`dev`). */
  merged: boolean;
  pr: {
    number: number;
    url: string;
    draft: boolean;
    review: ReviewState;
    checks: CheckState;
  } | null;
}

export interface RepoBranches {
  contextId: string;
  repo: string;
  defaultBranch: string;
  /** Branch `dev`, quando existe: usada para detectar branches já mergeadas. */
  integrationBranch: string | null;
  url: string;
  branches: Branch[];
}

export interface ProviderError {
  contextId: string;
  source: Source;
  message: string;
}

export interface ProviderResult<T> {
  data: T[];
  errors: ProviderError[];
}
