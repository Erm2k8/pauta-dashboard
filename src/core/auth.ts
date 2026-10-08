"use server";

import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { errorText } from "./errors";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession } from "./session";

/** Chamado no início de toda Server Action — o proxy não protege actions sozinho. */
export async function requireSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await verifySession(token))) redirect("/login");
}

export async function login(_prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected) return { error: "DASHBOARD_PASSWORD não configurada." };

  const given = Buffer.from(String(formData.get("password") ?? ""));
  const target = Buffer.from(expected);
  const ok = given.length === target.length && timingSafeEqual(given, target);
  if (!ok) return { error: "Senha incorreta." };

  let token: string;
  try {
    token = await signSession();
  } catch (e) {
    return { error: errorText(e) };
  }

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect("/");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
