"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/* =============================================================================
   PARENT SIDEBAR
   Desktop: 220px fixed left sidebar with dark theme
   Mobile: Bottom navigation bar (icons only, 5 items max)
   ============================================================================= */

const icons = {
  home: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  chart: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  people: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  shield: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  card: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  gear: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  clock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
};

const parentNavItems = [
  { href: "/parent/dashboard", label: "Overview", icon: icons.home },
  { href: "/parent/progress", label: "Progress", icon: icons.chart },
  { href: "/parent/history", label: "Session History", icon: icons.clock },
  { href: "/parent/community", label: "Community", icon: icons.people, hasBadge: true },
  { href: "/parent/guarantee", label: "Guarantee", icon: icons.shield },
  { href: "/parent/billing", label: "Billing", icon: icons.card },
  { href: "/parent/settings", label: "Settings", icon: icons.gear },
];

const mobileNavItems = parentNavItems.slice(0, 5);

interface ParentSidebarProps {
  parentName?: string;
}

export function ParentSidebar({ parentName }: ParentSidebarProps) {
  const pathname = usePathname();
  const supabase = createClient();
  const [name, setName] = useState(parentName || "Parent");
  const [initials, setInitials] = useState("P");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!parentName) {
      const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const displayName = user.user_metadata?.name || user.email?.split("@")[0] || "Parent";
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
    } else {
      setInitials(
        parentName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      );
    }
  }, [parentName, supabase]);

  // Fetch unread community count
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/community/unread-count");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count || 0);
        }
      } catch {
        // Silently fail — badge just won't show
      }
    };
    fetchUnread();
  }, []);

  const isActive = (href: string) => {
    if (href === "/parent/dashboard") return pathname === "/parent/dashboard";
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
          {parentNavItems.map((item) => {
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
                  position: "relative",
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
                <span style={{ position: "relative", display: "inline-flex" }}>
                  {item.icon}
                  {item.hasBadge && unreadCount > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: "-4px",
                        right: "-6px",
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        background: "var(--dash-teal)",
                        color: "var(--dash-bg)",
                        fontSize: "9px",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "system-ui, -apple-system, sans-serif",
                      }}
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </span>
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
              Parent
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
                position: "relative",
              }}
            >
              <span style={{ position: "relative", display: "inline-flex" }}>
                {item.icon}
                {item.hasBadge && unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-4px",
                      right: "-6px",
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      background: "var(--dash-teal)",
                      color: "var(--dash-bg)",
                      fontSize: "8px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
