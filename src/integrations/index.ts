import "server-only";
import { tokenEnvName } from "@/core/env";
import { errorText } from "@/core/errors";
import type { Context, ProviderError, ProviderResult, RepoBranches, Source, WorkItem } from "@/core/types";
import { demo } from "./demo";
import { github } from "./github";
import { plane } from "./plane";
import type { Provider } from "./types";

/** Registro de integrações. `DEMO_DATA=1` troca tudo por dados fictícios. */
export const providers: Provider[] = process.env.DEMO_DATA === "1" ? [demo] : [github, plane];

/** Falha de uma fonte vira erro listado, nunca derruba a página. */
async function collect<T>(
  contexts: Context[],
  run: (p: Provider, ctx: Context) => Promise<T[]> | null,
): Promise<ProviderResult<T>> {
  const jobs = contexts.flatMap((ctx) =>
    providers.flatMap((p) => {
      if (!p.enabled(ctx)) return [];
      const job = run(p, ctx);
      if (!job) return [];
      return [
        job.then(
          (data) => ({ data, error: null }),
          (e: unknown) => ({ data: [] as T[], error: { contextId: ctx.id, source: p.source, message: errorText(e) } as ProviderError }),
        ),
      ];
    }),
  );
  const settled = await Promise.all(jobs);
  return {
    data: settled.flatMap((s) => s.data),
    errors: settled.flatMap((s) => (s.error ? [s.error] : [])),
  };
}

export function fetchAllItems(contexts: Context[]): Promise<ProviderResult<WorkItem>> {
  return collect(contexts, (p, ctx) => p.fetchItems(ctx));
}

export function fetchAllBranches(contexts: Context[]): Promise<ProviderResult<RepoBranches>> {
  return collect(contexts, (p, ctx) => (p.fetchBranches && (ctx.githubRepos.length || p === demo) ? p.fetchBranches(ctx) : null));
}

export interface ConnectionStatus {
  source: Source;
  tokenEnv: string;
  ok: boolean;
  account?: string;
  items?: number;
  error?: string;
}

/** Diagnóstico por contexto: qual chave, de quem é, quantos itens vieram. */
export async function checkConnection(ctx: Context): Promise<ConnectionStatus[]> {
  return Promise.all(
    providers
      .filter((p) => p.enabled(ctx))
      .map(async (p) => {
        const tokenEnv = tokenEnvName(p.source, p.source === "github" ? ctx.githubTokenEnv : ctx.planeTokenEnv);
        try {
          const [account, items] = await Promise.all([p.identify(ctx), p.fetchItems(ctx)]);
          return { source: p.source, tokenEnv, ok: true, account, items: items.length };
        } catch (e) {
          return { source: p.source, tokenEnv, ok: false, error: errorText(e) };
        }
      }),
  );
}
