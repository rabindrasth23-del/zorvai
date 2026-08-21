import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = "skillmakers246@gmail.com";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] w-full text-[var(--color-text)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] py-4 px-6 md:px-12 flex justify-between items-center shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h1 className="font-display font-bold tracking-tight text-xl text-[var(--color-text)]">
            Zorvai Admin
          </h1>
          <span className="bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-sm">
            Internal
          </span>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-6 md:p-12">
        {children}
      </main>
    </div>
  );
}
