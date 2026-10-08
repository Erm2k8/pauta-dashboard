import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from ".";

/** Controle segmentado baseado em links (filtros na URL). */
export function Segmented({ options }: { options: { href: string; label: ReactNode; active: boolean; count?: number }[] }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-line bg-surface p-0.5">
      {options.map((o, i) => (
        <Link
          key={i}
          href={o.href}
          scroll={false}
          aria-current={o.active ? "true" : undefined}
          className={cx(
            "inline-flex h-7 items-center gap-1.5 rounded-md px-3 text-[13px] transition-[background-color,color,box-shadow] duration-150",
            o.active ? "bg-surface-3 text-fg shadow-sm shadow-black/30" : "text-fg-3 hover:bg-surface-2 hover:text-fg",
          )}
        >
          {o.label}
          {o.count !== undefined && <span className="font-mono text-[11px] tabular-nums text-fg-3">{o.count}</span>}
        </Link>
      ))}
    </div>
  );
}
