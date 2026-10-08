import { Suspense } from "react";
import { BranchesView, type BranchFilters } from "@/modules/branches/view";
import { ListSkeleton, PageHeader } from "@/ui";

async function Content({ searchParams }: { searchParams: PageProps<"/branches">["searchParams"] }) {
  const params = await searchParams;
  const pick = (k: string) => (typeof params[k] === "string" ? (params[k] as string) : undefined);
  const filters: BranchFilters = { ctx: pick("ctx"), filter: pick("filter"), q: pick("q"), repo: pick("repo") };
  return <BranchesView filters={filters} />;
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
