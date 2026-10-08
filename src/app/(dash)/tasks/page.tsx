import { Suspense } from "react";
import { TasksView, type TaskFilters } from "@/modules/tasks/view";
import { ListSkeleton, PageHeader } from "@/ui";

async function Content({ searchParams }: { searchParams: PageProps<"/tasks">["searchParams"] }) {
  const params = await searchParams;
  const pick = (k: string) => (typeof params[k] === "string" ? (params[k] as string) : undefined);
  const filters: TaskFilters = { ctx: pick("ctx"), source: pick("source"), group: pick("group"), show: pick("show"), who: pick("who") };
  return <TasksView filters={filters} />;
}

export default function TasksPage({ searchParams }: PageProps<"/tasks">) {
  return (
    <>
      <PageHeader title="Tarefas" icon="list" />
      <Suspense fallback={<ListSkeleton rows={10} />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}
