import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Footer() {
  const linkColumns = [
    {
      title: "GET STARTED",
      links: [
        { label: "Pricing", href: "#pricing" },
        { label: "Privacy & Security", href: "#" },
        { label: "The guarantee", href: "#" },
        { label: "Parent dashboard", href: "#" },
      ],
    },
    {
      title: "STUDENTS",
      links: [
        { label: "Exam prep", href: "#" },
        { label: "School subjects", href: "#" },
        { label: "Programming", href: "#" },
        { label: "Medicine track", href: "#" },
      ],
    },
    {
      title: "RESOURCES",
      links: [
        { label: "How it works", href: "#how-it-works" },
        { label: "Blog", href: "#" },
        { label: "Help center", href: "#" },
      ],
    },
    {
      title: "COMPANY",
      links: [
        { label: "About", href: "#" },
        { label: "Contact", href: "#" },
      ],
    },
  ];

  return (
    <footer className="bg-[var(--color-text)] pt-[var(--space-20)] pb-[var(--space-8)] px-[var(--space-6)] relative z-20">
      <div className="max-w-[1200px] mx-auto">
        
        {/* Products Row (Two Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-6)] mb-[var(--space-20)]">
          
          {/* Card 1: Student */}
          <div className="bg-[var(--color-surface)]/5 border border-white/10 rounded-[var(--radius-xl)] p-[var(--space-8)] md:p-[var(--space-10)] hover:bg-[var(--color-surface)]/10 transition-colors duration-300 flex flex-col items-start text-left">
            <h3 className="font-sans text-[var(--text-h3)] font-bold text-white mb-[var(--space-2)]">
              Zorvai Student
            </h3>
            <p className="font-sans text-[var(--text-body)] text-white/70 mb-[var(--space-8)] max-w-[320px]">
              Your AI study coach — Learn, Recall, Challenge, Feedback.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-[var(--space-2)] font-sans text-[var(--text-body-sm)] font-semibold text-[var(--color-text)] bg-white px-[var(--space-6)] py-[var(--space-3)] rounded-[var(--radius-full)] hover:-translate-y-[1px] transition-transform duration-200 mt-auto"
            >
              Start free session
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Card 2: Parent */}
          <div className="bg-[var(--color-surface)]/5 border border-white/10 rounded-[var(--radius-xl)] p-[var(--space-8)] md:p-[var(--space-10)] hover:bg-[var(--color-surface)]/10 transition-colors duration-300 flex flex-col items-start text-left">
            <h3 className="font-sans text-[var(--text-h3)] font-bold text-white mb-[var(--space-2)]">
              Zorvai Parent
            </h3>
            <p className="font-sans text-[var(--text-body)] text-white/70 mb-[var(--space-8)] max-w-[320px]">
              See real progress, not just screen time.
            </p>
            <Link
              href="/signup-parent"
              className="inline-flex items-center gap-[var(--space-2)] font-sans text-[var(--text-body-sm)] font-semibold text-white bg-[var(--color-surface)]/20 border border-white/20 px-[var(--space-6)] py-[var(--space-3)] rounded-[var(--radius-full)] hover:bg-[var(--color-surface)]/30 hover:-translate-y-[1px] transition-all duration-200 mt-auto"
            >
              Create parent account
              <ArrowRight size={16} />
            </Link>
          </div>

        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[var(--space-8)] md:gap-[var(--space-6)] mb-[var(--space-20)]">
          {linkColumns.map((col) => (
            <div key={col.title} className="flex flex-col gap-[var(--space-4)]">
              <h4 className="font-sans text-[var(--text-caption)] font-bold text-white/50 tracking-wider uppercase">
                {col.title}
              </h4>
              <ul className="flex flex-col gap-[var(--space-3)] list-none p-0 m-0">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="font-sans text-[var(--text-body-sm)] text-white/80 hover:text-white transition-colors duration-200 no-underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-[var(--space-8)] border-t border-white/10 gap-[var(--space-4)] text-center md:text-left">
          <div className="font-display text-[1.25rem] font-bold text-white tracking-[-0.02em]">
            Zorvai
          </div>
          <div className="font-sans text-[var(--text-caption)] text-white/50">
            © {new Date().getFullYear()} Zorvai. All rights reserved.
          </div>
        </div>

      </div>
    </footer>
  );
}
