import type { Item } from "@/core/types";

const LIMIT = 15;
const DAY = 86_400_000;

function line(item: Item, now: number) {
  const parts = [`${item.key} ${item.title}`, item.status];
  if (item.priority !== null) parts.push(`P${item.priority}`);
  if (item.dueDate) {
    const days = Math.ceil((new Date(item.dueDate).getTime() - now) / DAY);
    parts.push(days < 0 ? `atrasada ${-days}d` : `vence em ${days}d`);
  }
  if (item.kind === "review") parts.push("review pendente");
  if (item.checks === "failure") parts.push("CI falhando");
  if (item.review === "changes") parts.push("alterações solicitadas");
  if (item.milestone) parts.push(item.milestone.title);
  return `- ${parts.join(" · ")}`;
}

/** Prompt para colar no Claude (sem chave de API): top itens por score com os sinais que mudam a decisão. */
export function buildClaudePrompt(items: Item[], contextNames: Map<string, string>, now: number) {
  const open = items.filter((i) => !i.snoozed && (i.mine || i.kind === "review")).slice(0, LIMIT);
  const byContext = new Map<string, Item[]>();
  for (const item of open) byContext.set(item.contextId, [...(byContext.get(item.contextId) ?? []), item]);

  const blocks = [...byContext].map(
    ([id, list]) => `## ${contextNames.get(id) ?? id}\n${list.map((i) => line(i, now)).join("\n")}`,
  );

  return [
    "Você é meu assistente de planejamento. Abaixo está minha pauta (já ordenada por prioridade).",
    "Sugira a ordem de execução de hoje, o que posso adiar e o que está em risco. Seja direto, em português.",
    "",
    blocks.join("\n\n") || "(nenhum item aberto)",
  ].join("\n");
}
