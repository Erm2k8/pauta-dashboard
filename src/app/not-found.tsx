import Link from "next/link";
import { button } from "@/ui";
import { Logo } from "@/ui/logo";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="text-center animate-enter">
        <Logo size={32} className="mx-auto mb-4 text-fg" />
        <p className="text-[18px] font-semibold tracking-tight">Página não encontrada</p>
        <Link href="/" className={button({ className: "mt-5" })}>
          Voltar para Hoje
        </Link>
      </div>
    </main>
  );
}
