"use client";

import { useState } from "react";
import { DashboardCard, SectionHeader, DashButton } from "@/components/dashboard/dashboard-primitives";

/* =============================================================================
   SETTINGS PAGE — Student Settings
   Route: /settings
   Profile info, study preferences, notification settings.
   ============================================================================= */

export default function SettingsPage() {
  const [name, setName] = useState("Alex Johnson");
  const [email] = useState("alex@example.com");
  const [studyHours, setStudyHours] = useState("2");
  const [notifications, setNotifications] = useState(true);
  const [emailReminders, setEmailReminders] = useState(false);
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

      {/* Profile */}
      <DashboardCard padding="24px" className="mb-5">
        <SectionHeader title="Profile" />
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "12px" }}>
          <div>
            <label style={{ fontSize: "12px", color: "var(--dash-muted)", display: "block", marginBottom: "6px" }}>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "var(--dash-raised)",
                border: "1px solid var(--dash-border)",
                borderRadius: "var(--dash-radius-inner)",
                color: "var(--dash-text)",
                fontSize: "14px",
                fontFamily: "system-ui, -apple-system, sans-serif",
                outline: "none",
                transition: "border-color 200ms ease",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--dash-teal)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--dash-border)"; }}
            />
          </div>
          <div>
            <label style={{ fontSize: "12px", color: "var(--dash-muted)", display: "block", marginBottom: "6px" }}>Email</label>
            <input
              value={email}
              disabled
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "var(--dash-bg)",
                border: "1px solid var(--dash-border)",
                borderRadius: "var(--dash-radius-inner)",
                color: "var(--dash-dim)",
                fontSize: "14px",
                fontFamily: "system-ui, -apple-system, sans-serif",
              }}
            />
          </div>
        </div>
      </DashboardCard>

      {/* Study Preferences */}
      <DashboardCard padding="24px" className="mb-5">
        <SectionHeader title="Study preferences" />
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "12px" }}>
          <div>
            <label style={{ fontSize: "12px", color: "var(--dash-muted)", display: "block", marginBottom: "6px" }}>
              Daily study hours
            </label>
            <select
              value={studyHours}
              onChange={(e) => setStudyHours(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "var(--dash-raised)",
                border: "1px solid var(--dash-border)",
                borderRadius: "var(--dash-radius-inner)",
                color: "var(--dash-text)",
                fontSize: "14px",
                fontFamily: "system-ui, -apple-system, sans-serif",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="1">1 hour</option>
              <option value="2">2 hours</option>
              <option value="3">3 hours</option>
              <option value="4">4+ hours</option>
            </select>
          </div>
        </div>
      </DashboardCard>

      {/* Notifications */}
      <DashboardCard padding="24px" className="mb-5">
        <SectionHeader title="Notifications" />
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "12px" }}>
          <ToggleRow
            label="Push notifications"
            description="Get reminded about upcoming sessions"
            checked={notifications}
            onChange={setNotifications}
          />
          <ToggleRow
            label="Email reminders"
            description="Weekly progress report via email"
            checked={emailReminders}
            onChange={setEmailReminders}
          />
        </div>
      </DashboardCard>

      {/* Save */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
        {saved && (
          <span style={{ fontSize: "13px", color: "var(--dash-success)", alignSelf: "center" }}>
            Settings saved ✓
          </span>
        )}
        <DashButton variant="primary" onClick={handleSave}>
          Save changes
        </DashButton>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <div>
        <div style={{ fontSize: "14px", color: "var(--dash-text)" }}>{label}</div>
        <div style={{ fontSize: "12px", color: "var(--dash-muted)", marginTop: "2px" }}>{description}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: "44px",
          height: "24px",
          borderRadius: "12px",
          background: checked ? "var(--dash-teal)" : "var(--dash-raised)",
          border: `1px solid ${checked ? "var(--dash-teal)" : "var(--dash-border)"}`,
          cursor: "pointer",
          position: "relative",
          transition: "all 200ms ease",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "2px",
            left: checked ? "22px" : "2px",
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            background: checked ? "var(--dash-bg)" : "var(--dash-muted)",
            transition: "all 200ms ease",
          }}
        />
      </button>
    </div>
  );
}
