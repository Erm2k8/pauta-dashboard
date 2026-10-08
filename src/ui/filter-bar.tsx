"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cx } from ".";
import { Icon } from "./icons";
import { LabelBadge } from "./label-badge";
import { MenuItem, Popover } from "./popover";

export interface FilterSelect {
  param: string;
  /** Texto da opção vazia (ex.: "Todos os repos"). */
  placeholder: string;
  /** `color` (hex sem `#`) mostra a opção como badge de label. */
  options: { value: string; label: string; color?: string }[];
}

/** Busca por texto e selects que gravam os filtros na URL, preservando os demais parâmetros. */
export function FilterBar({ selects = [], placeholder = "Buscar…" }: { selects?: FilterSelect[]; placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="relative">
        <Icon name="search" size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-3" />
        <input
          type="search"
          value={q}
          placeholder={placeholder}
          aria-label="Buscar"
          className="filter-control w-64"
          onChange={(e) => {
            setQ(e.target.value);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => update("q", e.target.value.trim()), 250);
          }}
        />
      </span>
      {selects.map((s) => {
        const current = params.get(s.param) ?? "";
        const selected = s.options.find((o) => o.value === current);
        const show = (o: FilterSelect["options"][number]) => (o.color ? <LabelBadge label={{ name: o.label, color: o.color }} /> : o.label);
        return (
          <Popover
            key={s.param}
            align="left"
            label={s.placeholder}
            triggerClassName={(open) =>
              cx(
                "inline-flex h-8 max-w-56 items-center gap-2 rounded-lg border bg-surface pl-2.5 pr-2 text-[13px] transition-colors hover:border-line-strong",
                open || selected ? "border-line-strong" : "border-line",
                selected ? "text-fg" : "text-fg-3",
              )
            }
            trigger={
              <>
                <span className="truncate">{selected ? show(selected) : s.placeholder}</span>
                <Icon name="chevronDown" size={14} className="shrink-0 text-fg-3" />
              </>
            }
          >
            {(close) => (
              <div className="max-h-72 overflow-y-auto">
                {[{ value: "", label: s.placeholder } as FilterSelect["options"][number], ...s.options].map((o) => (
                  <MenuItem
                    key={o.value}
                    active={o.value === current}
                    onSelect={() => {
                      update(s.param, o.value);
                      close();
                    }}
                  >
                    {show(o)}
                  </MenuItem>
                ))}
              </div>
            )}
          </Popover>
        );
      })}
    </div>
  );
}
