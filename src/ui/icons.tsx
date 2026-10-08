/** Ícones de traço (24×24, estilo Lucide). */
const paths = {
  sun: "M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  list: "M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01",
  branch: "M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM18 9a9 9 0 0 1-9 9",
  layers: "m12 2 10 5-10 5L2 7l10-5ZM2 17l10 5 10-5M2 12l10 5 10-5",
  refresh: "M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5",
  external: "M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
  more: "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  alert: "M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  issue: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  pr: "M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 9v12M18 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM13 6h3a2 2 0 0 1 2 2v7",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  check: "M20 6 9 17l-5-5",
  x: "M18 6 6 18M6 6l12 12",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  moon: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z",
  plus: "M12 5v14M5 12h14",
  pencil: "M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z",
  trash: "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  send: "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z",
  chevronDown: "m6 9 6 6 6-6",
  chevronRight: "m9 18 6-6-6-6",
  arrowRight: "M5 12h14M12 5l7 7-7 7",
  key: "M15.5 7.5 19 4M21 2l-2 2M15.5 7.5l3 3L22 7l-3-3M11.4 11.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8Z",
  checkCircle: "M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14l-3-3",
  alertCircle: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 8v4M12 16h.01",
  calendarWeek: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM7 14h10M7 18h6",
  inbox: "M22 12h-6l-2 3h-4l-2-3H2M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1Z",
  commit: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 12h6M15 12h6",
  github:
    "M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4M9 18c-4.51 2-5-2-7-2",
  lock: "M7 11V7a5 5 0 0 1 10 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z",
  flag: "M4 22V15M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1v12Z",
  user: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  message: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z",
  subtasks: "M4 4v12a2 2 0 0 0 2 2h6M4 9h8M15 9h5M15 18h5",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, size = 15, className, strokeWidth = 1.75 }: { name: IconName; size?: number; className?: string; strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d={paths[name]} />
    </svg>
  );
}

/** Estado de uma tarefa do Plane, desenhado como círculo: tracejado (backlog), vazio, meio cheio (em andamento). */
export function StateIcon({ group, size = 14 }: { group?: string; size?: number }) {
  const started = group === "started";
  const backlog = group === "backlog" || group === "triage";
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden className={started ? "text-warn" : backlog ? "text-fg-3" : "text-fg-2"}>
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray={backlog ? "2 2.2" : undefined} />
      {started && <path d="M8 4a4 4 0 0 1 0 8Z" fill="currentColor" />}
    </svg>
  );
}

/** Prioridade estilo barras de sinal; P0 é um quadrado de alerta. */
export function PriorityGlyph({ value, size = 14 }: { value: 0 | 1 | 2 | 3 | null; size?: number }) {
  if (value === 0) {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden className="text-danger">
        <rect x="1.5" y="1.5" width="13" height="13" rx="3" fill="currentColor" />
        <path d="M8 4.5v4.2M8 11.2v.3" stroke="var(--bg)" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  const filled = value === null ? 0 : 4 - value;
  const color = value === 1 ? "text-warn" : value === null ? "text-fg-3" : "text-fg-2";
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden className={color}>
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={2 + i * 4.5}
          y={value === null ? 7 : 10 - i * 3.5}
          width="3"
          height={value === null ? 2 : 4 + i * 3.5}
          rx="1"
          fill="currentColor"
          opacity={value === null ? 0.6 : i < filled ? 1 : 0.22}
        />
      ))}
    </svg>
  );
}
