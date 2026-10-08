import "server-only";

/** Chaves usadas quando o contexto não define uma variável própria. */
export const DEFAULT_TOKEN_ENV = { github: "GITHUB_TOKEN", plane: "PLANE_API_KEY" } as const;

/**
 * Tokens de integração são referenciados pelo nome da env var salvo no contexto.
 * Sem nome, cai na chave padrão — assim uma única chave pessoal atende vários contextos.
 */
export function tokenEnvName(source: keyof typeof DEFAULT_TOKEN_ENV, envName: string | null | undefined) {
  return envName || DEFAULT_TOKEN_ENV[source];
}

export function readToken(source: keyof typeof DEFAULT_TOKEN_ENV, envName: string | null | undefined): string {
  const name = tokenEnvName(source, envName);
  const value = /^[A-Z][A-Z0-9_]*$/.test(name) ? process.env[name] : undefined;
  if (!value) throw new Error(`defina ${name} no .env.local / Vercel`);
  return value;
}
