import "server-only";
import { tokenEnvName } from "@/core/env";
import type { Context, ProviderError, ProviderResult, RepoBranches, Source, WorkItem } from "@/core/types";
import { demo } from "./demo";
import { github } from "./github";
import { plane } from "./plane";
import type { Provider } from "./types";

/** Registro de integrações. `DEMO_DATA=1` troca tudo por dados fictícios. */
export const providers: Provider[] = process.env.DEMO_DATA === "1" ? [demo] : [github, plane];

/** Traduz erros comuns das APIs em algo acionável. */
function message(e: unknown) {
  const raw = (e instanceof Error ? e.message : String(e)).slice(0, 300);
  if (/SAML|SSO/i.test(raw)) return "a organização exige SSO: autorize a chave em github.com/settings/tokens (Configure SSO)";
  if (/Bad credentials/i.test(raw)) return "chave inválida ou expirada";
  if (/Could not resolve to a Repository/i.test(raw)) return "repositório não encontrado ou sem acesso pela chave";
  if (/not accessible by (personal access|integration)/i.test(raw)) return "a chave não tem permissão para este recurso";
  if (/Plane 40[13]/.test(raw)) return "chave do Plane recusada (confira o workspace e a chave)";
  if (/Plane 404/.test(raw)) return "workspace do Plane não encontrado";
  return raw.slice(0, 200);
}

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
          (e: unknown) => ({ data: [] as T[], error: { contextId: ctx.id, source: p.source, message: message(e) } as ProviderError }),
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
          return { source: p.source, tokenEnv, ok: false, error: message(e) };
        }
      }),
  );
}
