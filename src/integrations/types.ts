import type { Context, RepoBranches, Source, WorkItem } from "@/core/types";

/** Contrato de uma integração. Nova fonte (Linear, Jira…) = novo objeto deste tipo em `integrations/index.ts`. */
export interface Provider {
  source: Source;
  enabled(ctx: Context): boolean;
  /** Quem é o dono da chave (ex.: `@login`) — usado no teste de conexão. */
  identify(ctx: Context): Promise<string>;
  fetchItems(ctx: Context): Promise<WorkItem[]>;
  fetchBranches?(ctx: Context): Promise<RepoBranches[]>;
}
