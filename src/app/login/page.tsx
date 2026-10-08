import { LoginForm } from "./form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-[300px] animate-enter">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-lg bg-surface-3">
            <span className="size-2.5 rounded-full bg-accent" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Painel</span>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
