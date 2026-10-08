import "server-only";
import { connection } from "next/server";
import { fetchAllItems } from "@/integrations";
import { listContexts, pickContexts } from "./contexts";
import { db, schema } from "./db";
import type { Context, Item, ItemMeta, Priority, ProviderError, WorkItem } from "./types";

const DAY = 86_400_000;
const EMPTY_META: ItemMeta = { priority: null, focus: null, snoozedUntil: null, note: null };
const PRIORITY_WEIGHT = [100, 60, 30, 10] as const;

/**
 * Pontuação para sugerir o que fazer: prioridade manual > da fonte > prazo > review pendente > recência.
 * Ajuste os pesos aqui.
 */
export function score(item: WorkItem, priority: Priority, meta: ItemMeta, now: number) {
  let s = priority === null ? 15 : PRIORITY_WEIGHT[priority];
  if (item.dueDate) {
    const days = (new Date(item.dueDate).getTime() - now) / DAY;
    if (days < 0) s += 80;
    else if (days <= 2) s += 50;
    else if (days <= 7) s += 20;
  }
  if (item.kind === "review") s += 35;
  if (item.kind === "pr" && (item.checks === "failure" || item.review === "changes")) s += 25;
  if (item.started) s += 10;
  // O que é seu vem antes; issue sem responsável ainda merece atenção, a de outra pessoa menos.
  if (item.mine) s += 30;
  else if (item.assignees.length) s -= 20;
  if (item.milestone?.dueOn) {
    const days = (new Date(item.milestone.dueOn).getTime() - now) / DAY;
    if (days >= 0 && days <= 7) s += 10;
  }
  if (now - new Date(item.updatedAt).getTime() < 2 * DAY) s += 10;
  if (meta.focus === "week") s += 20;
  return s;
}

async function loadMeta() {
  const rows = await db.select().from(schema.itemMeta);
  return new Map(
    rows.map((r) => [
      `${r.source}:${r.externalId}`,
      { priority: r.priority as Priority, focus: r.focus, snoozedUntil: r.snoozedUntil, note: r.note } satisfies ItemMeta,
    ]),
  );
}

export interface LoadedItems {
  contexts: Context[];
  selected: Context[];
  items: Item[];
  errors: ProviderError[];
  /** Momento da carga — use no render em vez de Date.now(). */
  now: number;
}

/** Itens de todas as fontes dos contextos selecionados, com a camada local aplicada e ordenados por score. */
export async function loadItems(ctx: string | undefined): Promise<LoadedItems> {
  await connection();
  const contexts = await listContexts();
  const selected = pickContexts(contexts, ctx);
  const [{ data, errors }, meta] = await Promise.all([fetchAllItems(selected), loadMeta()]);
  const now = Date.now();

  const items = data
    .map((w): Item => {
      const m = meta.get(w.uid) ?? EMPTY_META;
      const priority = m.priority ?? w.sourcePriority;
      return {
        ...w,
        meta: m,
        priority,
        score: score(w, priority, m, now),
        snoozed: Boolean(m.snoozedUntil && m.snoozedUntil.getTime() > now),
      };
    })
    .sort((a, b) => b.score - a.score);

  return { contexts, selected, items, errors, now };
}
