"use server";

import { refresh, updateTag } from "next/cache";
import { requireSession } from "./auth";
import { db, schema } from "./db";
import type { ItemMeta } from "./types";

const DAY = 86_400_000;

function parseUid(uid: string) {
  const i = uid.indexOf(":");
  const source = uid.slice(0, i);
  if (source !== "github" && source !== "plane") throw new Error("uid inválido");
  return { source, externalId: uid.slice(i + 1) };
}

async function patchMeta(uid: string, patch: Partial<ItemMeta>) {
  await requireSession();
  const key = parseUid(uid);
  const values = { ...patch, updatedAt: new Date() };
  await db
    .insert(schema.itemMeta)
    .values({ ...key, ...values })
    .onConflictDoUpdate({ target: [schema.itemMeta.source, schema.itemMeta.externalId], set: values });
  refresh();
}

export async function setPriority(uid: string, priority: ItemMeta["priority"]) {
  await patchMeta(uid, { priority });
}

export async function setFocus(uid: string, focus: ItemMeta["focus"]) {
  await patchMeta(uid, { focus, snoozedUntil: null });
}

export async function snooze(uid: string, days: number | null) {
  await patchMeta(uid, { snoozedUntil: days ? new Date(Date.now() + days * DAY) : null, focus: null });
}

/** Descarta o cache das integrações (todas ou de um contexto). */
export async function refreshProviders(contextId?: string) {
  await requireSession();
  updateTag(contextId ? `provider:${contextId}` : "provider");
}
