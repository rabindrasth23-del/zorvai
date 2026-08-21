import { createClient } from "@/lib/supabase/server";
import { Settings as SettingsIcon } from "lucide-react";
import { SettingsPortal } from "@/components/settings/settings-portal";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: student } = await supabase
    .from('students')
    .select('name, study_hours_per_day, invite_code')
    .eq('id', user.id)
    .single();

  return (
    <div className="flex flex-col gap-8 animate-element h-full max-w-5xl mx-auto pb-16 px-4 md:px-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
            <SettingsIcon className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-display text-[var(--color-text)] tracking-tight">
              Settings
            </h1>
            <p className="text-[var(--text-body)] text-[var(--color-text-muted)] mt-1 font-sans">
              Manage your preferences and security.
            </p>
          </div>
        </div>
      </header>

      <SettingsPortal 
        initialData={{
          name: student?.name || "",
          email: user.email || "",
          study_hours_per_day: student?.study_hours_per_day || 2
        }}
      />
    </div>
  );
}
