"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";

export default function NavScrollWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={shouldReduceMotion ? false : { y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled 
          ? "bg-[var(--color-surface)] border-b border-[var(--color-border)] shadow-[var(--shadow-sm)]" 
          : "bg-transparent border-b border-transparent shadow-none"
      }`}
    >
      {children}
    </motion.header>
  );
}
