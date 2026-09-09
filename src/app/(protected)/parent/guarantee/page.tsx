"use client";

import { DashboardCard, SectionHeader, AnimatedProgressBar, DashButton, CountUp } from "@/components/dashboard/dashboard-primitives";

/* =============================================================================
   PARENT GUARANTEE PAGE
   Route: /parent/guarantee
   Guarantee progress tracker, FAQ, refund claim button.
   ============================================================================= */

export default function GuaranteePage() {
  return (
    <div className="dash-page-enter" style={{ maxWidth: "640px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 500, color: "var(--dash-text)", marginBottom: "24px" }}>
        Improvement Guarantee
      </h1>

      {/* Main Guarantee Card */}
      <DashboardCard padding="28px" className="mb-5">
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "14px", color: "var(--dash-muted)", marginBottom: "8px" }}>Sessions completed</div>
          <div style={{ fontSize: "48px", fontWeight: 700, color: "var(--dash-teal)", fontFamily: "monospace" }}>
            <CountUp end={8} /> <span style={{ fontSize: "28px", color: "var(--dash-dim)" }}>/ 12</span>
          </div>
        </div>
        <AnimatedProgressBar value={8} max={12} height={8} />
        <p style={{ fontSize: "13px", color: "var(--dash-muted)", textAlign: "center", marginTop: "12px" }}>
          4 more sessions to qualify · 18 days remaining
        </p>
      </DashboardCard>

      {/* How it works */}
      <DashboardCard padding="24px" className="mb-5">
        <SectionHeader title="How the guarantee works" />
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "12px" }}>
          {[
            { step: "1", title: "Complete 12 sessions", desc: "Your child completes at least 12 AI tutoring sessions within the guarantee window." },
            { step: "2", title: "Take the follow-up quiz", desc: "A follow-up assessment measures improvement compared to the baseline quiz." },
            { step: "3", title: "See improvement or get a refund", desc: "If scores don't improve by at least one grade level, you receive a full refund." },
          ].map((item) => (
            <div key={item.step} style={{ display: "flex", gap: "14px" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%",
                background: "var(--dash-teal-bg)", border: "1px solid var(--dash-teal-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "13px", fontWeight: 600, color: "var(--dash-teal)", flexShrink: 0,
              }}>
                {item.step}
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--dash-text)" }}>{item.title}</div>
                <div style={{ fontSize: "13px", color: "var(--dash-muted)", marginTop: "2px", lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>

      {/* Timeline */}
      <DashboardCard padding="24px" className="mb-5">
        <SectionHeader title="Your timeline" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "8px" }}>
          <div>
            <div style={{ fontSize: "12px", color: "var(--dash-muted)" }}>Baseline score</div>
            <div style={{ fontSize: "20px", fontWeight: 600, color: "var(--dash-text)", marginTop: "4px" }}>42%</div>
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "var(--dash-muted)" }}>Current trajectory</div>
            <div style={{ fontSize: "20px", fontWeight: 600, color: "var(--dash-success)", marginTop: "4px" }}>+15%</div>
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "var(--dash-muted)" }}>Follow-up quiz</div>
            <div style={{ fontSize: "14px", color: "var(--dash-text)", marginTop: "4px" }}>Sep 22, 2026</div>
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "var(--dash-muted)" }}>Guarantee expires</div>
            <div style={{ fontSize: "14px", color: "var(--dash-text)", marginTop: "4px" }}>Sep 30, 2026</div>
          </div>
        </div>
      </DashboardCard>

      {/* FAQ */}
      <DashboardCard padding="24px">
        <SectionHeader title="Frequently asked questions" />
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "8px" }}>
          {[
            { q: "What counts as a session?", a: "A completed session means your child went through all three phases: Learn, Recall, and Challenge." },
            { q: "When can I claim a refund?", a: "After completing 12 sessions and taking the follow-up quiz, if scores haven't improved, you can claim within 7 days." },
            { q: "How long does a refund take?", a: "Refunds are processed within 5 business days to your original payment method." },
          ].map((faq, i) => (
            <div key={i}>
              <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--dash-text)" }}>{faq.q}</div>
              <div style={{ fontSize: "13px", color: "var(--dash-muted)", marginTop: "4px", lineHeight: 1.5 }}>{faq.a}</div>
            </div>
          ))}
        </div>
      </DashboardCard>
    </div>
  );
}
