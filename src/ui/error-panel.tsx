"use client";

import { describeError } from "@/core/errors";
import { button } from "@/ui";
import { Icon } from "@/ui/icons";

/** Tela de erro compartilhada pelos boundaries. Em produção o Next entrega só `digest`, então a mensagem é genérica. */
export function ErrorPanel({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { message, hint } = describeError(error);
  const generic = message === "Erro inesperado." || error.message.includes("omitted in production");
  return (
    <div className="grid min-h-[60vh] place-items-center px-4">
      <div className="w-full max-w-md rounded-lg border border-line bg-surface px-5 py-6 animate-enter">
        <div className="flex items-center gap-2.5">
          <Icon name="alert" className="text-warn" />
          <h1 className="text-[15px] font-medium">Algo deu errado</h1>
        </div>
        <p className="mt-3 text-fg-2">{generic ? "Não foi possível carregar esta página." : message}</p>
        {hint && <p className="mt-1 text-[13px] text-fg-3">{hint}</p>}
        {error.digest && <p className="mt-3 font-mono text-[12px] text-fg-3">ref: {error.digest}</p>}
        <button onClick={retry} className={button({ variant: "secondary", className: "mt-5" })}>
          Tentar de novo
        </button>
      </div>
    </div>
  );
}
