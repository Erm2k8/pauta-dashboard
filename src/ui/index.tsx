import type { CSSProperties, ReactNode } from "react";
import type { CheckState, Priority, ProviderError, ReviewState } from "@/core/types";
import { Icon, PriorityGlyph, type IconName } from "./icons";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "icon";

/** Classes de botão reutilizáveis também em <Link>/<a>. */
export function button({ variant = "secondary", size = "md", className }: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cx(
    "inline-flex select-none items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap",
    "transition-[background-color,border-color,color,transform,opacity] duration-150 ease-out active:scale-[0.97]",
    "disabled:pointer-events-none disabled:opacity-45",
    size === "sm" && "h-8 px-3 text-[13px]",
    size === "md" && "h-9 px-3.5 text-[14px]",
    size === "icon" && "size-8",
    variant === "primary" && "bg-accent text-accent-fg hover:bg-[color-mix(in_srgb,var(--accent)_88%,white)]",
    variant === "secondary" && "border border-line-strong bg-surface-2 text-fg hover:border-fg-3/60 hover:bg-surface-3",
    variant === "ghost" && "text-fg-2 hover:bg-surface-2 hover:text-fg",
    variant === "danger" && "border border-danger/40 text-danger hover:bg-danger/10",
    className,
  );
}

/** Link de texto: muda de cor no hover e ganha sublinhado discreto. */
export const linkClass =
  "text-accent underline-offset-4 decoration-accent/40 transition-colors hover:text-[color-mix(in_srgb,var(--accent)_80%,white)] hover:underline";

export function PageHeader({ title, icon, meta, actions }: { title: string; icon?: IconName; meta?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-line bg-bg/85 px-6 backdrop-blur">
      <div className="flex items-center gap-2.5">
        {icon && <Icon name={icon} className="text-fg-3" />}
        <h1 className="text-[14px] font-medium">{title}</h1>
        {meta && <span className="text-fg-3">{meta}</span>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Section({ title, icon, count, aside, children }: { title: string; icon?: ReactNode; count?: number; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="mb-8 animate-enter">
      <div className="mb-1.5 flex h-6 items-center justify-between px-2">
        <h2 className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.08em] text-fg-3">
          {icon}
          {title}
          {count !== undefined && <span className="rounded bg-surface-2 px-1.5 py-px font-mono text-[11px] tracking-normal tabular-nums text-fg-2">{count}</span>}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Dot({ color, className, size = 8 }: { color: string; className?: string; size?: number }) {
  return <span className={cx("inline-block shrink-0 rounded-full", className)} style={{ background: color, width: size, height: size }} />;
}

export const PRIORITY_LABEL = ["Urgente", "Alta", "Média", "Baixa"] as const;

export function priorityLabel(p: Priority) {
  return p === null ? "Sem prioridade" : `P${p} · ${PRIORITY_LABEL[p]}`;
}

export function PriorityIcon({ value }: { value: Priority }) {
  return (
    <span data-tip={priorityLabel(value)} className="inline-grid size-5 place-items-center">
      <PriorityGlyph value={value} />
    </span>
  );
}

/** Indicador inline: ícone + texto, sem fundo. Cor só quando muda a decisão. */
export function Signal({ icon, tone = "muted", tip, children }: { icon: IconName; tone?: "muted" | "ok" | "warn" | "danger" | "accent"; tip?: string; children?: ReactNode }) {
  const tones = { muted: "text-fg-3", ok: "text-ok", warn: "text-warn", danger: "text-danger", accent: "text-accent" };
  return (
    <span data-tip={tip} className={cx("inline-flex items-center gap-1 text-[12px] whitespace-nowrap", tones[tone])}>
      <Icon name={icon} size={12} strokeWidth={2} />
      {children}
    </span>
  );
}

export function PrSignals({ draft, review, checks }: { draft?: boolean; review?: ReviewState; checks?: CheckState }) {
  return (
    <>
      {draft && <Signal icon="pencil" tip="Pull request em rascunho">rascunho</Signal>}
      {checks === "success" && <Signal icon="check" tone="ok" tip="CI passou" />}
      {checks === "failure" && <Signal icon="x" tone="danger" tip="CI falhou">CI</Signal>}
      {checks === "pending" && <Signal icon="clock" tone="warn" tip="CI em execução" />}
      {review === "changes" && <Signal icon="alertCircle" tone="danger" tip="Alterações solicitadas na review">alterações</Signal>}
      {review === "approved" && <Signal icon="checkCircle" tone="ok" tip="Review aprovada">aprovado</Signal>}
    </>
  );
}

export function Empty({ icon = "inbox", title, children }: { icon?: IconName; title?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line px-6 py-10 text-center animate-enter">
      <span className="grid size-9 place-items-center rounded-full bg-surface-2 text-fg-3">
        <Icon name={icon} size={16} />
      </span>
      {title && <p className="font-medium text-fg">{title}</p>}
      {children && <div className="max-w-md text-fg-3">{children}</div>}
    </div>
  );
}

export function Errors({ errors, names }: { errors: ProviderError[]; names: Map<string, string> }) {
  if (!errors.length) return null;
  return (
    <div className="mb-6 space-y-1.5 rounded-lg border border-warn/25 bg-warn/[0.04] px-3.5 py-2.5 animate-enter">
      {errors.map((e) => (
        <p key={`${e.contextId}-${e.source}`} className="flex items-center gap-2 text-fg-2">
          <Icon name="alert" size={13} className="shrink-0 text-warn" />
          <span className="font-medium text-fg">{names.get(e.contextId) ?? e.contextId}</span>
          <span className="text-fg-3">{e.source === "github" ? "GitHub" : "Plane"}</span>
          <span className="truncate">{e.message}</span>
        </p>
      ))}
    </div>
  );
}

const shimmer: CSSProperties = {
  background: "linear-gradient(90deg, var(--surface) 0%, var(--surface-2) 50%, var(--surface) 100%)",
  backgroundSize: "200% 100%",
};

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-1 px-4 py-6" aria-busy="true" aria-label="Carregando">
      <div className="mb-4 h-4 w-32 animate-shimmer rounded" style={shimmer} />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-9 animate-shimmer rounded-md" style={{ ...shimmer, opacity: 1 - i * 0.1 }} />
      ))}
    </div>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-4 py-6">{children}</div>;
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-line-strong bg-surface-2 px-1 font-mono text-[11px] text-fg-2">{children}</kbd>;
}
