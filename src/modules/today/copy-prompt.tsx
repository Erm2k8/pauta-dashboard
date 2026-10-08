"use client";

import { button } from "@/ui";
import { Icon } from "@/ui/icons";
import { toast } from "@/ui/toast";

export function CopyPrompt({ prompt }: { prompt: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      toast("Prompt copiado. Cole no Claude.");
    } catch {
      toast("Não foi possível copiar", "danger");
    }
  }

  return (
    <button onClick={copy} className={button({ variant: "ghost", size: "sm" })} data-tip="Copiar a pauta como prompt para o Claude">
      <Icon name="send" size={12} />
      Copiar para o Claude
    </button>
  );
}
