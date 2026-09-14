"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { createClient } from "@/lib/supabase/client";

/* =============================================================================
   STUDENT SIDEBAR
   Desktop: 220px fixed left sidebar with dark theme
   Mobile: Bottom navigation bar (icons only, 5 items max)
   ============================================================================= */

// ─── SVG Icons (inline, stroke-based, 18px) ─────────────────────────────────

const icons = {
  home: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  play: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" />
    </svg>
  ),
  calendar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  message: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  ),
  chart: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  gear: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  book: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  ),
  exam: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  refresh: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
    </svg>
  ),
  camera: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
};

const studentNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: icons.home },
  { href: "/session", label: "Today's Session", icon: icons.play },
  { href: "/plan", label: "My Plan", icon: icons.calendar },
  { href: "/materials", label: "Material Library", icon: icons.book },
  { href: "/mock-exam", label: "Mock Exams", icon: icons.exam },
  { href: "/review", label: "Review Deck", icon: icons.refresh },
  { href: "/solve", label: "Snap & Solve", icon: icons.camera },
  { href: "/chat", label: "Chat", icon: icons.message },
  { href: "/progress", label: "Progress", icon: icons.chart },
  { href: "/settings", label: "Settings", icon: icons.gear },
];

// Mobile bottom nav only shows 5 items
const mobileNavItems = [
  studentNavItems[0], // Dashboard
  studentNavItems[1], // Today's Session
  studentNavItems[3], // Material Library
  studentNavItems[6], // Chat
  studentNavItems[7], // Progress
];

interface StudentSidebarProps {
  studentName?: string;
  studentInitials?: string;
}

export function StudentSidebar({ studentName, studentInitials }: StudentSidebarProps) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const supabase = createClient();
  const [name, setName] = useState(studentName || "Student");
  const [initials, setInitials] = useState(studentInitials || "S");

  // Fetch student info if not provided
  useEffect(() => {
    if (!studentName) {
      const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const displayName = user.user_metadata?.name || user.email?.split("@")[0] || "Student";
          setName(displayName);
          setInitials(
            displayName
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
          );
        }
      };
      fetchUser();
    }
  }, [studentName, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* ═══ Desktop Sidebar ═══ */}
      <aside
        style={{
          width: "var(--dash-sidebar-w)",
          background: "var(--dash-bg)",
          borderRight: "1px solid var(--dash-border)",
          height: "100vh",
          position: "sticky",
          top: 0,
          display: "flex",
          flexDirection: "column",
          zIndex: 30,
          flexShrink: 0,
        }}
        className="hidden md:flex"
      >
        {/* Logo */}
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid var(--dash-border)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--dash-text)",
              fontFamily: "system-ui, -apple-system, sans-serif",
              letterSpacing: "-0.02em",
            }}
          >
            Zorvai
          </span>
          <span
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              background: "var(--dash-teal)",
              display: "inline-block",
            }}
          />
        </div>

        {/* Navigation */}
        <nav style={{ padding: "10px 8px", flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
          {studentNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "9px 12px",
                  borderRadius: "var(--dash-radius-inner)",
                  fontSize: "14px",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  fontWeight: active ? 500 : 400,
                  color: active ? "var(--dash-teal)" : "var(--dash-muted)",
                  background: active ? "var(--dash-teal-bg)" : "transparent",
                  borderLeft: active ? "2px solid var(--dash-teal)" : "2px solid transparent",
                  transition: "all 150ms ease",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = "var(--dash-text)";
                    e.currentTarget.style.background = "var(--dash-surface)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = "var(--dash-muted)";
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div
          style={{
            padding: "16px",
            borderTop: "1px solid var(--dash-border)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "var(--dash-teal-bg)",
              border: "1px solid var(--dash-teal-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--dash-teal)",
              fontFamily: "system-ui, -apple-system, sans-serif",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--dash-text)",
                fontFamily: "system-ui, -apple-system, sans-serif",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {name}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--dash-dim)",
                fontFamily: "system-ui, -apple-system, sans-serif",
              }}
            >
              Student
            </div>
          </div>
        </div>
      </aside>

      {/* ═══ Mobile Bottom Nav ═══ */}
      <nav
        className="md:hidden"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "var(--dash-bg)",
          borderTop: "1px solid var(--dash-border)",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          padding: "8px 0 env(safe-area-inset-bottom, 8px)",
          zIndex: 50,
        }}
      >
        {mobileNavItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "6px 12px",
                color: active ? "var(--dash-teal)" : "var(--dash-muted)",
                textDecoration: "none",
                transition: "color 150ms ease",
              }}
            >
              {item.icon}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
