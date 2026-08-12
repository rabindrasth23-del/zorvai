"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Menu, X } from "lucide-react";
import Link from "next/link";

const navLinks = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "For Parents", href: "#parents" },
  { label: "Guarantee", href: "#guarantee" },
];

const microTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 25,
  mass: 0.5,
};

export default function Navbar() {
  const shouldReduceMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
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
      <motion.nav
        initial={shouldReduceMotion ? false : { y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-40"
        style={{
          background: scrolled ? "var(--color-surface)" : "transparent",
          borderBottom: scrolled
            ? "1px solid var(--color-border)"
            : "1px solid transparent",
          boxShadow: scrolled ? "var(--shadow-sm)" : "none",
          transition:
            "background 300ms ease, border-color 300ms ease, box-shadow 300ms ease",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 var(--space-6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "64px",
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--color-primary)",
              textDecoration: "none",
              letterSpacing: "-0.02em",
            }}
          >
            Zorvai
          </Link>

          {/* Desktop Nav */}
          <div
            className="nav-desktop-links"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-8)",
            }}
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                style={{
                  fontFamily: "var(--font-inter), system-ui, sans-serif",
                  fontSize: "var(--text-body-sm)",
                  fontWeight: 500,
                  color: "var(--color-text-muted)",
                  textDecoration: "none",
                  transition: "color 200ms ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--color-text)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--color-text-muted)")
                }
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop Auth Actions */}
          <div
            className="nav-desktop-actions"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-4)",
            }}
          >
            <Link
              href="/login"
              style={{
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                fontSize: "var(--text-body-sm)",
                fontWeight: 500,
                color: "var(--color-text-muted)",
                textDecoration: "none",
                transition: "color 200ms ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--color-text)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--color-text-muted)")
              }
            >
              Log in
            </Link>
            <motion.div
              whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
              transition={microTransition}
            >
              <Link
                href="/signup"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  fontFamily: "var(--font-inter), system-ui, sans-serif",
                  fontSize: "var(--text-body-sm)",
                  fontWeight: 600,
                  color: "#FFFFFF",
                  background: "var(--color-accent)",
                  padding: "var(--space-2) var(--space-5)",
                  borderRadius: "var(--radius-md)",
                  textDecoration: "none",
                  boxShadow: "var(--shadow-sm)",
                  transition: "box-shadow 200ms ease",
                }}
              >
                Get Started
              </Link>
            </motion.div>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="nav-mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            style={{
              display: "none",
              background: "none",
              border: "none",
              color: "var(--color-text)",
              padding: "var(--space-2)",
              cursor: "pointer",
            }}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Drawer */}
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
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(43, 42, 40, 0.4)",
                backdropFilter: "blur(4px)",
                zIndex: 45,
              }}
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
              style={{
                position: "fixed",
                top: 0,
                right: 0,
                bottom: 0,
                width: "min(320px, 85vw)",
                background: "var(--color-surface)",
                zIndex: 50,
                display: "flex",
                flexDirection: "column",
                padding: "var(--space-8) var(--space-6)",
                boxShadow: "var(--shadow-xl)",
              }}
            >
              {/* Close */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: "var(--space-8)",
                }}
              >
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-text)",
                    cursor: "pointer",
                    padding: "var(--space-2)",
                  }}
                >
                  <X size={24} />
                </button>
              </div>

              {/* Mobile Nav Links */}
              <nav
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-1)",
                }}
              >
                {navLinks.map((link, i) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    initial={
                      shouldReduceMotion
                        ? false
                        : { opacity: 0, x: 20 }
                    }
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.25 }}
                    style={{
                      fontFamily: "var(--font-inter), system-ui, sans-serif",
                      fontSize: "var(--text-h4)",
                      fontWeight: 500,
                      color: "var(--color-text)",
                      textDecoration: "none",
                      padding: "var(--space-3) var(--space-4)",
                      borderRadius: "var(--radius-sm)",
                      transition: "background 200ms ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--color-muted)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    {link.label}
                  </motion.a>
                ))}
              </nav>

              {/* Mobile Auth */}
              <div
                style={{
                  marginTop: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-3)",
                }}
              >
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  style={{
                    fontFamily: "var(--font-inter), system-ui, sans-serif",
                    fontSize: "var(--text-body)",
                    fontWeight: 500,
                    color: "var(--color-primary)",
                    textDecoration: "none",
                    textAlign: "center",
                    padding: "var(--space-3)",
                    border: "1.5px solid var(--color-primary)",
                    borderRadius: "var(--radius-md)",
                    transition: "background 200ms ease",
                  }}
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  style={{
                    fontFamily: "var(--font-inter), system-ui, sans-serif",
                    fontSize: "var(--text-body)",
                    fontWeight: 600,
                    color: "#FFFFFF",
                    background: "var(--color-accent)",
                    textDecoration: "none",
                    textAlign: "center",
                    padding: "var(--space-3)",
                    borderRadius: "var(--radius-md)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  Get Started
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .nav-desktop-links,
          .nav-desktop-actions {
            display: none !important;
          }
          .nav-mobile-toggle {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}
