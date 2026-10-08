import { connection } from "next/server";
import { Suspense } from "react";
import { listContexts } from "@/core/contexts";
import type { Context } from "@/core/types";
import { checkConnection } from "@/integrations";
import { button, Dot, Page, Section } from "@/ui";
import { Icon } from "@/ui/icons";
import { EditableContext, NewContext } from "./context-form";

const NEW_GITHUB_TOKEN = "https://github.com/settings/tokens/new?scopes=repo,read:org&description=Painel%20pessoal";

/** Teste de conexão: qual chave, de quem é e quantos itens vieram de cada fonte. */
async function Status({ context }: { context: Context }) {
  const statuses = await checkConnection(context);
  if (!statuses.length) return <span className="text-[12px] text-fg-3">Nenhuma integração configurada</span>;
  return (
    <div className="flex flex-col gap-1">
      {statuses.map((s) => (
        <span key={s.source} className="flex min-w-0 items-center gap-2 text-[12px] animate-enter">
          <Icon name={s.source === "github" ? "github" : "send"} size={12} className="shrink-0 text-fg-3" />
          {s.ok ? (
            <>
              <span className="size-1.5 shrink-0 rounded-full bg-ok" />
              <span className="text-fg-2">{s.account}</span>
              <span className="text-fg-3">
                {s.items} itens · chave <code className="font-mono">{s.tokenEnv}</code>
              </span>
            </>
          ) : (
            <>
              <span className="size-1.5 shrink-0 rounded-full bg-danger" />
              <span className="truncate text-danger" title={s.error}>
                {s.error}
              </span>
              <code className="shrink-0 font-mono text-fg-3">{s.tokenEnv}</code>
            </>
          )}
        </span>
      ))}
    </div>
  );
}

function Summary({ context }: { context: Context }) {
  const scope = [context.githubOwner, context.githubRepos.length ? `${context.githubRepos.length} repos` : null, context.planeWorkspace && `plane/${context.planeWorkspace}`]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="flex min-h-14 items-center gap-4 px-4 py-2.5">
      <Dot color={context.color} size={10} />
      <div className="w-48 min-w-0">
        <p className="truncate font-medium">{context.name}</p>
        <p className="truncate font-mono text-[12px] text-fg-3">{scope || "sem escopo"}</p>
      </div>
      <div className="min-w-0 flex-1">
        <Suspense
          fallback={
            <span className="flex items-center gap-1.5 text-[12px] text-fg-3">
              <Icon name="refresh" size={11} className="animate-spin" /> Testando conexão…
            </span>
          }
        >
          <Status context={context} />
        </Suspense>
      </div>
    </div>
  );
}

function KeyGuide({ open }: { open: boolean }) {
  return (
    <details open={open} className="group mb-8 rounded-lg border border-line bg-surface animate-enter">
      <summary className="flex items-center gap-2 rounded-lg px-4 py-3 transition-colors hover:bg-surface-2">
        <Icon name="key" className="text-accent" />
        <span className="font-medium">Conectar sua chave pessoal</span>
        <span className="text-fg-3">uma chave para várias organizações</span>
        <Icon name="chevronDown" className="ml-auto text-fg-3 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="grid gap-6 border-t border-line px-4 py-4 text-fg-2 md:grid-cols-2">
        <div className="space-y-2.5">
          <p className="flex items-center gap-1.5 font-medium text-fg">
            <Icon name="github" size={13} /> GitHub
          </p>
          <ol className="list-decimal space-y-1.5 pl-4 marker:text-fg-3">
            <li>
              Crie um token <em>classic</em> com os escopos <code className="font-mono text-fg">repo</code> e <code className="font-mono text-fg">read:org</code>. Tokens
              fine-grained só enxergam um dono por vez.
            </li>
            <li>
              Se alguma organização usa SSO, clique em <span className="text-fg">Configure SSO</span> ao lado do token e autorize cada uma.
            </li>
            <li>
              Salve como <code className="font-mono text-fg">GITHUB_TOKEN</code> no <code className="font-mono">.env.local</code> e na Vercel.
            </li>
            <li>Crie um contexto por organização, deixando a variável da chave vazia.</li>
          </ol>
          <a href={NEW_GITHUB_TOKEN} target="_blank" rel="noreferrer" className={button({ variant: "secondary", size: "sm" })}>
            Criar token no GitHub
            <Icon name="external" size={12} />
          </a>
        </div>
        <div className="space-y-2.5">
          <p className="flex items-center gap-1.5 font-medium text-fg">
            <Icon name="send" size={13} /> Plane
          </p>
          <ol className="list-decimal space-y-1.5 pl-4 marker:text-fg-3">
            <li>
              No Plane, gere uma API key em <span className="text-fg">Configurações</span> (do workspace ou do perfil, conforme sua versão).
            </li>
            <li>
              Salve como <code className="font-mono text-fg">PLANE_API_KEY</code>. Se cada workspace exigir uma chave própria, use variáveis separadas e informe o nome em
              cada contexto.
            </li>
            <li>Preencha o slug do workspace no contexto.</li>
          </ol>
          <p className="flex items-start gap-1.5 text-[13px] text-fg-3">
            <Icon name="lock" size={12} className="mt-0.5 shrink-0" />
            As chaves nunca são gravadas no banco; o painel guarda só o nome da variável.
          </p>
        </div>
      </div>
    </details>
  );
}

export async function ContextsView() {
  await connection();
  const contexts = await listContexts();
  return (
    <Page>
      <KeyGuide open={contexts.length === 0} />
      <Section title="Contextos" icon={<Icon name="layers" size={12} />} count={contexts.length}>
        <div className="space-y-2">
          {contexts.map((c) => (
            <EditableContext key={c.id} context={c} summary={<Summary context={c} />} />
          ))}
        </div>
      </Section>
      <NewContext startOpen={contexts.length === 0} />
    </Page>
  );
}
