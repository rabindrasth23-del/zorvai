"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { DashboardCard, StatCard, CountUp, SectionHeader, StatusChip } from "@/components/dashboard/dashboard-primitives";

/* =============================================================================
   ADMIN USERS PAGE
   Route: /admin/users
   User management with search, filters, table, slide-over panel, pagination
   ============================================================================= */

// Mock data
const mockUsers = [
  { id: "u1", name: "Aarav Sharma", email: "aarav@example.com", role: "student", country: "India", plan: "monthly", joined: "2026-08-15", lastActive: "2 hours ago", status: "active" },
  { id: "u2", name: "Priya Patel", email: "priya@example.com", role: "parent", country: "India", plan: "annual", joined: "2026-08-10", lastActive: "5 min ago", status: "active" },
  { id: "u3", name: "James Wilson", email: "james@example.com", role: "student", country: "USA", plan: "free", joined: "2026-08-20", lastActive: "1 day ago", status: "active" },
  { id: "u4", name: "Fatima Al-Hassan", email: "fatima@example.com", role: "parent", country: "UAE", plan: "monthly", joined: "2026-07-28", lastActive: "3 hours ago", status: "active" },
  { id: "u5", name: "Rabindra Shrestha", email: "rabindra@example.com", role: "student", country: "Nepal", plan: "annual", joined: "2026-06-01", lastActive: "10 min ago", status: "active" },
  { id: "u6", name: "Sophie Chen", email: "sophie@example.com", role: "student", country: "Canada", plan: "monthly", joined: "2026-08-22", lastActive: "4 hours ago", status: "active" },
  { id: "u7", name: "Maria Garcia", email: "maria@example.com", role: "parent", country: "Spain", plan: "free", joined: "2026-08-25", lastActive: "1 week ago", status: "suspended" },
  { id: "u8", name: "Aditya Kumar", email: "aditya@example.com", role: "student", country: "India", plan: "annual", joined: "2026-07-15", lastActive: "30 min ago", status: "active" },
  { id: "u9", name: "Prince Thapa", email: "prince@example.com", role: "student", country: "Nepal", plan: "monthly", joined: "2026-08-01", lastActive: "1 hour ago", status: "active" },
  { id: "u10", name: "Emily Park", email: "emily@example.com", role: "parent", country: "South Korea", plan: "annual", joined: "2026-08-18", lastActive: "20 min ago", status: "active" },
];

export default function AdminUsersPage() {
  const shouldReduceMotion = useReducedMotion();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<typeof mockUsers[0] | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 20;

  const filtered = mockUsers.filter(u => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (planFilter !== "all" && u.plan !== planFilter) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <motion.div
      className="dash-page-enter"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--dash-text)", fontFamily: "system-ui" }}>Users</h1>
          <p style={{ fontSize: "14px", color: "var(--dash-muted)", marginTop: "4px" }}>{mockUsers.length} total users</p>
        </div>
        <button
          style={{ padding: "8px 16px", fontSize: "13px", fontWeight: 500, color: "var(--dash-muted)", background: "var(--dash-surface)", border: "1px solid var(--dash-border)", borderRadius: "var(--dash-radius-inner)", cursor: "pointer", fontFamily: "system-ui" }}
          onClick={() => alert("CSV export coming soon")}
        >
          Export CSV
        </button>
      </div>

      {/* Search + Filters */}
      <DashboardCard padding="14px 16px" className="mb-4" style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: "200px", padding: "8px 12px", fontSize: "13px", color: "var(--dash-text)", background: "var(--dash-bg)", border: "1px solid var(--dash-border)", borderRadius: "var(--dash-radius-inner)", outline: "none", fontFamily: "system-ui" }}
          />
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ padding: "8px 12px", fontSize: "13px", color: "var(--dash-text)", background: "var(--dash-bg)", border: "1px solid var(--dash-border)", borderRadius: "var(--dash-radius-inner)", fontFamily: "system-ui" }}>
            <option value="all">All roles</option>
            <option value="student">Students</option>
            <option value="parent">Parents</option>
          </select>
          <select value={planFilter} onChange={e => setPlanFilter(e.target.value)} style={{ padding: "8px 12px", fontSize: "13px", color: "var(--dash-text)", background: "var(--dash-bg)", border: "1px solid var(--dash-border)", borderRadius: "var(--dash-radius-inner)", fontFamily: "system-ui" }}>
            <option value="all">All plans</option>
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
            <option value="free">Free</option>
          </select>
        </div>
      </DashboardCard>

      {/* Table */}
      <DashboardCard padding="0" style={{ marginBottom: "16px" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", fontFamily: "system-ui" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--dash-border)" }}>
                {["Name", "Email", "Role", "Country", "Plan", "Joined", "Last active", ""].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "var(--dash-dim)", fontWeight: 500, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map(user => (
                <tr
                  key={user.id}
                  style={{ borderBottom: "1px solid var(--dash-border)", cursor: "pointer", background: user.status === "suspended" ? "rgba(251,191,36,0.04)" : "transparent" }}
                  onClick={() => setSelectedUser(user)}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--dash-surface)")}
                  onMouseLeave={e => (e.currentTarget.style.background = user.status === "suspended" ? "rgba(251,191,36,0.04)" : "transparent")}
                >
                  <td style={{ padding: "12px 16px", color: "var(--dash-text)", fontWeight: 500 }}>{user.name}</td>
                  <td style={{ padding: "12px 16px", color: "var(--dash-muted)" }}>{user.email}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ padding: "2px 8px", borderRadius: "99px", fontSize: "11px", fontWeight: 600, background: user.role === "student" ? "var(--dash-teal-bg)" : "rgba(167,139,250,0.08)", color: user.role === "student" ? "var(--dash-teal)" : "var(--dash-purple)", border: `1px solid ${user.role === "student" ? "var(--dash-teal-border)" : "rgba(167,139,250,0.2)"}` }}>
                      {user.role === "student" ? "Student" : "Parent"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--dash-muted)" }}>{user.country}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ padding: "2px 8px", borderRadius: "99px", fontSize: "11px", fontWeight: 600, background: user.plan !== "free" ? "var(--dash-teal-bg)" : "transparent", color: user.plan !== "free" ? "var(--dash-teal)" : "var(--dash-dim)", border: `1px solid ${user.plan !== "free" ? "var(--dash-teal-border)" : "var(--dash-border)"}` }}>
                      {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--dash-muted)" }}>{user.joined}</td>
                  <td style={{ padding: "12px 16px", color: "var(--dash-muted)" }}>{user.lastActive}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <button style={{ color: "var(--dash-dim)", background: "none", border: "none", cursor: "pointer", fontSize: "16px" }}>⋯</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardCard>

      {/* Pagination */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "13px", color: "var(--dash-dim)" }}>Page {page} of {totalPages}</span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "6px 14px", fontSize: "13px", color: "var(--dash-muted)", background: "var(--dash-surface)", border: "1px solid var(--dash-border)", borderRadius: "var(--dash-radius-inner)", cursor: page === 1 ? "default" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>Previous</button>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "6px 14px", fontSize: "13px", color: "var(--dash-muted)", background: "var(--dash-surface)", border: "1px solid var(--dash-border)", borderRadius: "var(--dash-radius-inner)", cursor: page === totalPages ? "default" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}>Next</button>
        </div>
      </div>

      {/* Slide-over Panel */}
      {selectedUser && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={() => setSelectedUser(null)} />
          <motion.div
            initial={{ x: 440 }}
            animate={{ x: 0 }}
            exit={{ x: 440 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            style={{ width: "440px", maxWidth: "100vw", background: "var(--dash-surface)", borderLeft: "1px solid var(--dash-border)", height: "100vh", overflowY: "auto", position: "relative", zIndex: 51, padding: "28px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--dash-text)" }}>User Profile</h2>
              <button onClick={() => setSelectedUser(null)} style={{ color: "var(--dash-dim)", background: "none", border: "none", cursor: "pointer", fontSize: "20px" }}>✕</button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "var(--dash-teal-bg)", border: "1px solid var(--dash-teal-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 600, color: "var(--dash-teal)" }}>
                {selectedUser.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--dash-text)" }}>{selectedUser.name}</p>
                <p style={{ fontSize: "13px", color: "var(--dash-muted)" }}>{selectedUser.email}</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
              {[
                { label: "Role", value: selectedUser.role },
                { label: "Plan", value: selectedUser.plan },
                { label: "Country", value: selectedUser.country },
                { label: "Status", value: selectedUser.status },
                { label: "Joined", value: selectedUser.joined },
                { label: "Last active", value: selectedUser.lastActive },
              ].map(item => (
                <div key={item.label} style={{ padding: "10px 14px", background: "var(--dash-bg)", borderRadius: "var(--dash-radius-inner)", border: "1px solid var(--dash-border)" }}>
                  <p style={{ fontSize: "11px", color: "var(--dash-dim)", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</p>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--dash-text)", textTransform: "capitalize" }}>{item.value}</p>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid var(--dash-border)", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <button style={{ padding: "10px", fontSize: "13px", color: "var(--dash-amber)", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: "var(--dash-radius-inner)", cursor: "pointer", fontFamily: "system-ui" }}>Suspend account</button>
              <button style={{ padding: "10px", fontSize: "13px", color: "var(--dash-danger)", background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: "var(--dash-radius-inner)", cursor: "pointer", fontFamily: "system-ui" }}>Delete account</button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
