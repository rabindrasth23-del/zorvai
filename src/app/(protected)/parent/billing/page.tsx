"use client";

import { useState } from "react";
import { DashboardCard, SectionHeader, DashButton } from "@/components/dashboard/dashboard-primitives";

/* =============================================================================
   PARENT BILLING PAGE
   Route: /parent/billing
   Current plan, invoices, payment method management.
   ============================================================================= */

export default function BillingPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="dash-page-enter" style={{ maxWidth: "640px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 500, color: "var(--dash-text)", marginBottom: "24px" }}>
        Billing
      </h1>

      {/* Current Plan */}
      <DashboardCard padding="24px" className="mb-5">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <span style={{ fontSize: "12px", color: "var(--dash-muted)", display: "block" }}>Current plan</span>
            <span style={{ fontSize: "20px", fontWeight: 600, color: "var(--dash-text)", display: "block", marginTop: "4px" }}>
              Zorvai Premium
            </span>
            <span style={{ fontSize: "13px", color: "var(--dash-muted)", display: "block", marginTop: "2px" }}>
              £49/month · Next billing: Oct 4, 2026
            </span>
          </div>
          <DashButton variant="secondary">Manage plan</DashButton>
        </div>
      </DashboardCard>

      {/* Payment Method */}
      <DashboardCard padding="24px" className="mb-5">
        <SectionHeader title="Payment method" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginTop: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px", height: "28px", borderRadius: "4px",
              background: "var(--dash-raised)", border: "1px solid var(--dash-border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "10px", color: "var(--dash-muted)", fontWeight: 600,
            }}>
              VISA
            </div>
            <div>
              <div style={{ fontSize: "14px", color: "var(--dash-text)" }}>•••• •••• •••• 4242</div>
              <div style={{ fontSize: "12px", color: "var(--dash-muted)" }}>Expires 12/2028</div>
            </div>
          </div>
          <button
            style={{ fontSize: "13px", color: "var(--dash-teal)", background: "transparent", border: "none", cursor: "pointer" }}
          >
            Update
          </button>
        </div>
      </DashboardCard>

      {/* Invoices */}
      <DashboardCard padding="24px">
        <SectionHeader title="Invoices" />
        <div style={{ display: "flex", flexDirection: "column", marginTop: "8px" }}>
          {[
            { date: "Sep 4, 2026", amount: "£49.00", status: "Paid" },
            { date: "Aug 4, 2026", amount: "£49.00", status: "Paid" },
            { date: "Jul 4, 2026", amount: "£49.00", status: "Paid" },
          ].map((inv, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                borderBottom: i < 2 ? "1px solid var(--dash-raised)" : "none",
              }}
            >
              <span style={{ fontSize: "14px", color: "var(--dash-text)" }}>{inv.date}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <span style={{ fontSize: "14px", color: "var(--dash-text)" }}>{inv.amount}</span>
                <span style={{ fontSize: "12px", color: "var(--dash-success)" }}>{inv.status}</span>
                <button style={{ fontSize: "12px", color: "var(--dash-teal)", background: "transparent", border: "none", cursor: "pointer" }}>
                  PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>
    </div>
  );
}
