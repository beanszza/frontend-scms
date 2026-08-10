import ViewReports from "@/components/pages/ViewReports";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams;
  const tab = typeof resolvedParams.tab === 'string' ? resolvedParams.tab : 'inventory';

  return <ViewReports initialTab={tab} />;
}

// Trigger hot reload
