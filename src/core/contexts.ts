import "server-only";
import { asc } from "drizzle-orm";
import { db, schema } from "./db";
import type { Context } from "./types";

export async function listContexts(): Promise<Context[]> {
  const rows = await db.select().from(schema.contexts).orderBy(asc(schema.contexts.position), asc(schema.contexts.createdAt));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    color: r.color,
    position: r.position,
    githubTokenEnv: r.githubTokenEnv,
    githubOwner: r.githubOwner,
    githubRepos: r.githubRepos,
    planeTokenEnv: r.planeTokenEnv,
    planeWorkspace: r.planeWorkspace,
    planeProjects: r.planeProjects,
  }));
}

/** `ctx` vem da URL (`?ctx=`); ausente ou desconhecido = todos. */
export function pickContexts(all: Context[], ctx: string | undefined) {
  const match = all.filter((c) => c.id === ctx);
  return match.length ? match : all;
}
