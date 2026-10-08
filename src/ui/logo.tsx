/** Marca da Pauta: círculos tangentes que encolhem até o ponto de foco. */
export function Logo({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} role="img" aria-label="Pauta">
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" />
      <circle cx="12.82" cy="19.18" r="9.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="9.64" cy="22.36" r="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="9.64" cy="22.36" r="2.6" fill="var(--accent)" />
    </svg>
  );
}
