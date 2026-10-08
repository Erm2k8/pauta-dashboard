"use client";

import { useOptimistic, useTransition } from "react";
import { setFocus, setPriority, snooze } from "@/core/actions";
import type { Item, ItemMeta, Label, Person, Priority } from "@/core/types";
import { cx, Dot, priorityLabel, PrSignals, Signal } from "@/ui";
import { ago, due } from "@/ui/format";
import { Icon, PriorityGlyph, StateIcon } from "@/ui/icons";
import { MenuItem, MenuLabel, MenuSeparator, Popover } from "@/ui/popover";
import { toast } from "@/ui/toast";

export type RowContext = { id: string; name: string; color: string };

const PRIORITIES: Priority[] = [0, 1, 2, 3, null];
const MAX_LABELS = 3;

/** Cores dos tipos de issue do GitHub (vêm como nome). */
const TYPE_COLORS: Record<string, string> = {
  RED: "#f25a61",
  ORANGE: "#e0795a",
  YELLOW: "#d8b04a",
  GREEN: "#46c287",
  BLUE: "#5b9cf5",
  PURPLE: "#a68bff",
  PINK: "#d070a8",
  GRAY: "#9a9aa3",
};

function KindIcon({ item }: { item: Item }) {
  if (item.kind === "review")
    return (
      <span data-tip="Review solicitada a você" className="text-warn">
        <Icon name="eye" size={16} />
      </span>
    );
  if (item.kind === "pr")
    return (
      <span data-tip={item.draft ? "Pull request (rascunho)" : "Pull request aberto"} className={item.draft ? "text-fg-3" : "text-ok"}>
        <Icon name="pr" size={16} />
      </span>
    );
  if (item.kind === "issue")
    return (
      <span data-tip={item.assignees.length ? "Issue aberta" : "Issue aberta, sem responsável"} className={item.assignees.length ? "text-ok" : "text-fg-3"}>
        <Icon name="issue" size={16} />
      </span>
    );
  return (
    <span data-tip={item.status}>
      <StateIcon group={item.stateGroup} size={16} />
    </span>
  );
}

function LabelChip({ label }: { label: Label }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-fg-2">
      <span className="size-2 shrink-0 rounded-full" style={{ background: `#${label.color}` }} />
      {label.name}
    </span>
  );
}

function Avatars({ people }: { people: Person[] }) {
  if (!people.length)
    return (
      <span data-tip="Sem responsável" className="grid size-6 place-items-center rounded-full border border-dashed border-line-strong text-fg-3">
        <Icon name="user" size={12} />
      </span>
    );
  const shown = people.slice(0, 3);
  return (
    <span className="flex -space-x-1.5" data-tip={people.map((p) => p.login).join(", ")}>
      {shown.map((p) =>
        p.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar pequeno de domínio externo, sem otimização
          <img key={p.login} src={p.avatarUrl} alt={p.login} width={24} height={24} className="size-6 rounded-full border-2 border-bg bg-surface-3" />
        ) : (
          <span key={p.login} className="grid size-6 place-items-center rounded-full border-2 border-bg bg-surface-3 text-[11px] font-medium uppercase text-fg-2">
            {p.login.slice(0, 1)}
          </span>
        ),
      )}
      {people.length > shown.length && (
        <span className="grid size-6 place-items-center rounded-full border-2 border-bg bg-surface-3 text-[11px] text-fg-2">+{people.length - shown.length}</span>
      )}
    </span>
  );
}

const iconButton = (active = false) =>
  cx(
    "grid size-8 place-items-center rounded-md transition-[background-color,color,opacity,transform] duration-150 active:scale-90",
    active ? "text-accent hover:bg-accent/10" : "text-fg-3 hover:bg-surface-3 hover:text-fg",
  );

export function ItemRow({ item, context, now, index = 0 }: { item: Item; context?: RowContext; now: number; index?: number }) {
  const [pending, start] = useTransition();
  const [meta, patch] = useOptimistic(item.meta, (cur: ItemMeta, next: Partial<ItemMeta>) => ({ ...cur, ...next }));
  const priority = meta.priority ?? item.sourcePriority;
  const d = item.dueDate ? due(item.dueDate, now) : null;
  const snoozed = Boolean(meta.snoozedUntil && new Date(meta.snoozedUntil).getTime() > now);
  const typeColor = item.issueType ? (TYPE_COLORS[item.issueType.color] ?? "#9a9aa3") : null;

  const run = (next: Partial<ItemMeta>, action: () => Promise<void>, message: string) =>
    start(async () => {
      patch(next);
      try {
        await action();
        toast(message);
      } catch {
        toast("Não foi possível salvar. Tente de novo.", "danger");
      }
    });

  const choosePriority = (p: Priority) =>
    run({ priority: p }, () => setPriority(item.uid, p), p === null ? "Prioridade volta a seguir a fonte" : `Prioridade: ${priorityLabel(p)}`);
  const toggleFocus = (f: "today" | "week") =>
    run(
      { focus: meta.focus === f ? null : f, snoozedUntil: null },
      () => setFocus(item.uid, meta.focus === f ? null : f),
      meta.focus === f ? "Removido do planejamento" : f === "today" ? "Planejado para hoje" : "Planejado para esta semana",
    );
  const doSnooze = (days: number | null) =>
    run(
      { snoozedUntil: days ? new Date(now + days * 86_400_000) : null, focus: null },
      () => snooze(item.uid, days),
      days ? `Adiado por ${days === 1 ? "1 dia" : "1 semana"}` : "Item reativado",
    );

  return (
    <li
      aria-busy={pending}
      style={{ animationDelay: `${Math.min(index, 14) * 18}ms` }}
      className={cx(
        "group relative flex animate-enter items-center gap-3 rounded-lg py-2 pl-1.5 pr-2 transition-colors hover:bg-surface has-[[aria-expanded=true]]:z-20 has-[[aria-expanded=true]]:bg-surface",
        meta.focus === "today" && "bg-accent/[0.05]",
        pending && "opacity-70",
      )}
    >
      {meta.focus === "today" && <span className="absolute inset-y-2.5 left-0 w-[3px] rounded-full bg-accent" aria-hidden />}

      <Popover
        label={`Prioridade: ${priorityLabel(priority)}`}
        align="left"
        trigger={<PriorityGlyph value={priority} size={16} />}
        triggerClassName={(open) => cx(iconButton(), "self-start", open && "bg-surface-3")}
      >
        {(close) => (
          <>
            <MenuLabel>Prioridade</MenuLabel>
            {PRIORITIES.map((p) => (
              <MenuItem
                key={String(p)}
                active={meta.priority === p && p !== null}
                icon={<PriorityGlyph value={p} />}
                hint={p === null && item.sourcePriority !== null ? `fonte: P${item.sourcePriority}` : undefined}
                onSelect={() => {
                  close();
                  choosePriority(p);
                }}
              >
                {p === null ? "Automática (da fonte)" : priorityLabel(p)}
              </MenuItem>
            ))}
          </>
        )}
      </Popover>

      <span className="self-start pt-1.5">
        <KindIcon item={item} />
      </span>

      <div className="min-w-0 flex-1">
        <a href={item.url} target="_blank" rel="noreferrer" className="group/link flex min-w-0 items-center gap-1.5 text-[14.5px] leading-snug text-fg transition-colors hover:text-white">
          <span className="truncate">{item.title}</span>
          <Icon name="external" size={12} className="shrink-0 -translate-x-1 text-fg-3 opacity-0 transition-all duration-150 group-hover/link:translate-x-0 group-hover/link:opacity-100" />
        </a>

        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3.5 gap-y-1 text-[12.5px] text-fg-3">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap" title={item.container}>
            {context && <Dot color={context.color} size={7} />}
            <Icon name={item.source === "github" ? "github" : "send"} size={12} />
            <span className="font-mono text-[12px]">{item.key}</span>
          </span>

          {item.issueType && typeColor && (
            <span className="inline-flex items-center gap-1 whitespace-nowrap font-medium" style={{ color: typeColor }}>
              {item.issueType.name}
            </span>
          )}
          {item.source === "plane" && <span className="whitespace-nowrap text-fg-2">{item.status}</span>}

          {item.labels.slice(0, MAX_LABELS).map((l) => (
            <LabelChip key={l.name} label={l} />
          ))}
          {item.labels.length > MAX_LABELS && (
            <span data-tip={item.labels.slice(MAX_LABELS).map((l) => l.name).join(", ")}>+{item.labels.length - MAX_LABELS}</span>
          )}

          {item.milestone &&
            (item.milestone.url ? (
              <a
                href={item.milestone.url}
                target="_blank"
                rel="noreferrer"
                data-tip="Sprint / milestone"
                className="inline-flex items-center gap-1 whitespace-nowrap text-fg-2 transition-colors hover:text-fg"
              >
                <Icon name="flag" size={12} />
                {item.milestone.title}
              </a>
            ) : (
              <span data-tip="Ciclo atual" className="inline-flex items-center gap-1 whitespace-nowrap text-fg-2">
                <Icon name="flag" size={12} />
                {item.milestone.title}
              </span>
            ))}

          {d && (
            <Signal icon="calendar" tone={d.tone === "muted" ? "muted" : d.tone} tip={`Prazo: ${new Date(item.dueDate!).toLocaleDateString("pt-BR", { timeZone: "UTC" })}`}>
              {d.label}
            </Signal>
          )}
          {item.subIssues && (
            <Signal icon="subtasks" tone={item.subIssues.completed === item.subIssues.total ? "ok" : "muted"} tip="Sub-issues concluídas">
              {item.subIssues.completed}/{item.subIssues.total}
            </Signal>
          )}
          {!!item.comments && (
            <Signal icon="message" tip={`${item.comments} comentários`}>
              {item.comments}
            </Signal>
          )}
          <PrSignals draft={item.draft} review={item.review} checks={item.checks} />
          {snoozed && meta.snoozedUntil && (
            <Signal icon="moon" tip="Adiado">
              até {new Date(meta.snoozedUntil).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
            </Signal>
          )}
          {meta.focus === "week" && (
            <Signal icon="calendarWeek" tone="accent" tip="Planejado para esta semana">
              semana
            </Signal>
          )}
        </div>
      </div>

      <Avatars people={item.assignees} />
      <span className="w-10 shrink-0 text-right text-[12.5px] tabular-nums text-fg-3" title={`Atualizado em ${new Date(item.updatedAt).toLocaleString("pt-BR")}`}>
        {ago(item.updatedAt, now)}
      </span>

      <div className={cx("flex items-center transition-opacity duration-150", meta.focus === "today" ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100")}>
        <button
          type="button"
          data-tip={meta.focus === "today" ? "Tirar de hoje" : "Planejar para hoje"}
          aria-pressed={meta.focus === "today"}
          onClick={() => toggleFocus("today")}
          className={iconButton(meta.focus === "today")}
        >
          <Icon name="target" size={16} />
        </button>
        <Popover label="Mais ações" trigger={<Icon name="more" size={16} />} triggerClassName={(open) => cx(iconButton(), open && "bg-surface-3 text-fg")}>
          {(close) => (
            <>
              <MenuLabel>Planejar</MenuLabel>
              <MenuItem active={meta.focus === "today"} icon={<Icon name="target" />} onSelect={() => (close(), toggleFocus("today"))}>
                Hoje
              </MenuItem>
              <MenuItem active={meta.focus === "week"} icon={<Icon name="calendarWeek" />} onSelect={() => (close(), toggleFocus("week"))}>
                Esta semana
              </MenuItem>
              <MenuSeparator />
              {snoozed ? (
                <MenuItem icon={<Icon name="refresh" />} onSelect={() => (close(), doSnooze(null))}>
                  Reativar agora
                </MenuItem>
              ) : (
                <>
                  <MenuItem icon={<Icon name="moon" />} hint="1 dia" onSelect={() => (close(), doSnooze(1))}>
                    Adiar até amanhã
                  </MenuItem>
                  <MenuItem icon={<Icon name="moon" />} hint="7 dias" onSelect={() => (close(), doSnooze(7))}>
                    Adiar 1 semana
                  </MenuItem>
                </>
              )}
              <MenuSeparator />
              <MenuItem icon={<Icon name="external" />} onSelect={() => (close(), window.open(item.url, "_blank", "noopener"))}>
                Abrir no {item.source === "github" ? "GitHub" : "Plane"}
              </MenuItem>
            </>
          )}
        </Popover>
      </div>
    </li>
  );
}
