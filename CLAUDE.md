@AGENTS.md

<visao_geral>
Pauta é um painel pessoal que unifica tarefas do GitHub e do Plane, prioridades locais e branches de vários contextos (empresas/projetos) numa só tela. Uso individual, protegido por uma senha única.
Telas: Hoje (foco do dia e sugestões por score), Tarefas, Branches e Contextos. O README.md tem o passo a passo de uso e deploy; consulte-o antes de mudar setup ou integrações.
</visao_geral>

<stack>
Next.js 16 (App Router, Cache Components), React 19, Tailwind v4, Drizzle ORM + libSQL (arquivo local ou Turso), jose (sessão JWT), zod.
Este Next tem mudanças incompatíveis: leia `node_modules/next/dist/docs/` antes de escrever código de rotas, cache, erros ou `proxy.ts`. Exemplo: nos boundaries de erro a prop é `retry`, não `reset`.
</stack>

<estrutura>
```
src/
├─ app/            rotas finas: só montam a view do módulo (login, (dash)/*, api/health)
├─ core/           sessão, auth, banco, tipos, score, erros, registro de módulos, server actions
├─ integrations/   providers (github, plane, demo) que normalizam para WorkItem / RepoBranches
├─ modules/        um diretório por funcionalidade: manifest.ts + view + componentes
└─ ui/             primitivos visuais, formatação e painel de erro
scripts/seed.mts   cria/atualiza contextos a partir de JSON
```

Regra central: rotas não têm lógica. Dados e regras ficam em `core/` e `modules/<nome>/`; integrações externas só entram por `Provider` (`src/integrations/types.ts`).
Novo módulo: pasta em `src/modules/<nome>/` + manifest registrado em `src/core/modules.ts` + rota em `src/app/(dash)/<nome>/page.tsx` dentro de `<Suspense>`.
</estrutura>

<dados>
- Tokens de GitHub/Plane nunca vão para o banco: o contexto guarda só o nome da variável de ambiente (`readToken` em `src/core/env.ts`).
- Schema em `src/core/db/schema.ts`; mudou o schema, rode `npm run db:push`.
- Banco novo ou vazio quebra a sidebar com "Failed query": rode `npm run db:push` antes do primeiro `npm run dev`.
- `.env.local` é lido pelo Next e pelo seed; `.env` também é lido pelo Next. Segredos nunca são commitados.
</dados>

<erros>
- Erro esperado vira estado de UI com instrução acionável, não exceção. Falha de provider vira `ProviderError` listado na página, nunca derruba a tela (`collect` em `src/integrations/index.ts`).
- Toda tradução de erro passa por `describeError`/`errorText` em `src/core/errors.ts`. Novo erro conhecido = nova regra lá, não `if` espalhado.
- Nunca exibir a query SQL, stack ou token ao usuário; logar no servidor com `console.error`.
- Erro inesperado cai nos boundaries: `src/app/(dash)/error.tsx` (usa `ErrorPanel`) e `src/app/global-error.tsx`.
- Server Actions retornam `{ error }` para erros esperados (ver `login`) e chamam `requireSession()` primeiro.
- `GET /api/health` (protegido por sessão) confere senha, `SESSION_SECRET` e conexão com o banco.
</erros>

<codigo>
- TypeScript estrito; evite `any`.
- Siga o estilo do código existente: identificadores em inglês, textos de UI e mensagens de erro em português com acentuação.
- Sem comentários óbvios. Comentário só para explicar um "porquê" não evidente (workaround, regra contraintuitiva); o repo usa `/** ... */` curtos.
- Arquivos em kebab-case, componentes em PascalCase, funções em camelCase, constantes em UPPER_SNAKE_CASE.
- Funções curtas e puras quando possível (ex.: `score`, `buildClaudePrompt`).
- Componentes client só quando há estado ou evento; o resto é Server Component.
</codigo>

<claude>
Integração opcional com o Claude, sem chave de API: botão "Copiar para o Claude" na tela Hoje gera um prompt (`src/modules/today/claude-prompt.ts`) para colar no Claude.ai ou Claude Code. Funciona em qualquer hospedagem.
Opções futuras, ainda não implementadas:
- Servidor MCP do Pauta, consultado pelo Claude Code/Desktop com a assinatura do usuário.
- `claude -p` headless no servidor: só em máquina própria, não funciona na Vercel.
</claude>

<comandos>
- `npm run dev` / `npm run build` / `npm run start`
- `npm run typecheck` e `npm run lint` antes de commitar
- `npm run db:push` cria/atualiza tabelas; `npm run db:seed` carrega `contexts.local.json`
- `DEMO_DATA=1` mostra dados fictícios sem chaves
</comandos>

<commits>
Conventional Commits em português, no imperativo e em minúsculo, com escopo quando fizer sentido (`feat(ui): ...`, `fix(core): ...`, `chore(db): ...`, `docs: ...`).
Tipos aceitos: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`.
</commits>
