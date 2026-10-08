"use client";

import { useActionState } from "react";
import { login } from "@/core/auth";
import { button } from "@/ui";
import { Icon } from "@/ui/icons";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="space-y-3">
      <label htmlFor="password" className="block text-[13px] text-fg-2">
        Senha
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoFocus
        required
        autoComplete="current-password"
        aria-invalid={Boolean(state.error)}
        aria-describedby={state.error ? "login-error" : undefined}
        className="w-full"
      />
      <button disabled={pending} className={button({ variant: "primary", className: "w-full" })}>
        {pending ? <Icon name="refresh" className="animate-spin" /> : <Icon name="arrowRight" strokeWidth={2.25} />}
        {pending ? "Entrando…" : "Entrar"}
      </button>
      {state.error && (
        <p id="login-error" role="alert" className="flex items-center gap-1.5 text-danger animate-enter">
          <Icon name="alertCircle" size={13} />
          {state.error}
        </p>
      )}
    </form>
  );
}
