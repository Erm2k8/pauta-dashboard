"use server";

import { eq } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/core/auth";
import { db, schema } from "@/core/db";

export type FormState = { error?: string; ok?: boolean };

const envName = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z][A-Z0-9_]*$/, "Nome de variável inválido (ex.: GITHUB_TOKEN_ACME)")
  .or(z.literal(""))
  .transform((v) => v || null);

const list = z
  .string()
  .transform((v) => v.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean));

const ContextInput = z.object({
  name: z.string().trim().min(1, "Informe um nome").max(40),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  githubTokenEnv: envName,
  githubOwner: z.string().trim().transform((v) => v || null),
  githubRepos: list.pipe(z.array(z.string().regex(/^[\w.-]+\/[\w.-]+$/, "Repos no formato dono/nome"))),
  planeTokenEnv: envName,
  planeWorkspace: z.string().trim().transform((v) => v || null),
  planeProjects: list,
});

function slugify(name: string) {
  return (
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 24) || "ctx"
  );
}

export async function saveContext(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();
  const parsed = ContextInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const id = String(formData.get("id") ?? "");

  if (id) {
    await db.update(schema.contexts).set(parsed.data).where(eq(schema.contexts.id, id));
    updateTag(`provider:${id}`);
  } else {
    const existing = new Set((await db.select({ id: schema.contexts.id }).from(schema.contexts)).map((r) => r.id));
    let newId = slugify(parsed.data.name);
    for (let n = 2; existing.has(newId); n++) newId = `${slugify(parsed.data.name)}-${n}`;
    await db.insert(schema.contexts).values({ id: newId, position: existing.size, ...parsed.data });
  }
  refresh();
  return { ok: true };
}

export async function deleteContext(id: string) {
  await requireSession();
  await db.delete(schema.contexts).where(eq(schema.contexts.id, id));
  refresh();
}
