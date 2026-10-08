import { connection } from "next/server";
import { Suspense } from "react";
import { listContexts } from "@/core/contexts";
import { Toaster } from "@/ui/toast";
import { Sidebar } from "./sidebar";

async function SidebarWithData() {
  await connection();
  const contexts = await listContexts();
  return <Sidebar contexts={contexts.map(({ id, name, color }) => ({ id, name, color }))} />;
}

export default function DashLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-line bg-bg">
        <Suspense fallback={<Sidebar contexts={[]} />}>
          <SidebarWithData />
        </Suspense>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
      <Toaster />
    </div>
  );
}
