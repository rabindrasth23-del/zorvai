import Link from "next/link";

export default function RoleToggle() {
  return (
    <div className="flex bg-[var(--color-muted)] p-[var(--space-1)] rounded-[var(--radius-full)] relative">
      <Link
        href="/login?role=student"
        className="relative px-[var(--space-4)] py-[var(--space-1)] rounded-[var(--radius-full)] bg-[var(--color-primary)] font-sans text-[var(--text-body-sm)] font-medium capitalize z-10 transition-colors duration-200 text-[var(--color-on-primary)] no-underline"
      >
        student
      </Link>
      
      <Link
        href="#waitlist"
        className="relative px-[var(--space-4)] py-[var(--space-1)] rounded-[var(--radius-full)] bg-transparent font-sans text-[var(--text-body-sm)] font-medium capitalize z-10 transition-colors duration-200 text-[var(--color-text-muted)] hover:text-[var(--color-text)] no-underline flex items-center gap-2 group"
      >
        parent
        {/* Subtle tooltip or "soon" badge could go here if requested, but linking to waitlist is self-explanatory when clicked */}
      </Link>
    </div>
  );
}
