import "server-only";
import { connection } from "next/server";
import { listContexts, pickContexts } from "@/core/contexts";
import { fetchAllBranches } from "@/integrations";

export async function loadBranches(ctx: string | undefined) {
  await connection();
  const contexts = await listContexts();
  const { data: repos, errors } = await fetchAllBranches(pickContexts(contexts, ctx));
  return { contexts, repos, errors, now: Date.now() };
}
