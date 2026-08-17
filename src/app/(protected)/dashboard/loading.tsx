import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";

// This loading UI will be automatically rendered by Next.js while page.tsx awaits data
export default function DashboardLoading() {
  const columns = [
    { accessorKey: "date", header: "Date" },
    { accessorKey: "subject", header: "Subject" },
    { accessorKey: "duration", header: "Duration (min)" },
    { accessorKey: "masteryScore", header: "Mastery (%)" },
    { accessorKey: "status", header: "Status" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="mb-4">
        <div className="h-9 w-64 bg-[var(--color-muted)] rounded animate-pulse" />
        <div className="h-5 w-48 bg-[var(--color-muted)] rounded animate-pulse mt-2" />
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Current Streak" value="" iconType="streak" isLoading={true} />
        <StatCard title="Total Sessions" value="" iconType="sessions" isLoading={true} />
        <StatCard title="Avg Mastery" value="" iconType="mastery" isLoading={true} />
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-display font-semibold text-[var(--color-text)] mb-4">
          Recent Sessions
        </h2>
        <DataTable columns={columns} data={[]} isLoading={true} />
      </section>
    </div>
  );
}
