import type { ReactNode } from "react";
import { loadItems } from "@/core/items";
import type { Item } from "@/core/types";
import { Empty, Errors, Page, Section } from "@/ui";
import { due } from "@/ui/format";
import { Icon, PriorityGlyph } from "@/ui/icons";
import { Segmented } from "@/ui/segmented";
import { ItemList } from "./item-list";

export interface TaskFilters {
  ctx?: string;
  source?: string;
  group?: string;
  show?: string;
  /** `mine` = suas; `unassigned` = sem responsável; vazio = todas. */
  who?: string;
}

const PRIORITY_GROUPS = ["P0 · Urgente", "P1 · Alta", "P2 · Média", "P3 · Baixa"];
const NO_PRIORITY = "Sem prioridade";
const NO_SPRINT = "Sem sprint";

function href(filters: TaskFilters, patch: Partial<TaskFilters>) {
  const params = new URLSearchParams(Object.entries({ ...filters, ...patch }).filter(([, v]) => v) as [string, string][]);
  return `/tasks${params.size ? `?${params}` : ""}`;
}

interface Group {
  title: string;
  items: Item[];
  icon?: ReactNode;
  /** Ordenação: menor primeiro. */
  order: number | string;
  dueOn?: string | null;
}

function groupItems(items: Item[], group: string | undefined, names: Map<string, string>): Group[] {
  const groups = new Map<string, Group>();
  for (const item of items) {
    let g: Omit<Group, "items">;
    if (group === "sprint") {
      const m = item.milestone;
      g = m
        ? { title: m.title, order: m.dueOn ?? "9999", dueOn: m.dueOn, icon: <Icon name="flag" size={12} /> }
        : { title: NO_SPRINT, order: "~", icon: <Icon name="flag" size={12} className="opacity-40" /> };
    } else if (group === "context") {
      g = { title: names.get(item.contextId) ?? "Sem contexto", order: names.get(item.contextId) ?? "~" };
    } else if (group === "container") {
      g = { title: item.container, order: item.container };
    } else {
      g = {
        title: item.priority === null ? NO_PRIORITY : PRIORITY_GROUPS[item.priority],
        order: item.priority ?? 9,
        icon: <PriorityGlyph value={item.priority} size={12} />,
      };
    }
    const entry = groups.get(g.title) ?? { ...g, items: [] };
    entry.items.push(item);
    groups.set(g.title, entry);
  }
  return [...groups.values()].sort((a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : 0));
}

export async function TasksView({ filters }: { filters: TaskFilters }) {
  const { contexts, items, errors, now } = await loadItems(filters.ctx);
  const byId = new Map(contexts.map((c) => [c.id, c]));
  const names = new Map(contexts.map((c) => [c.id, c.name]));

  const open = items.filter((i) => !i.snoozed);
  const matchWho = (i: Item) => (filters.who === "mine" ? i.mine : filters.who === "unassigned" ? !i.assignees.length : true);
  const visible = items.filter(
    (i) => matchWho(i) && (!filters.source || i.source === filters.source) && (filters.show === "snoozed" ? i.snoozed : !i.snoozed),
  );
  const groups = groupItems(visible, filters.group, names);

  return (
    <Page>
      <div className="mb-3 flex flex-wrap items-center gap-2 animate-enter">
        <Segmented
          options={[
            { href: href(filters, { who: undefined }), label: "Todas abertas", active: !filters.who, count: open.length },
            {
              href: href(filters, { who: "mine" }),
              label: (
                <>
                  <Icon name="user" size={13} /> Minhas
                </>
              ),
              active: filters.who === "mine",
              count: open.filter((i) => i.mine).length,
            },
            {
              href: href(filters, { who: "unassigned" }),
              label: "Sem responsável",
              active: filters.who === "unassigned",
              count: open.filter((i) => !i.assignees.length).length,
            },
          ]}
        />
        <Segmented
          options={[
            { href: href(filters, { source: undefined }), label: "Todas as fontes", active: !filters.source },
            {
              href: href(filters, { source: "github" }),
              label: (
                <>
                  <Icon name="github" size={13} /> GitHub
                </>
              ),
              active: filters.source === "github",
              count: open.filter((i) => i.source === "github" && matchWho(i)).length,
            },
            {
              href: href(filters, { source: "plane" }),
              label: (
                <>
                  <Icon name="send" size={13} /> Plane
                </>
              ),
              active: filters.source === "plane",
              count: open.filter((i) => i.source === "plane" && matchWho(i)).length,
            },
          ]}
        />
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-2 animate-enter">
        <span className="mr-1 text-[13px] text-fg-3">Agrupar</span>
        <Segmented
          options={[
            { href: href(filters, { group: undefined }), label: "Prioridade", active: !filters.group },
            { href: href(filters, { group: "sprint" }), label: "Sprint / milestone", active: filters.group === "sprint" },
            { href: href(filters, { group: "context" }), label: "Contexto", active: filters.group === "context" },
            { href: href(filters, { group: "container" }), label: "Repo / projeto", active: filters.group === "container" },
          ]}
        />
        <div className="ml-auto">
          <Segmented
            options={[
              { href: href(filters, { show: undefined }), label: "Abertas", active: filters.show !== "snoozed" },
              {
                href: href(filters, { show: "snoozed" }),
                label: (
                  <>
                    <Icon name="moon" size={13} /> Adiadas
                  </>
                ),
                active: filters.show === "snoozed",
                count: items.length - open.length,
              },
            ]}
          />
        </div>
      </div>

      <Errors errors={errors} names={names} />

      {groups.length ? (
        groups.map((g) => {
          const d = g.dueOn ? due(g.dueOn, now) : null;
          return (
            <Section
              key={g.title}
              title={g.title}
              count={g.items.length}
              icon={g.icon}
              aside={
                d && (
                  <span className={d.tone === "danger" ? "text-[13px] text-danger" : d.tone === "warn" ? "text-[13px] text-warn" : "text-[13px] text-fg-3"}>
                    prazo {d.label}
                  </span>
                )
              }
            >
              <ItemList items={g.items} contexts={byId} now={now} />
            </Section>
          );
        })
      ) : (
        <Empty icon={filters.show === "snoozed" ? "moon" : "inbox"} title={contexts.length ? "Nada por aqui" : "Configure um contexto para começar"}>
          {contexts.length ? (filters.show === "snoozed" ? "Nenhum item adiado." : "Nenhum item com esses filtros.") : null}
        </Empty>
      )}
    </Page>
  );
}
