import { createClient } from "@/lib/supabase/server";
import { Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="flex flex-col gap-8 animate-element h-full max-w-4xl mx-auto py-12 px-4 md:px-8">
      <header className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-display text-[var(--color-text)] tracking-tight">
            Settings
          </h1>
          <p className="text-[var(--text-body)] text-[var(--color-text-muted)] mt-1 font-sans">
            Manage your account preferences and study goals.
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-8">
        <section className="bg-surface border border-border rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] p-8">
          <h2 className="text-xl font-display font-medium text-[var(--color-text)] mb-6">
            Profile Information
          </h2>
          <div className="flex flex-col gap-6">
            <div>
              <label className="block text-[var(--text-body-sm)] font-medium text-[var(--color-text)] mb-2">
                Name
              </label>
              <input 
                type="text" 
                defaultValue={student?.name || ""}
                disabled
                className="w-full max-w-md p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text)] font-sans opacity-70 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-[var(--text-body-sm)] font-medium text-[var(--color-text)] mb-2">
                Email Address
              </label>
              <input 
                type="email" 
                defaultValue={user.email || ""}
                disabled
                className="w-full max-w-md p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text)] font-sans opacity-70 cursor-not-allowed"
              />
            </div>
          </div>
        </section>

        <section className="bg-surface border border-border rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] p-8">
          <h2 className="text-xl font-display font-medium text-[var(--color-text)] mb-6">
            Study Preferences
          </h2>
          <div className="flex flex-col gap-6">
            <div>
              <label className="block text-[var(--text-body-sm)] font-medium text-[var(--color-text)] mb-2">
                Daily Goal (Hours)
              </label>
              <input 
                type="number" 
                defaultValue={student?.study_hours_per_day || 2}
                disabled
                className="w-full max-w-xs p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text)] font-sans opacity-70 cursor-not-allowed"
              />
            </div>
            
            <div className="pt-4">
              <Button disabled className="bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 opacity-70 cursor-not-allowed">
                Save Changes
              </Button>
              <p className="text-[var(--text-caption)] text-[var(--color-text-muted)] mt-3">
                Settings editing is disabled in this preview.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
