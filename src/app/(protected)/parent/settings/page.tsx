"use client";

import { useState } from "react";
import { DashboardCard, SectionHeader, DashButton } from "@/components/dashboard/dashboard-primitives";

/* =============================================================================
   PARENT SETTINGS PAGE
   Route: /parent/settings
   Account settings, notification preferences, linked child accounts.
   ============================================================================= */

export default function ParentSettingsPage() {
  const [name, setName] = useState("Jordan Johnson");
  const [notifications, setNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="dash-page-enter" style={{ maxWidth: "640px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 500, color: "var(--dash-text)", marginBottom: "24px" }}>
        Settings
      </h1>

      <DashboardCard padding="24px" className="mb-5">
        <SectionHeader title="Account" />
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "12px" }}>
          <div>
            <label style={{ fontSize: "12px", color: "var(--dash-muted)", display: "block", marginBottom: "6px" }}>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", background: "var(--dash-raised)", border: "1px solid var(--dash-border)", borderRadius: "var(--dash-radius-inner)", color: "var(--dash-text)", fontSize: "14px", outline: "none", fontFamily: "system-ui, -apple-system, sans-serif" }}
            />
          </div>
        </div>
      </DashboardCard>

      <DashboardCard padding="24px" className="mb-5">
        <SectionHeader title="Linked children" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--dash-teal-bg)", border: "1px solid var(--dash-teal-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 600, color: "var(--dash-teal)" }}>
              AJ
            </div>
            <div>
              <div style={{ fontSize: "14px", color: "var(--dash-text)" }}>Alex Johnson</div>
              <div style={{ fontSize: "12px", color: "var(--dash-muted)" }}>5-day streak · Last active 2h ago</div>
            </div>
          </div>
          <span style={{ fontSize: "12px", color: "var(--dash-success)" }}>Active</span>
        </div>
      </DashboardCard>

      <DashboardCard padding="24px" className="mb-5">
        <SectionHeader title="Notifications" />
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "12px" }}>
          <ToggleRow label="Daily session updates" description="Get notified when your child completes a session" checked={notifications} onChange={setNotifications} />
          <ToggleRow label="Weekly digest" description="Summary of progress every Sunday" checked={weeklyDigest} onChange={setWeeklyDigest} />
        </div>
      </DashboardCard>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
        {saved && <span style={{ fontSize: "13px", color: "var(--dash-success)", alignSelf: "center" }}>Saved ✓</span>}
        <DashButton variant="primary" onClick={handleSave}>Save changes</DashButton>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
      <div>
        <div style={{ fontSize: "14px", color: "var(--dash-text)" }}>{label}</div>
        <div style={{ fontSize: "12px", color: "var(--dash-muted)", marginTop: "2px" }}>{description}</div>
      </div>
      <button onClick={() => onChange(!checked)} style={{ width: "44px", height: "24px", borderRadius: "12px", background: checked ? "var(--dash-teal)" : "var(--dash-raised)", border: `1px solid ${checked ? "var(--dash-teal)" : "var(--dash-border)"}`, cursor: "pointer", position: "relative", transition: "all 200ms ease", flexShrink: 0 }}>
        <span style={{ position: "absolute", top: "2px", left: checked ? "22px" : "2px", width: "18px", height: "18px", borderRadius: "50%", background: checked ? "var(--dash-bg)" : "var(--dash-muted)", transition: "all 200ms ease" }} />
      </button>
    </div>
  );
}
