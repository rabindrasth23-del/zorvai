"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import RoleToggle from "./RoleToggle";

const navLinks = [
  { label: "Pricing", href: "#pricing" },
  { label: "How it works", href: "#how-it-works" },
];

export default function MobileNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileOpen}
        className="bg-transparent border-none text-[var(--color-text)] p-[var(--space-2)] cursor-pointer"
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-45"
              aria-hidden="true"
            />
            {/* Drawer */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { x: "100%" }}
              animate={shouldReduceMotion ? { opacity: 1 } : { x: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              role="dialog"
              aria-label="Navigation menu"
              className="fixed top-0 right-0 bottom-0 w-[min(320px,85vw)] bg-[var(--color-surface)] z-50 flex flex-col px-[var(--space-6)] py-[var(--space-8)] shadow-[var(--shadow-xl)]"
            >
              <div className="flex justify-end mb-[var(--space-6)]">
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="bg-transparent border-none text-[var(--color-text)] cursor-pointer p-[var(--space-2)]"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-[var(--space-8)]">
                <RoleToggle />
              </div>

              <nav className="flex flex-col gap-[var(--space-1)]">
                {navLinks.map((link, i) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    initial={shouldReduceMotion ? false : { opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.25 }}
                    className="font-sans text-[var(--text-h4)] font-medium text-[var(--color-text)] no-underline px-[var(--space-4)] py-[var(--space-3)] rounded-[var(--radius-sm)] hover:bg-[var(--color-muted)] transition-colors duration-200"
                  >
                    {link.label}
                  </motion.a>
                ))}
              </nav>

              <div className="mt-auto flex flex-col gap-[var(--space-3)]">
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="font-sans text-[var(--text-body)] font-semibold text-white bg-[var(--color-accent)] no-underline text-center p-[var(--space-3)] rounded-[var(--radius-full)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow duration-200"
                >
                  Start free session
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
