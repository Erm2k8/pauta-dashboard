import { Logo } from "@/ui/logo";
import { LoginForm } from "./form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-[300px] animate-enter">
        <div className="mb-8 flex items-center gap-3">
          <Logo size={32} className="text-fg" />
          <div>
            <p className="text-[18px] font-semibold leading-tight tracking-tight">Pauta</p>
            <p className="text-[13px] text-fg-3">O que está na pauta hoje</p>
          </div>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
