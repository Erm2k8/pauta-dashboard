import "server-only";
import { graphql, GraphqlResponseError } from "@octokit/graphql";
import { cacheLife, cacheTag } from "next/cache";
import { readToken } from "@/core/env";
import type { Branch, CheckState, Context, Label, Priority, RepoBranches, ReviewState, WorkItem } from "@/core/types";
import type { Provider } from "../types";

/** Branch onde as features são integradas antes de ir para a padrão. */
const INTEGRATION_BRANCH = "dev";

type Rollup ={ nodes: { commit: { statusCheckRollup: { state: string } | null } }[] };
type Gql = ReturnType<typeof client>;

interface IssueNode {
  __typename: "Issue" | "PullRequest";
  id: string;
  number: number;
  title: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  author: { login: string } | null;
  repository: { nameWithOwner: string; name: string };
  labels: { nodes: { name: string; color: string }[] };
  milestone: { title: string; dueOn: string | null; url: string } | null;
  assignees: { nodes: { login: string; avatarUrl: string }[] };
  comments: { totalCount: number };
  issueType?: { name: string; color: string } | null;
  subIssuesSummary?: { total: number; completed: number } | null;
  isDraft?: boolean;
  reviewDecision?: string | null;
  commits?: Rollup;
}

const COMMON_FIELDS = /* GraphQL */ `
  id number title url createdAt updatedAt
  author { login }
  repository { nameWithOwner name }
  labels(first: 12) { nodes { name color } }
  milestone { title dueOn url }
  assignees(first: 6) { nodes { login avatarUrl(size: 48) } }
  comments { totalCount }
`;
/** Campos mais novos da API; se a conta/instância não suportar, refazemos a busca sem eles. */
const ISSUE_EXTRAS = "issueType { name color } subIssuesSummary { total completed }";
const PR_FIELDS = `${COMMON_FIELDS} isDraft reviewDecision commits(last: 1) { nodes { commit { statusCheckRollup { state } } } }`;

const issueFields = (extras: boolean) => `${COMMON_FIELDS} ${extras ? ISSUE_EXTRAS : ""}`;
const searchNodes = (extras: boolean) => `nodes { __typename ... on Issue { ${issueFields(extras)} } ... on PullRequest { ${PR_FIELDS} } }`;

function client(token: string) {
  return graphql.defaults({ headers: { authorization: `token ${token}` } });
}

/** Owners (orgs/usuários, separados por vírgula) definem o escopo das buscas; sem owner, usa os repos. */
export function owners(ctx: Context) {
  return (ctx.githubOwner ?? "").split(/[\s,]+/).filter(Boolean);
}

function scope(ctx: Context) {
  const list = owners(ctx);
  if (list.length) return list.map((o) => `user:${o}`).join(" ");
  return ctx.githubRepos.map((r) => `repo:${r}`).join(" ");
}

/** Executa a query aceitando resultado parcial (ex.: um repo sem acesso não derruba os outros). */
async function partial<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (e) {
    if (e instanceof GraphqlResponseError && e.data && Object.values(e.data as object).some(Boolean)) {
      console.warn(`[github] resultado parcial: ${e.errors?.map((x) => x.message).join("; ")}`);
      return e.data as T;
    }
    throw e;
  }
}

/** Tenta com os campos novos; se a API recusar, repete sem eles. */
async function withExtras<T>(run: (extras: boolean) => Promise<T>): Promise<T> {
  try {
    return await run(true);
  } catch (e) {
    if (e instanceof Error && /issueType|subIssuesSummary/.test(e.message)) return run(false);
    throw e;
  }
}

async function identify(ctx: Context): Promise<string> {
  "use cache";
  cacheLife("hours");
  cacheTag("provider", `provider:${ctx.id}`);
  const token = readToken("github", ctx.githubTokenEnv);
  const res = await client(token)<{ viewer: { login: string } }>(`query { viewer { login } }`);
  return `@${res.viewer.login}`;
}

const checkState = (c?: Rollup): CheckState => {
  const s = c?.nodes[0]?.commit.statusCheckRollup?.state;
  if (!s) return null;
  if (s === "SUCCESS") return "success";
  if (s === "FAILURE" || s === "ERROR") return "failure";
  return "pending";
};

const reviewState = (d?: string | null): ReviewState =>
  d === "APPROVED" ? "approved" : d === "CHANGES_REQUESTED" ? "changes" : d === "REVIEW_REQUIRED" ? "pending" : null;

/** Labels como `P0`, `priority: high`, `urgent` viram prioridade. */
function labelPriority(labels: Label[]): Priority {
  const text = labels.map((l) => l.name).join(" ").toLowerCase();
  if (/\bp0\b|urgent|urgente|critical|crítico|blocker/.test(text)) return 0;
  if (/\bp1\b|high|alta/.test(text)) return 1;
  if (/\bp2\b|medium|média|media/.test(text)) return 2;
  if (/\bp3\b|\blow\b|baixa/.test(text)) return 3;
  return null;
}

function toItem(ctx: Context, n: IssueNode, kind: WorkItem["kind"], viewer: string): WorkItem {
  const labels = n.labels.nodes.map((l) => ({ name: l.name, color: l.color }));
  const isPr = n.__typename === "PullRequest";
  const assignees = n.assignees.nodes.map((a) => ({ login: a.login, avatarUrl: a.avatarUrl }));
  const assignedToMe = assignees.some((a) => a.login === viewer);
  return {
    uid: `github:${n.id}`,
    source: "github",
    externalId: n.id,
    contextId: ctx.id,
    kind,
    key: `${n.repository.name}#${n.number}`,
    title: n.title,
    url: n.url,
    container: n.repository.nameWithOwner,
    status: isPr ? (n.isDraft ? "Rascunho" : "PR aberto") : assignees.length ? "Aberta" : "Sem responsável",
    started: isPr || assignedToMe,
    sourcePriority: labelPriority(labels),
    labels,
    dueDate: n.milestone?.dueOn ?? null,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
    mine: kind === "review" || assignedToMe || (isPr && n.author?.login === viewer),
    assignees,
    author: n.author?.login,
    milestone: n.milestone ? { title: n.milestone.title, dueOn: n.milestone.dueOn, url: n.milestone.url } : null,
    comments: n.comments.totalCount,
    issueType: n.issueType ?? null,
    subIssues: n.subIssuesSummary?.total ? n.subIssuesSummary : null,
    draft: n.isDraft,
    checks: isPr ? checkState(n.commits) : undefined,
    review: isPr ? reviewState(n.reviewDecision) : undefined,
  };
}

type SearchResult = { nodes: IssueNode[] };

/** O que é seu: atribuído a você, PRs seus e reviews pedidas, em todo o escopo do contexto. */
async function fetchMine(gql: Gql, ctx: Context, extras: boolean) {
  const s = scope(ctx);
  const nodes = searchNodes(extras);
  return gql<{ viewer: { login: string }; assigned: SearchResult; authored: SearchResult; reviews: SearchResult }>(
    `query($assigned: String!, $authored: String!, $reviews: String!) {
      viewer { login }
      assigned: search(query: $assigned, type: ISSUE, first: 100) { ${nodes} }
      authored: search(query: $authored, type: ISSUE, first: 50) { ${nodes} }
      reviews: search(query: $reviews, type: ISSUE, first: 50) { ${nodes} }
    }`,
    {
      assigned: `is:open archived:false assignee:@me ${s}`,
      authored: `is:open is:pr archived:false author:@me ${s}`,
      reviews: `is:open is:pr archived:false review-requested:@me ${s}`,
    },
  );
}

/**
 * Todas as issues abertas dos repositórios acompanhados (atribuídas ou não).
 * Um alias por repo evita o limite de tamanho da busca do GitHub.
 */
async function fetchRepoIssues(gql: Gql, ctx: Context, extras: boolean): Promise<IssueNode[]> {
  const repos = ctx.githubRepos;
  if (!repos.length) {
    const s = scope(ctx);
    if (!s) return [];
    const res = await gql<{ issues: SearchResult }>(
      `query($q: String!) { issues: search(query: $q, type: ISSUE, first: 100) { ${searchNodes(extras)} } }`,
      { q: `is:open is:issue archived:false ${s}` },
    );
    return res.issues.nodes;
  }

  const vars: Record<string, string> = {};
  const defs: string[] = [];
  const parts = repos.map((full, i) => {
    const [owner, name] = full.split("/");
    vars[`o${i}`] = owner;
    vars[`n${i}`] = name;
    defs.push(`$o${i}: String!, $n${i}: String!`);
    return `r${i}: repository(owner: $o${i}, name: $n${i}) {
      issues(states: OPEN, first: 100, orderBy: { field: UPDATED_AT, direction: DESC }) {
        nodes { __typename ${issueFields(extras)} }
      }
    }`;
  });
  const res = await partial(() =>
    gql<Record<string, { issues: { nodes: IssueNode[] } } | null>>(`query(${defs.join(", ")}) { ${parts.join("\n")} }`, vars),
  );
  return Object.values(res).flatMap((r) => r?.issues.nodes ?? []);
}

async function fetchItems(ctx: Context): Promise<WorkItem[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("provider", `provider:${ctx.id}`);

  const gql = client(readToken("github", ctx.githubTokenEnv));
  const [mine, repoIssues] = await withExtras((extras) => Promise.all([fetchMine(gql, ctx, extras), fetchRepoIssues(gql, ctx, extras)]));
  const viewer = mine.viewer.login;

  const byId = new Map<string, WorkItem>();
  for (const n of mine.reviews.nodes) if (n.id) byId.set(n.id, toItem(ctx, n, "review", viewer));
  for (const n of [...mine.assigned.nodes, ...mine.authored.nodes, ...repoIssues]) {
    if (!n.id || byId.has(n.id)) continue;
    byId.set(n.id, toItem(ctx, n, n.__typename === "PullRequest" ? "pr" : "issue", viewer));
  }
  return [...byId.values()];
}

interface RefNode {
  name: string;
  target: {
    committedDate?: string;
    messageHeadline?: string;
    author?: { name: string | null; user: { login: string } | null } | null;
  } | null;
  compare: { aheadBy: number; behindBy: number } | null;
  vsDev?: { behindBy: number } | null;
  associatedPullRequests: {
    nodes: { number: number; url: string; isDraft: boolean; reviewDecision: string | null; commits: Rollup }[];
  };
}

async function fetchRepoBranches(token: string, ctx: Context, fullName: string): Promise<RepoBranches> {
  const [owner, name] = fullName.split("/");
  const gql = client(token);
  const head = await gql<{ repository: { url: string; defaultBranchRef: { name: string } | null; dev: { name: string } | null } }>(
    `query($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) { url defaultBranchRef { name } dev: ref(qualifiedName: "refs/heads/${INTEGRATION_BRANCH}") { name } }
    }`,
    { owner, name },
  );
  const defaultBranch = head.repository.defaultBranchRef?.name ?? "main";
  const integrationBranch = head.repository.dev && head.repository.dev.name !== defaultBranch ? head.repository.dev.name : null;
  const vsDev = integrationBranch ? `vsDev: compare(headRef: "${integrationBranch}") { behindBy }` : "";

  // compare(headRef: default) parte da branch: aheadBy = commits da default que faltam na branch.
  const res = await gql<{ repository: { refs: { nodes: RefNode[] } } }>(
    `query($owner: String!, $name: String!, $base: String!) {
      repository(owner: $owner, name: $name) {
        refs(refPrefix: "refs/heads/", first: 100, orderBy: { field: TAG_COMMIT_DATE, direction: DESC }) {
          nodes {
            name
            target { ... on Commit { committedDate messageHeadline author { name user { login } } } }
            compare(headRef: $base) { aheadBy behindBy }
            ${vsDev}
            associatedPullRequests(first: 1, states: [OPEN]) {
              nodes { number url isDraft reviewDecision commits(last: 1) { nodes { commit { statusCheckRollup { state } } } } }
            }
          }
        }
      }
    }`,
    { owner, name, base: defaultBranch },
  );

  const branches: Branch[] = res.repository.refs.nodes
    .filter((r) => r.name !== defaultBranch && r.name !== integrationBranch && r.target?.committedDate)
    .map((r) => {
      const pr = r.associatedPullRequests.nodes[0];
      return {
        contextId: ctx.id,
        repo: fullName,
        name: r.name,
        url: `${head.repository.url}/tree/${r.name}`,
        lastCommitAt: r.target!.committedDate!,
        lastCommitMessage: r.target!.messageHeadline ?? "",
        author: r.target!.author?.user?.login ?? r.target!.author?.name ?? "",
        ahead: r.compare?.behindBy ?? 0,
        behind: r.compare?.aheadBy ?? 0,
        merged: !pr && r.vsDev?.behindBy === 0,
        pr: pr
          ? { number: pr.number, url: pr.url, draft: pr.isDraft, review: reviewState(pr.reviewDecision), checks: checkState(pr.commits) }
          : null,
      };
    });

  return { contextId: ctx.id, repo: fullName, defaultBranch, integrationBranch, url: head.repository.url, branches };
}

async function fetchBranches(ctx: Context): Promise<RepoBranches[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("provider", `provider:${ctx.id}`);

  const token = readToken("github", ctx.githubTokenEnv);
  return Promise.all(ctx.githubRepos.map((repo) => fetchRepoBranches(token, ctx, repo)));
}

export const github: Provider = {
  source: "github",
  enabled: (ctx) => Boolean(ctx.githubOwner || ctx.githubRepos.length),
  identify,
  fetchItems,
  fetchBranches,
};
