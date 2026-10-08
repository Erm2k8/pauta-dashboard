"use client";

import { useEffect } from "react";
import { ErrorPanel } from "@/ui/error-panel";

export default function DashError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorPanel error={error} retry={retry} />;
}
