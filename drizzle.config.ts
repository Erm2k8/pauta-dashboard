import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL || "file:local.db";
const authToken = process.env.DATABASE_AUTH_TOKEN || undefined;
const isFile = url.startsWith("file:");

export default defineConfig({
  schema: "./src/core/db/schema.ts",
  out: "./drizzle",
  ...(isFile
    ? { dialect: "sqlite" as const, dbCredentials: { url } }
    : { dialect: "turso" as const, dbCredentials: { url, authToken } }),
});
