import type { Branch } from "@/core/types";
import { cx, Dot, Empty, Errors, Page, PrSignals, Section, Signal } from "@/ui";
import { ago, daysSince } from "@/ui/format";
import { FilterBar } from "@/ui/filter-bar";
import { Icon } from "@/ui/icons";
import { Segmented } from "@/ui/segmented";
import { loadBranches } from "./data";

/** Sem commits há mais que isso = branch parada. */
const STALE_DAYS = 14;
/** Atrás da base mais que isso = risco de conflito. */
const BEHIND_WARN = 20;

function BranchRow({ branch, now, index }: { branch: Branch; now: number; index: number }) {
  const stale = daysSince(branch.lastCommitAt, now) > STALE_DAYS;
  return (
    <li
      style={{ animationDelay: `${Math.min(index, 14) * 18}ms` }}
      className="group flex h-11 animate-enter items-center gap-3 rounded-md px-2 transition-colors hover:bg-surface"
    >
      <Icon name="branch" className={branch.pr ? "text-ok" : "text-fg-3"} />
      <a
        href={branch.url}
        target="_blank"
        rel="noreferrer"
        className="group/link flex w-64 shrink-0 items-center gap-1.5 font-mono text-[13px] text-fg transition-colors hover:text-white"
      >
        <span className="truncate">{branch.name}</span>
        <Icon name="external" size={11} className="shrink-0 -translate-x-1 text-fg-3 opacity-0 transition-all group-hover/link:translate-x-0 group-hover/link:opacity-100" />
      </a>
      <span className="flex w-20 shrink-0 gap-2 font-mono text-[12px] tabular-nums">
        <span data-tip={`${branch.ahead} commits à frente da base`} className={branch.ahead ? "text-ok" : "text-fg-3/50"}>
          ↑{branch.ahead}
        </span>
        <span
          data-tip={`${branch.behind} commits atrás da base${branch.behind > BEHIND_WARN ? ", considere atualizar" : ""}`}
          className={branch.behind > BEHIND_WARN ? "text-warn" : branch.behind ? "text-fg-2" : "text-fg-3/50"}
        >
          ↓{branch.behind}
        </span>
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-1.5 text-fg-3" title={branch.lastCommitMessage}>
        <Icon name="commit" size={12} className="shrink-0" />
        <span className="truncate">{branch.lastCommitMessage}</span>
      </span>
      <div className="flex shrink-0 items-center gap-2.5">
        {branch.pr ? (
          <>
            <a
              href={branch.pr.url}
              target="_blank"
              rel="noreferrer"
              data-tip={branch.pr.draft ? "PR em rascunho" : "Abrir pull request"}
              className={cx(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[12px] transition-colors hover:bg-surface-3",
                branch.pr.draft ? "text-fg-3" : "text-ok",
              )}
            >
              <Icon name="pr" size={12} />#{branch.pr.number}
            </a>
            <PrSignals review={branch.pr.review} checks={branch.pr.checks} />
          </>
        ) : (
          branch.ahead > 0 && (
            <Signal icon="pr" tip="Tem commits mas nenhum PR aberto">
              sem PR
            </Signal>
          )
        )}
      </div>
      <span className="w-20 shrink-0 truncate text-right text-[12px] text-fg-3">{branch.author}</span>
      <span className={cx("flex w-12 shrink-0 items-center justify-end gap-1 text-[12px] tabular-nums", stale ? "text-warn" : "text-fg-3")} data-tip={stale ? `Parada há mais de ${STALE_DAYS} dias` : "Último commit"}>
        {stale && <Icon name="clock" size={11} />}
        {ago(branch.lastCommitAt, now)}
      </span>
    </li>
  );
}

export interface BranchFilters {
  ctx?: string;
  /** `nopr` | `stale` | `merged`; vazio = abertas (sem as já mergeadas em dev). */
  filter?: string;
  q?: string;
  repo?: string;
}

export async function BranchesView({ filters }: { filters: BranchFilters }) {
  const { ctx, filter, q, repo: repoFilter } = filters;
  const { contexts, repos, errors, now } = await loadBranches(ctx);
  const byId = new Map(contexts.map((c) => [c.id, c]));

  const isStale = (b: Branch) => daysSince(b.lastCommitAt, now) > STALE_DAYS;
  const noPr = (b: Branch) => !b.pr && b.ahead > 0;
  const needle = q?.toLowerCase();
  const matchText = (b: Branch) => !needle || `${b.name} ${b.lastCommitMessage} ${b.author}`.toLowerCase().includes(needle);
  const scoped = repos.filter((r) => !repoFilter || r.repo === repoFilter);
  const base = scoped.flatMap((r) => r.branches).filter(matchText);
  const live = base.filter((b) => !b.merged);
  const keep = (b: Branch) =>
    matchText(b) && (filter === "merged" ? b.merged : !b.merged && (filter === "stale" ? isStale(b) : filter === "nopr" ? noPr(b) : true));
  const link = (f?: string) => {
    const p = new URLSearchParams(Object.entries({ ctx, filter: f, q, repo: repoFilter }).filter(([, v]) => v) as [string, string][]);
    return `/branches${p.size ? `?${p}` : ""}`;
  };
  const visibleRepos = scoped.map((r) => ({ repo: r, branches: r.branches.filter(keep) })).filter((r) => r.branches.length || !(q || filter));
  const hiddenRepos = scoped.length - visibleRepos.length;

  return (
    <Page>
      <div className="mb-3 flex items-center gap-2 animate-enter">
        <Segmented
          options={[
            { href: link(), label: "Abertas", active: !filter, count: live.length },
            { href: link("nopr"), label: "Sem PR", active: filter === "nopr", count: live.filter(noPr).length },
            {
              href: link("stale"),
              label: (
                <>
                  <Icon name="clock" size={12} /> Paradas
                </>
              ),
              active: filter === "stale",
              count: live.filter(isStale).length,
            },
            { href: link("merged"), label: "Mergeadas em dev", active: filter === "merged", count: base.length - live.length },
          ]}
        />
      </div>
      <div className="mb-6 animate-enter">
        <FilterBar
          placeholder="Buscar branch, commit ou autor…"
          selects={[{ param: "repo", placeholder: "Todos os repos", options: repos.map((r) => ({ value: r.repo, label: r.repo })) }]}
        />
      </div>

      <Errors errors={errors} names={new Map(contexts.map((c) => [c.id, c.name]))} />

      {repos.length === 0 && (
        <Empty icon="branch" title="Nenhum repositório acompanhado">
          Adicione repositórios (dono/nome) a um contexto para ver as branches abertas aqui.
        </Empty>
      )}

      {visibleRepos.map(({ repo, branches }) => {
        const context = byId.get(repo.contextId);
        const hidden = repo.branches.filter((b) => b.merged).length;
        return (
          <Section
            key={repo.repo}
            title={repo.repo}
            icon={context && <Dot color={context.color} size={7} />}
            count={branches.length}
            aside={
              <span className="flex items-center gap-3 text-[12px] text-fg-3">
                {hidden > 0 && filter !== "merged" && (
                  <a href={link("merged")} className="transition-colors hover:text-fg">
                    {hidden} já em {repo.integrationBranch} ocultas
                  </a>
                )}
                <a href={repo.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 transition-colors hover:text-fg">
                  base <span className="font-mono text-fg-2">{repo.defaultBranch}</span>
                  <Icon name="external" size={11} />
                </a>
              </span>
            }
          >
            {branches.length ? (
              <ul className="space-y-px">
                {branches.map((b, i) => (
                  <BranchRow key={b.name} branch={b} now={now} index={i} />
                ))}
              </ul>
            ) : (
              <p className="px-2 py-3 text-fg-3">Nenhuma branch aberta.</p>
            )}
          </Section>
        );
      })}

      {hiddenRepos > 0 && repos.length > 0 && (
        <p className="px-2 text-[13px] text-fg-3">
          {hiddenRepos} {hiddenRepos === 1 ? "repositório" : "repositórios"} sem branches neste filtro.
        </p>
      )}
    </Page>
  );
}
