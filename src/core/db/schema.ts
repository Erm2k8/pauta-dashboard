import { sql } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const contexts = sqliteTable("contexts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  position: integer("position").notNull().default(0),
  githubTokenEnv: text("github_token_env"),
  githubOwner: text("github_owner"),
  githubRepos: text("github_repos", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  planeTokenEnv: text("plane_token_env"),
  planeWorkspace: text("plane_workspace"),
  planeProjects: text("plane_projects", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

/** Camada local sobre itens externos: prioridade, foco, adiamento e nota. */
export const itemMeta = sqliteTable(
  "item_meta",
  {
    source: text("source").notNull(),
    externalId: text("external_id").notNull(),
    priority: integer("priority"),
    focus: text("focus", { enum: ["today", "week"] }),
    snoozedUntil: integer("snoozed_until", { mode: "timestamp" }),
    note: text("note"),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  },
  (t) => [primaryKey({ columns: [t.source, t.externalId] })],
);

export type ContextRow = typeof contexts.$inferSelect;
export type ItemMetaRow = typeof itemMeta.$inferSelect;
