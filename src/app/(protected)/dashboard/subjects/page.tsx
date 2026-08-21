import { createClient } from "@/lib/supabase/server";
import { CircularProgress } from "@/components/ui/circular-progress";
import { BookOpen } from "lucide-react";

export default async function SubjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: student, error } = await supabase
    .from('students')
    .select('subjects')
    .eq('id', user.id)
    .single();

  if (error || !student) {
    throw new Error(`Critical State Error: Failed to load student profile.`);
  }

  const subjects = student.subjects || [];

  return (
    <div className="flex flex-col gap-8 animate-element h-full max-w-5xl mx-auto py-12 px-4 md:px-8">
      <header className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-display text-[var(--color-text)] tracking-tight">
            Subjects & Mastery
          </h1>
          <p className="text-[var(--text-body)] text-[var(--color-text-muted)] mt-1 font-sans">
            Track your progress and mastery level across all your subjects.
          </p>
        </div>
      </header>

      <section className="flex flex-col gap-6 mt-4">
        {subjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject: string, idx: number) => (
              <div key={subject} className="p-8 bg-surface border border-border rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] flex flex-col items-center gap-8">
                <h3 className="font-display font-medium text-[var(--color-text)] text-xl w-full text-center">
                  {subject}
                </h3>
                <CircularProgress 
                  value={0} 
                  label="Mastery Level"
                  colorClass={idx % 2 === 0 ? "text-[var(--color-success)]" : "text-[var(--color-primary)]"}
                />
                <p className="text-[var(--text-caption)] text-[var(--color-text-muted)] font-sans text-center -mt-2">
                  Complete sessions to build mastery.
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 bg-surface border border-border rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] flex flex-col items-center text-center max-w-2xl mx-auto w-full">
            <h3 className="font-display font-medium text-[var(--color-text)] text-xl mb-2">No subjects found.</h3>
            <p className="text-[var(--text-body)] text-[var(--color-text-muted)] font-sans max-w-md">
              Update your study plan settings to select the subjects you want to focus on.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
