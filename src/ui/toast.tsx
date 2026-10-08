"use client";

import { useSyncExternalStore } from "react";
import { cx } from ".";
import { Icon, type IconName } from "./icons";

type Tone = "ok" | "danger" | "info";
interface Toast {
  id: number;
  message: string;
  tone: Tone;
}

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Aviso curto que some sozinho; não bloqueia a tela. */
export function toast(message: string, tone: Tone = "ok") {
  const id = nextId++;
  toasts = [...toasts.slice(-2), { id, message, tone }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 2800);
}

const ICON: Record<Tone, IconName> = { ok: "check", danger: "alertCircle", info: "refresh" };
const COLOR: Record<Tone, string> = { ok: "text-ok", danger: "text-danger", info: "text-accent" };

export function Toaster() {
  const list = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => toasts,
    () => toasts,
  );
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {list.map((t) => (
        <div
          key={t.id}
          className="flex animate-toast items-center gap-2 rounded-lg border border-line-strong bg-surface-2 px-3 py-2 text-fg shadow-lg shadow-black/40"
        >
          <Icon name={ICON[t.tone]} size={13} strokeWidth={2.25} className={cx(COLOR[t.tone])} />
          {t.message}
        </div>
      ))}
    </div>
  );
}
