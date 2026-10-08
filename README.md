<p align="center"><img src="docs/logo.svg" width="64" height="64" alt=""></p>

<h1 align="center">Pauta</h1>

<p align="center">O que está na pauta hoje: tarefas do GitHub e do Plane, prioridades e branches de todos os seus contextos num só lugar.</p>

- **Hoje**: foco do dia, reviews pendentes e sugestões ordenadas por score.
- **Tarefas**: lista unificada com filtros (fonte, agrupamento, adiadas) e ações inline (P0–P3, Hoje/Semana, adiar).
- **Branches**: branches dos repos configurados com ahead/behind, PR, CI e branches paradas.
- **Contextos**: cada contexto liga um token do GitHub e/ou Plane.

Stack: Next.js 16 (App Router, Cache Components), Tailwind v4, Drizzle + libSQL/Turso.

## Rodar localmente

```bash
cp .env.example .env.local   # preencha DASHBOARD_PASSWORD e SESSION_SECRET
npm install
npm run db:push              # cria as tabelas em local.db (obrigatório antes do primeiro dev)
cp contexts.example.json contexts.local.json   # seus contextos (ignorado pelo git)
npm run db:seed              # cria/atualiza os contextos do JSON
npm run dev
```

Se a sidebar mostrar "O banco ainda não tem as tabelas do Pauta" (ou o log "Failed query: select ... from contexts"), o `db:push` não foi executado.

Depois crie um contexto em `/contexts`, um por organização/empresa.

### Uma chave pessoal para várias organizações

- **GitHub**: crie um token *classic* com os escopos `repo` e `read:org` ([link já preenchido](https://github.com/settings/tokens/new?scopes=repo,read:org&description=Pauta)). Tokens fine-grained só enxergam um dono por token, por isso não servem para duas orgs ao mesmo tempo. Se a org usa SSO, clique em **Configure SSO** ao lado do token e autorize cada uma. Salve como `GITHUB_TOKEN`.
- **Plane Cloud**: gere a API key nas configurações e salve como `PLANE_API_KEY`.
- Em cada contexto, preencha a(s) organização(ões) e deixe **Variável da chave** vazia: todos usam a chave padrão.
- Se uma org bloquear tokens classic, crie um fine-grained só para ela, salve como `GITHUB_TOKEN_ORG_X` e informe esse nome no contexto.

Tokens **não** vão para o banco: o painel guarda apenas o *nome* da variável. Reinicie o `npm run dev` depois de editar o `.env.local`. A tela Contextos mostra, por contexto, qual conta está conectada e quantos itens vieram.

Para ver a interface sem chaves, rode com `DEMO_DATA=1` (dados fictícios em cada contexto).

Os dados das integrações ficam em cache por alguns minutos; o botão **Atualizar dados** na sidebar força a busca.

## Deploy (grátis)

1. **Banco**: crie um banco em [turso.tech](https://turso.tech) (painel web) e gere um token. Rode uma vez localmente apontando para ele:
   ```bash
   DATABASE_URL=libsql://<db>.turso.io DATABASE_AUTH_TOKEN=<token> npm run db:push
   ```
2. **Repositório**: suba o projeto para o GitHub.
3. **Vercel**: importe o repositório e configure as Environment Variables: `DASHBOARD_PASSWORD`, `SESSION_SECRET`, `DATABASE_URL`, `DATABASE_AUTH_TOKEN` e cada token referenciado pelos contextos.
4. Cada `git push` na branch principal faz um novo deploy.
5. Valide com `/api/health` logado: deve responder `{"ok":true}`. Não defina `DEMO_DATA` em produção.

Convenções e política de erros do projeto estão em [`CLAUDE.md`](CLAUDE.md).

## Estrutura

```
src/
  app/            rotas (finas: só montam a view do módulo)
  core/           sessão, banco, tipos, score, registro de módulos, server actions
  integrations/   providers (github, plane) que normalizam para WorkItem / RepoBranches
  modules/        um diretório por funcionalidade: manifest.ts + view + componentes
  ui/             primitivos visuais e formatação
```

### Adicionar um módulo
1. Crie `src/modules/<nome>/manifest.ts` e a view.
2. Registre o manifest em `src/core/modules.ts` (aparece na sidebar).
3. Crie a rota em `src/app/(dash)/<nome>/page.tsx` envolvendo a view em `<Suspense>`.

### Adicionar uma integração
Implemente a interface `Provider` (`src/integrations/types.ts`) e adicione em `providers` (`src/integrations/index.ts`). Novas colunas de configuração vão em `src/core/db/schema.ts` (+ `npm run db:push`).

### Ajustar a priorização
Os pesos do score ficam em `score()` em `src/core/items.ts`.
