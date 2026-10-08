import { sql } from "drizzle-orm";
import { connection, NextResponse } from "next/server";
import { db, schema } from "@/core/db";
import { describeError } from "@/core/errors";

export async function GET() {
  await connection();
  const checks = {
    password: Boolean(process.env.DASHBOARD_PASSWORD),
    sessionSecret: (process.env.SESSION_SECRET?.length ?? 0) >= 32,
    database: "ok" as "ok" | string,
  };
  try {
    await db.select({ n: sql<number>`count(*)` }).from(schema.contexts);
  } catch (e) {
    checks.database = describeError(e).message;
  }
  const ok = checks.password && checks.sessionSecret && checks.database === "ok";
  return NextResponse.json({ ok, checks }, { status: ok ? 200 : 503 });
}
