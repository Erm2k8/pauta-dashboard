import { Suspense } from "react";
import { TodayView } from "@/modules/today/view";
import { ListSkeleton, PageHeader } from "@/ui";

async function Content({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const { ctx } = await searchParams;
  return <TodayView ctx={typeof ctx === "string" ? ctx : undefined} />;
}

export default function TodayPage({ searchParams }: PageProps<"/">) {
  return (
    <>
      <PageHeader title="Hoje" icon="sun" />
      <Suspense fallback={<ListSkeleton />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}
