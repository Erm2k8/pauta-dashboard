import { Suspense } from "react";
import { ContextsView } from "@/modules/contexts/view";
import { ListSkeleton, PageHeader } from "@/ui";

export default function ContextsPage() {
  return (
    <>
      <PageHeader title="Contextos" icon="layers" meta="empresas, repositórios e projetos" />
      <Suspense fallback={<ListSkeleton rows={3} />}>
        <ContextsView />
      </Suspense>
    </>
  );
}
