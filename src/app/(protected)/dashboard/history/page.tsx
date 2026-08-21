import { createClient } from "@/lib/supabase/server";
import { DataTable } from "@/components/ui/data-table";
import { History } from "lucide-react";

const columns = [
  { accessorKey: "date", header: "Date" },
  { accessorKey: "topic", header: "Topic" },
  { accessorKey: "duration", header: "Duration (min)" },
  { accessorKey: "outcome", header: "Outcome" }, 
  { accessorKey: "status", header: "Status" }, 
];

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // We have no actual session data array built out yet, keeping honest empty state
  const sessionsList: any[] = [];

  return (
    <div className="flex flex-col gap-8 animate-element h-full max-w-5xl mx-auto py-12 px-4 md:px-8">
      <header className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
          <History className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-display text-[var(--color-text)] tracking-tight">
            Session History
          </h1>
          <p className="text-[var(--text-body)] text-[var(--color-text-muted)] mt-1 font-sans">
            Review your past study sessions and outcomes.
          </p>
        </div>
      </header>

      <section className="mt-4">
        <div className="bg-surface border border-border rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] overflow-hidden">
          <DataTable columns={columns} data={sessionsList} />
        </div>
      </section>
    </div>
  );
}
