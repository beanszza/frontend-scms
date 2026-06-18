import React, { Suspense } from "react";
import ViewTransactionalLogs from "@/pages/ViewTransactionalLogs";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center dark:text-white">Loading logs...</div>}>
      <ViewTransactionalLogs />
    </Suspense>
  );
}
