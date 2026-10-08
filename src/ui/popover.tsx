"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cx } from ".";

/** Menu suspenso: abre no clique, fecha com Esc ou clique fora, anima ao abrir. */
export function Popover({
  trigger,
  label,
  align = "right",
  triggerClassName,
  children,
}: {
  trigger: ReactNode;
  label: string;
  align?: "left" | "right";
  triggerClassName?: (open: boolean) => string;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button type="button" aria-label={label} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((o) => !o)} className={triggerClassName?.(open)}>
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={cx(
            "absolute top-[calc(100%+4px)] z-30 min-w-60 animate-pop rounded-lg border border-line-strong bg-surface-2 p-1 shadow-xl shadow-black/50",
            align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left",
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  onSelect,
  active,
  icon,
  hint,
  children,
}: {
  onSelect: () => void;
  active?: boolean;
  icon?: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      className={cx(
        "flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-left transition-colors hover:bg-surface-3 focus-visible:bg-surface-3",
        active ? "text-fg" : "text-fg-2 hover:text-fg",
      )}
    >
      <span className="grid w-4 place-items-center">{icon}</span>
      <span className="flex-1">{children}</span>
      {active ? <span className="text-accent">✓</span> : hint && <span className="text-[12px] text-fg-3">{hint}</span>}
    </button>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <p className="px-2 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-fg-3">{children}</p>;
}

export function MenuSeparator() {
  return <div className="my-1 h-px bg-line" />;
}
