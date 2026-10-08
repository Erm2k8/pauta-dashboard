"use client";

import { useActionState, useEffect, useState, useTransition, type ReactNode } from "react";
import type { Context } from "@/core/types";
import { button, cx } from "@/ui";
import { Icon } from "@/ui/icons";
import { toast } from "@/ui/toast";
import { deleteContext, saveContext, type FormState } from "./actions";

/** Paleta discreta: a cor do contexto aparece só como marcador. */
export const CONTEXT_COLORS = ["#8b93ff", "#4fb6c9", "#5dbb7f", "#d8b04a", "#e0795a", "#d070a8", "#9a9aa3"];

function Field({ label, hint, htmlFor, children }: { label: string; hint?: ReactNode; htmlFor: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[13px] text-fg-2">
        {label}
      </label>
      {children}
      {hint && <p className="text-[12px] leading-snug text-fg-3">{hint}</p>}
    </div>
  );
}

function Group({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-lg border border-line p-4">
      <legend className="flex items-center gap-1.5 px-1.5 text-[12px] font-medium uppercase tracking-[0.08em] text-fg-3">
        {icon}
        {title}
      </legend>
      <div className="grid gap-4 sm:grid-cols-3">{children}</div>
    </fieldset>
  );
}

export function ContextForm({ context, onDone }: { context?: Context; onDone?: () => void }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveContext, {});
  const [color, setColor] = useState(context?.color ?? CONTEXT_COLORS[0]);
  const [confirming, setConfirming] = useState(false);
  const [deleting, startDelete] = useTransition();
  const id = context?.id ?? "novo";

  useEffect(() => {
    if (!state.ok) return;
    toast(context ? "Contexto salvo" : "Contexto criado");
    onDone?.();
  }, [state, onDone, context]);

  return (
    <form action={action} className="animate-pop space-y-4 rounded-xl border border-line-strong bg-surface p-5 shadow-xl shadow-black/30">
      {context && <input type="hidden" name="id" value={context.id} />}
      <input type="hidden" name="color" value={color} />

      <div className="flex flex-wrap items-end gap-5">
        <Field label="Nome" htmlFor={`${id}-name`}>
          <input id={`${id}-name`} name="name" defaultValue={context?.name} required placeholder="Empresa A" className="w-64" autoFocus={!context} />
        </Field>
        <div className="space-y-1.5">
          <span className="block text-[13px] text-fg-2">Cor</span>
          <div className="flex h-[31px] items-center gap-1.5">
            {CONTEXT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Usar cor ${c}`}
                aria-pressed={color === c}
                onClick={() => setColor(c)}
                className={cx(
                  "size-5 rounded-full transition-transform duration-150 hover:scale-110",
                  color === c && "ring-2 ring-fg-2 ring-offset-2 ring-offset-surface",
                )}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      </div>

      <Group icon={<Icon name="github" size={12} />} title="GitHub">
        <Field label="Organizações ou usuário" htmlFor={`${id}-owner`} hint="Separe por vírgula. Define onde buscar issues e PRs.">
          <input id={`${id}-owner`} name="githubOwner" defaultValue={context?.githubOwner ?? ""} placeholder="acme, acme-labs" className="w-full font-mono" />
        </Field>
        <Field label="Repositórios (branches)" htmlFor={`${id}-repos`} hint="dono/nome, separados por vírgula">
          <input id={`${id}-repos`} name="githubRepos" defaultValue={context?.githubRepos.join(", ")} placeholder="acme/web, acme/api" className="w-full font-mono" />
        </Field>
        <Field label="Variável da chave" htmlFor={`${id}-ghtoken`} hint={<>Vazio usa a chave padrão <code className="text-fg-2">GITHUB_TOKEN</code></>}>
          <input id={`${id}-ghtoken`} name="githubTokenEnv" defaultValue={context?.githubTokenEnv ?? ""} placeholder="GITHUB_TOKEN" className="w-full font-mono" />
        </Field>
      </Group>

      <Group icon={<Icon name="send" size={12} />} title="Plane">
        <Field label="Workspace (slug)" htmlFor={`${id}-ws`} hint="app.plane.so/slug/ (vazio desliga o Plane)">
          <input id={`${id}-ws`} name="planeWorkspace" defaultValue={context?.planeWorkspace ?? ""} placeholder="acme" className="w-full font-mono" />
        </Field>
        <Field label="Projetos" htmlFor={`${id}-projects`} hint="Identificadores (WEB, API). Vazio = todos">
          <input id={`${id}-projects`} name="planeProjects" defaultValue={context?.planeProjects.join(", ")} placeholder="WEB, API" className="w-full font-mono" />
        </Field>
        <Field label="Variável da chave" htmlFor={`${id}-pltoken`} hint={<>Vazio usa a chave padrão <code className="text-fg-2">PLANE_API_KEY</code></>}>
          <input id={`${id}-pltoken`} name="planeTokenEnv" defaultValue={context?.planeTokenEnv ?? ""} placeholder="PLANE_API_KEY" className="w-full font-mono" />
        </Field>
      </Group>

      <div className="flex items-center gap-2 pt-1">
        <button disabled={pending} className={button({ variant: "primary" })}>
          {pending ? <Icon name="refresh" className="animate-spin" /> : <Icon name="check" strokeWidth={2.25} />}
          {pending ? "Salvando…" : context ? "Salvar alterações" : "Criar contexto"}
        </button>
        {onDone && (
          <button type="button" onClick={onDone} className={button({ variant: "ghost" })}>
            Cancelar
          </button>
        )}
        {state.error && (
          <span role="alert" className="flex items-center gap-1.5 text-danger animate-enter">
            <Icon name="alertCircle" size={13} />
            {state.error}
          </span>
        )}
        {context &&
          (confirming ? (
            <span className="ml-auto flex items-center gap-2 animate-enter">
              <span className="text-fg-2">Remover “{context.name}”? Planejamentos dos itens são mantidos.</span>
              <button type="button" onClick={() => setConfirming(false)} className={button({ variant: "ghost", size: "sm" })}>
                Manter
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  startDelete(async () => {
                    await deleteContext(context.id);
                    toast("Contexto removido");
                  })
                }
                className={button({ variant: "danger", size: "sm" })}
              >
                <Icon name="trash" size={12} />
                Remover contexto
              </button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} className={button({ variant: "ghost", className: "ml-auto hover:text-danger" })}>
              <Icon name="trash" size={13} />
              Remover
            </button>
          ))}
      </div>
    </form>
  );
}

export function EditableContext({ context, summary }: { context: Context; summary: ReactNode }) {
  const [editing, setEditing] = useState(false);
  if (editing) return <ContextForm context={context} onDone={() => setEditing(false)} />;
  return (
    <div className="group flex items-center rounded-lg border border-line bg-surface transition-colors hover:border-line-strong">
      <div className="min-w-0 flex-1">{summary}</div>
      <button onClick={() => setEditing(true)} className={button({ variant: "ghost", size: "sm", className: "mr-2" })}>
        <Icon name="pencil" size={12} />
        Editar
      </button>
    </div>
  );
}

export function NewContext({ startOpen }: { startOpen: boolean }) {
  const [open, setOpen] = useState(startOpen);
  const [key, setKey] = useState(0);
  if (open)
    return (
      <ContextForm
        key={key}
        onDone={() => {
          setKey((k) => k + 1);
          if (!startOpen) setOpen(false);
        }}
      />
    );
  return (
    <button onClick={() => setOpen(true)} className={button({ variant: "secondary" })}>
      <Icon name="plus" strokeWidth={2.25} />
      Novo contexto
    </button>
  );
}
