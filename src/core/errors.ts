export interface ErrorInfo {
  code: "db-schema" | "db-connection" | "session" | "sso" | "credentials" | "not-found" | "forbidden" | "plane" | "unknown";
  message: string;
  hint?: string;
}

function chain(e: unknown): string {
  const parts: string[] = [];
  for (let cur: unknown = e, depth = 0; cur && depth < 5; depth++) {
    if (cur instanceof Error) {
      parts.push(cur.message);
      cur = cur.cause;
    } else {
      parts.push(String(cur));
      break;
    }
  }
  return parts.join(" | ");
}

const RULES: { test: RegExp; info: ErrorInfo }[] = [
  {
    test: /no such table|no such column/i,
    info: { code: "db-schema", message: "O banco ainda não tem as tabelas do Pauta.", hint: "Rode `npm run db:push` (e `npm run db:seed` para os contextos)." },
  },
  {
    test: /SQLITE_CANTOPEN|unable to open database|URL_INVALID|SERVER_ERROR.*(40[13])|libsql|hrana/i,
    info: { code: "db-connection", message: "Não foi possível conectar ao banco.", hint: "Confira DATABASE_URL e DATABASE_AUTH_TOKEN." },
  },
  {
    test: /SESSION_SECRET/i,
    info: { code: "session", message: "SESSION_SECRET ausente ou curto.", hint: "Defina uma chave de pelo menos 32 caracteres no .env.local / Vercel." },
  },
  { test: /SAML|SSO/i, info: { code: "sso", message: "A organização exige SSO: autorize a chave em github.com/settings/tokens (Configure SSO)." } },
  { test: /Bad credentials/i, info: { code: "credentials", message: "Chave inválida ou expirada." } },
  { test: /Could not resolve to a Repository/i, info: { code: "not-found", message: "Repositório não encontrado ou sem acesso pela chave." } },
  { test: /not accessible by (personal access|integration)/i, info: { code: "forbidden", message: "A chave não tem permissão para este recurso." } },
  { test: /Plane 40[13]/, info: { code: "plane", message: "Chave do Plane recusada (confira o workspace e a chave)." } },
  { test: /Plane 404/, info: { code: "plane", message: "Workspace do Plane não encontrado." } },
];

/** Traduz erros de banco, sessão e integrações em algo acionável. Nunca expõe a query. */
export function describeError(e: unknown): ErrorInfo {
  const raw = chain(e);
  const rule = RULES.find((r) => r.test.test(raw));
  if (rule) return rule.info;
  return { code: "unknown", message: raw.split(" | ").pop()?.slice(0, 200) || "Erro inesperado." };
}

export function errorText(e: unknown) {
  const { message, hint } = describeError(e);
  return hint ? `${message} ${hint}` : message;
}
