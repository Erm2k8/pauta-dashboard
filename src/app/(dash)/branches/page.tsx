import { Suspense } from "react";
import { BranchesView } from "@/modules/branches/view";
import { ListSkeleton, PageHeader } from "@/ui";

async function Content({ searchParams }: { searchParams: PageProps<"/branches">["searchParams"] }) {
  const { ctx, filter } = await searchParams;
  return <BranchesView ctx={typeof ctx === "string" ? ctx : undefined} filter={typeof filter === "string" ? filter : undefined} />;
}

export default function BranchesPage({ searchParams }: PageProps<"/branches">) {
  return (
    <>
      <PageHeader title="Branches" icon="branch" />
      <Suspense fallback={<ListSkeleton rows={10} />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}
