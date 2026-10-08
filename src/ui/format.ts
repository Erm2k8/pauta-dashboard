const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** "agora", "5min", "3h", "4d", "2sem", "3m" — compacto para listas densas. */
export function ago(iso: string | Date, now = Date.now()) {
  const diff = now - new Date(iso).getTime();
  if (diff < MIN) return "agora";
  if (diff < HOUR) return `${Math.floor(diff / MIN)}min`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h`;
  if (diff < 14 * DAY) return `${Math.floor(diff / DAY)}d`;
  if (diff < 60 * DAY) return `${Math.floor(diff / (7 * DAY))}sem`;
  return `${Math.floor(diff / (30 * DAY))}m`;
}

export function daysSince(iso: string, now = Date.now()) {
  return Math.floor((now - new Date(iso).getTime()) / DAY);
}

/** Prazo relativo: "atrasado 2d", "hoje", "amanhã", "em 5d", ou data curta. */
export function due(iso: string, now = Date.now()) {
  const d = new Date(iso);
  const days = Math.round((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Math.floor(now / DAY) * DAY) / DAY);
  if (days < 0) return { label: `atrasado ${-days}d`, tone: "danger" as const };
  if (days === 0) return { label: "hoje", tone: "warn" as const };
  if (days === 1) return { label: "amanhã", tone: "warn" as const };
  if (days <= 7) return { label: `em ${days}d`, tone: "muted" as const };
  return { label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" }), tone: "muted" as const };
}
