import Link from "next/link";
import NavScrollWrapper from "./NavScrollWrapper";
import RoleToggle from "./RoleToggle";
import MobileNav from "./MobileNav";

export default function Navbar() {
  return (
    <NavScrollWrapper>
      <div className="max-w-[1200px] mx-auto px-[var(--space-6)] flex items-center justify-between h-[72px]">
        
        <div className="flex items-center gap-[var(--space-8)]">
          {/* Logo */}
          <Link
            href="/"
            className="font-display text-[1.5rem] font-bold text-[var(--color-primary)] no-underline tracking-[-0.02em]"
          >
            Zorvai
          </Link>

          {/* Desktop Role Toggle */}
          <div className="hidden md:block">
            <RoleToggle />
          </div>
        </div>

        {/* Desktop Nav Actions */}
        <div className="hidden md:flex items-center gap-[var(--space-6)]">
          <Link
            href="#pricing"
            className="font-sans text-[var(--text-body-sm)] font-medium text-[var(--color-text)] no-underline hover:text-[var(--color-primary)] transition-colors duration-200"
          >
            Pricing
          </Link>
          <Link
            href="#how-it-works"
            className="font-sans text-[var(--text-body-sm)] font-medium text-[var(--color-text)] no-underline hover:text-[var(--color-primary)] transition-colors duration-200"
          >
            How it works
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center font-sans text-[var(--text-body-sm)] font-semibold text-white bg-[var(--color-accent)] px-[var(--space-6)] py-[var(--space-3)] rounded-[var(--radius-full)] no-underline shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-[1px] transition-all duration-200"
          >
            Start free session
          </Link>
        </div>

        {/* Mobile Nav */}
        <div className="flex md:hidden">
          <MobileNav />
        </div>
      </div>
    </NavScrollWrapper>
  );
}
