import type { Label } from "@/core/types";

/** Badge tingido com a cor da label; o texto mistura a cor com o foreground para manter contraste em qualquer tema. */
export function LabelBadge({ label }: { label: Label }) {
  const color = /^[0-9a-f]{3,8}$/i.test(label.color) ? `#${label.color}` : "var(--fg-3)";
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-full border px-2 py-px text-[11px] font-medium leading-4"
      style={{
        color: `color-mix(in srgb, ${color} 55%, var(--fg))`,
        background: `color-mix(in srgb, ${color} 16%, transparent)`,
        borderColor: `color-mix(in srgb, ${color} 38%, transparent)`,
      }}
    >
      {label.name}
    </span>
  );
}
