/**
 * Cria/atualiza contextos a partir de um JSON. Idempotente: rodar de novo sobrescreve os mesmos ids.
 *   npm run db:seed                      (lê contexts.local.json, ignorado pelo git)
 *   npm run db:seed -- outro-arquivo.json
 * Formato: veja contexts.example.json. Em produção, rode com DATABASE_URL/DATABASE_AUTH_TOKEN do Turso.
 */
import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@libsql/client";

interface SeedContext {
  id: string;
  name: string;
  color: string;
  position?: number;
  githubOwner?: string | null;
  githubRepos?: string[];
  githubTokenEnv?: string | null;
  planeWorkspace?: string | null;
  planeProjects?: string[];
  planeTokenEnv?: string | null;
}

const file = process.argv[2] ?? "contexts.local.json";
if (!existsSync(file)) {
  console.error(`Arquivo ${file} não encontrado. Copie contexts.example.json para contexts.local.json e ajuste.`);
  process.exit(1);
}
const contexts = JSON.parse(readFileSync(file, "utf8")) as SeedContext[];

const db = createClient({
  url: process.env.DATABASE_URL ?? "file:local.db",
  authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
});

for (const [i, c] of contexts.entries()) {
  const repos = c.githubRepos ?? [];
  await db.execute({
    sql: `insert into contexts (id, name, color, position, github_owner, github_repos, github_token_env, plane_workspace, plane_projects, plane_token_env)
          values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          on conflict(id) do update set
            name = excluded.name, color = excluded.color, position = excluded.position,
            github_owner = excluded.github_owner, github_repos = excluded.github_repos, github_token_env = excluded.github_token_env,
            plane_workspace = excluded.plane_workspace, plane_projects = excluded.plane_projects, plane_token_env = excluded.plane_token_env`,
    args: [
      c.id,
      c.name,
      c.color,
      c.position ?? i,
      c.githubOwner ?? null,
      JSON.stringify(repos),
      c.githubTokenEnv ?? null,
      c.planeWorkspace ?? null,
      JSON.stringify(c.planeProjects ?? []),
      c.planeTokenEnv ?? null,
    ],
  });
  console.log(`✓ ${c.name} (${repos.length} repos${c.planeWorkspace ? `, plane/${c.planeWorkspace}` : ""})`);
}
