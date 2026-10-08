import Link from "next/link";
import { loadItems } from "@/core/items";
import type { Context, Item } from "@/core/types";
import { ItemList } from "@/modules/tasks/item-list";
import { buildClaudePrompt } from "./claude-prompt";
import { CopyPrompt } from "./copy-prompt";
import { button, Dot, Empty, Errors, Page, Section } from "@/ui";
import { due } from "@/ui/format";
import { Icon } from "@/ui/icons";

const SUGGESTIONS = 8;

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

function Summary({ contexts, items, now }: { contexts: Context[]; items: Item[]; now: number }) {
  if (contexts.length < 2) return null;
  return (
    <div className="mb-8 grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-2 animate-enter">
      {contexts.map((c) => {
        const open = items.filter((i) => i.contextId === c.id);
        const mine = open.filter((i) => i.mine);
        const urgent = mine.filter((i) => i.priority !== null && i.priority <= 1).length;
        const reviews = mine.filter((i) => i.kind === "review").length;
        const overdue = mine.filter((i) => i.dueDate && due(i.dueDate, now).tone === "danger").length;
        return (
          <Link
            key={c.id}
            href={`/tasks?ctx=${c.id}`}
            className="group rounded-lg border border-line bg-surface px-3.5 py-3 transition-[border-color,background-color,transform] duration-150 hover:-translate-y-px hover:border-line-strong hover:bg-surface-2"
          >
            <div className="flex items-center gap-2">
              <Dot color={c.color} />
              <span className="truncate font-medium">{c.name}</span>
              <Icon name="arrowRight" size={12} className="ml-auto -translate-x-1 text-fg-3 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-[20px] font-medium leading-none tabular-nums">{mine.length}</span>
              <span className="text-[13px] text-fg-3">
                {plural(mine.length, "sua", "suas")} · {open.length} {plural(open.length, "aberta", "abertas")} no total
              </span>
            </div>
            <div className="mt-2 flex gap-3 text-[12px] tabular-nums">
              <span className={urgent ? "text-warn" : "text-fg-3"}>{urgent} {plural(urgent, "urgente", "urgentes")}</span>
              <span className={reviews ? "text-fg-2" : "text-fg-3"}>{reviews} {plural(reviews, "review", "reviews")}</span>
              {overdue > 0 && <span className="text-danger">{overdue} {plural(overdue, "atrasada", "atrasadas")}</span>}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export async function TodayView({ ctx }: { ctx?: string }) {
  const { contexts, selected, items, errors, now } = await loadItems(ctx);
  const byId = new Map(contexts.map((c) => [c.id, c]));

  if (!contexts.length) {
    return (
      <Page>
        <Empty icon="layers" title="Nenhum contexto configurado">
          <p className="mb-4">Um contexto liga uma empresa ou projeto às suas chaves do GitHub e do Plane.</p>
          <Link href="/contexts" className={button({ variant: "primary" })}>
            <Icon name="plus" strokeWidth={2.25} />
            Criar primeiro contexto
          </Link>
        </Empty>
      </Page>
    );
  }

  const active = items.filter((i) => !i.snoozed);
  const today = active.filter((i) => i.meta.focus === "today");
  const week = active.filter((i) => i.meta.focus === "week");
  const reviews = active.filter((i) => i.kind === "review" && !i.meta.focus);
  const suggested = active.filter((i) => i.mine && !i.meta.focus && i.kind !== "review").slice(0, SUGGESTIONS);
  // Issues sem responsável em sprints que vencem em até 14 dias: candidatas a você pegar.
  const unassigned = active
    .filter((i) => !i.assignees.length && !i.meta.focus && i.milestone?.dueOn && new Date(i.milestone.dueOn).getTime() - now < 14 * 86_400_000)
    .slice(0, 6);

  return (
    <Page>
      <Errors errors={errors} names={new Map(contexts.map((c) => [c.id, c.name]))} />
      <div className="mb-4 flex justify-end">
        <CopyPrompt prompt={buildClaudePrompt(active, new Map(contexts.map((c) => [c.id, c.name])), now)} />
      </div>
      <Summary contexts={selected} items={active} now={now} />

      <Section title="Foco de hoje" icon={<Icon name="target" size={12} className="text-accent" />} count={today.length}>
        {today.length ? (
          <ItemList items={today} contexts={byId} now={now} />
        ) : (
          <Empty icon="target" title="Nada planejado para hoje">
            Passe o mouse num item e clique em <Icon name="target" size={12} className="inline align-[-2px] text-accent" /> para trazê-lo para cá.
          </Empty>
        )}
      </Section>

      {reviews.length > 0 && (
        <Section title="Aguardando sua review" icon={<Icon name="eye" size={12} className="text-warn" />} count={reviews.length}>
          <ItemList items={reviews} contexts={byId} now={now} />
        </Section>
      )}

      <Section
        title="Sugeridos"
        icon={<Icon name="sun" size={12} />}
        aside={
          <Link href={ctx ? `/tasks?ctx=${ctx}` : "/tasks"} className={button({ variant: "ghost", size: "sm" })}>
            Ver todas ({active.filter((i) => i.mine).length} suas)
            <Icon name="arrowRight" size={12} />
          </Link>
        }
      >
        {suggested.length ? (
          <ItemList items={suggested} contexts={byId} now={now} />
        ) : (
          <Empty icon="checkCircle" title="Tudo em dia">
            Nenhuma tarefa aberta atribuída a você.
          </Empty>
        )}
      </Section>

      {unassigned.length > 0 && (
        <Section title="Sem responsável na sprint" icon={<Icon name="flag" size={12} />} count={unassigned.length}>
          <ItemList items={unassigned} contexts={byId} now={now} />
        </Section>
      )}

      {week.length > 0 && (
        <Section title="Esta semana" icon={<Icon name="calendarWeek" size={12} />} count={week.length}>
          <ItemList items={week} contexts={byId} now={now} />
        </Section>
      )}
    </Page>
  );
}
