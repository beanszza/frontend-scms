import React, { Suspense } from "react";
import ViewTransactionalLogs from "@/components/pages/ViewTransactionalLogs";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading logs...</div>}>
      <ViewTransactionalLogs />
    </Suspense>
  );
}
