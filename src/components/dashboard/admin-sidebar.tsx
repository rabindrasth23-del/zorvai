"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/* =============================================================================
   ADMIN SIDEBAR
   Desktop: 220px fixed left sidebar, darker background
   Admin-specific navigation with user/session/revenue links
   ============================================================================= */

const icons = {
  grid: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  activity: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  dollar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  ),
  gear: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  list: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  book: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  ),
  flag: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  ),
  shield: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  alert: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  trending: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  upload: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
};

const adminNavItems = [
  { href: "/admin", label: "Overview", icon: icons.grid },
  { href: "/admin/guarantee", label: "Guarantee Queue", icon: icons.shield },
  { href: "/admin/escalations", label: "Escalations", icon: icons.alert },
  { href: "/admin/users", label: "Users", icon: icons.users },
  { href: "/admin/sessions", label: "Sessions", icon: icons.activity },
  { href: "/admin/waitlist", label: "Waitlist", icon: icons.list },
  { href: "/admin/costs", label: "Usage & Costs", icon: icons.trending },
  { href: "/admin/revenue", label: "Revenue", icon: icons.dollar },
  { href: "/admin/content", label: "Curriculum", icon: icons.book },
  { href: "/admin/materials", label: "Material Mod.", icon: icons.upload },
  { href: "/admin/flags", label: "Safety Flags", icon: icons.flag },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <aside
      style={{
        width: "var(--dash-sidebar-w)",
        background: "var(--dash-admin-sidebar)",
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
      <div style={{ padding: "20px", borderBottom: "1px solid var(--dash-border)", display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--dash-text)", letterSpacing: "-0.02em" }}>
          Zorvai
        </span>
        <span style={{ fontSize: "11px", color: "var(--dash-amber)", fontWeight: 600, background: "rgba(251,191,36,0.1)", padding: "2px 6px", borderRadius: "4px" }}>
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav style={{ padding: "10px 8px", flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
        {adminNavItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "9px 12px", borderRadius: "var(--dash-radius-inner)",
                fontSize: "14px", fontFamily: "system-ui, -apple-system, sans-serif",
                fontWeight: active ? 500 : 400,
                color: active ? "var(--dash-teal)" : "var(--dash-muted)",
                background: active ? "var(--dash-teal-bg)" : "transparent",
                borderLeft: active ? "2px solid var(--dash-teal)" : "2px solid transparent",
                transition: "all 150ms ease", textDecoration: "none",
              }}
              onMouseEnter={(e) => { if (!active) { e.currentTarget.style.color = "var(--dash-text)"; e.currentTarget.style.background = "var(--dash-surface)"; } }}
              onMouseLeave={(e) => { if (!active) { e.currentTarget.style.color = "var(--dash-muted)"; e.currentTarget.style.background = "transparent"; } }}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Admin user */}
      <div style={{ padding: "16px", borderTop: "1px solid var(--dash-border)", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 600, color: "var(--dash-amber)", flexShrink: 0 }}>
          AD
        </div>
        <div style={{ overflow: "hidden" }}>
          <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--dash-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Admin
          </div>
          <div style={{ fontSize: "11px", color: "var(--dash-dim)" }}>Super Admin</div>
        </div>
      </div>
    </aside>
  );
}
