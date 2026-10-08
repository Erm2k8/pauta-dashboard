"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useTransition } from "react";
import { refreshProviders } from "@/core/actions";
import { logout } from "@/core/auth";
import { modules } from "@/core/modules";
import { cx, Dot } from "@/ui";
import { Icon } from "@/ui/icons";
import { Logo } from "@/ui/logo";
import { toast } from "@/ui/toast";

type SidebarContext = { id: string; name: string; color: string };

const itemClass = (active: boolean) =>
  cx(
    "group relative flex h-9 w-full items-center gap-3 rounded-md px-2.5 transition-[background-color,color] duration-150",
    active ? "bg-surface-2 text-fg" : "text-fg-2 hover:bg-surface hover:text-fg",
  );

function ActiveBar({ show }: { show: boolean }) {
  return (
    <span
      aria-hidden
      className={cx("absolute -left-2 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-accent transition-all duration-200", show ? "opacity-100" : "scale-y-0 opacity-0")}
    />
  );
}

function Nav({ contexts, failure }: { contexts: SidebarContext[]; failure?: string | null }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const ctx = params.get("ctx");
  const withCtx = (href: string, id: string | null = ctx) => (id ? `${href}?ctx=${id}` : href);
  const main = modules.filter((m) => !m.footer);
  const footer = modules.filter((m) => m.footer);

  return (
    <>
      <nav className="space-y-0.5 px-2">
        {main.map((m) => {
          const active = pathname === m.href;
          return (
            <Link key={m.id} href={withCtx(m.href)} className={itemClass(active)} aria-current={active ? "page" : undefined}>
              <ActiveBar show={active} />
              <Icon name={m.icon} className={cx("transition-colors", active ? "text-accent" : "text-fg-3 group-hover:text-fg-2")} />
              {m.title}
            </Link>
          );
        })}
      </nav>

      <div className="mt-7 px-2">
        <p className="px-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-fg-3">Contextos</p>
        <div className="space-y-0.5">
          <Link href={pathname} className={itemClass(!ctx)} aria-current={!ctx ? "true" : undefined}>
            <span className="grid w-[14px] place-items-center">
              <span className="size-2 rounded-full border border-fg-3" />
            </span>
            Todos
          </Link>
          {contexts.map((c) => (
            <Link key={c.id} href={withCtx(pathname, c.id)} className={itemClass(ctx === c.id)} aria-current={ctx === c.id ? "true" : undefined}>
              <span className="grid w-[14px] place-items-center">
                <Dot color={c.color} className={cx("transition-transform duration-150", ctx === c.id ? "scale-125" : "group-hover:scale-110")} />
              </span>
              <span className="truncate">{c.name}</span>
            </Link>
          ))}
          {failure && (
            <p role="alert" className="mx-2.5 mt-1 flex gap-2 rounded-md border border-warn/25 bg-warn/[0.04] px-2.5 py-2 text-[12px] leading-snug text-fg-2">
              <Icon name="alert" size={13} className="mt-px shrink-0 text-warn" />
              {failure}
            </p>
          )}
          {contexts.length === 0 && !failure && (
            <Link href="/contexts" className={cx(itemClass(false), "text-fg-3")}>
              <Icon name="plus" className="text-fg-3" />
              Adicionar contexto
            </Link>
          )}
        </div>
      </div>

      <div className="mt-auto space-y-0.5 border-t border-line px-2 pb-3 pt-3">
        <RefreshButton ctx={ctx} name={contexts.find((c) => c.id === ctx)?.name} />
        {footer.map((m) => {
          const active = pathname === m.href;
          return (
            <Link key={m.id} href={m.href} className={itemClass(active)} aria-current={active ? "page" : undefined}>
              <ActiveBar show={active} />
              <Icon name={m.icon} className={active ? "text-accent" : "text-fg-3"} />
              {m.title}
            </Link>
          );
        })}
        <form action={logout}>
          <button className={itemClass(false)}>
            <Icon name="logout" className="text-fg-3" />
            Sair
          </button>
        </form>
      </div>
    </>
  );
}

function RefreshButton({ ctx, name }: { ctx: string | null; name?: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      className={itemClass(false)}
      disabled={pending}
      aria-busy={pending}
      onClick={() =>
        start(async () => {
          await refreshProviders(ctx ?? undefined);
          toast(name ? `Dados de ${name} atualizados` : "Dados atualizados", "info");
        })
      }
    >
      <Icon name="refresh" className={cx("text-fg-3", pending && "animate-spin text-accent")} />
      {pending ? "Atualizando…" : "Atualizar dados"}
    </button>
  );
}

export function Sidebar({ contexts, failure }: { contexts: SidebarContext[]; failure?: string | null }) {
  return (
    <div className="flex h-full flex-col pt-3">
      <Link href="/" className="group mx-2 mb-5 flex h-9 items-center gap-2.5 rounded-md px-2.5 transition-colors hover:bg-surface">
        <Logo size={20} className="text-fg transition-transform duration-300 ease-out group-hover:rotate-[-12deg]" />
        <span className="text-[15px] font-semibold tracking-tight">Pauta</span>
      </Link>
      <Suspense>
        <Nav contexts={contexts} failure={failure} />
      </Suspense>
    </div>
  );
}
