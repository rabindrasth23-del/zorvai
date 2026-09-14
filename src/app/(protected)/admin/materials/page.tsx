"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  DashboardCard,
  SectionHeader,
  Badge,
} from "@/components/dashboard/dashboard-primitives";

/* =============================================================================
   ADMIN — MATERIAL MODERATION
   Route: /admin/materials
   Spot-check queue for uploaded materials, copyright/inappropriate content flags
   ============================================================================= */

interface MaterialItem {
  id: string;
  student_name: string;
  filename: string;
  subject: string;
  type: string;
  file_size_bytes: number;
  page_count: number | null;
  status: string;
  flags: string[];
  created_at: string;
}

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/materials");
      if (res.ok) {
        const data = await res.json();
        setMaterials(data.materials || []);
      }
    } catch (err) {
      console.error("Failed to fetch materials:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleAction(id: string, action: "approve" | "flag" | "remove") {
    try {
      await fetch(`/api/admin/materials/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      fetchData();
    } catch (err) {
      console.error("Action failed:", err);
    }
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="dash-page-enter" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 500, color: "var(--dash-text)", marginBottom: 8 }}>
        Material Moderation
      </h1>
      <p style={{ fontSize: 13, color: "var(--dash-muted)", marginBottom: 24 }}>
        Spot-check uploaded materials for copyright violations, full scanned textbooks, or inappropriate content.
      </p>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--dash-muted)" }}>Loading…</div>
      ) : materials.length === 0 ? (
        <DashboardCard padding="40px">
          <div style={{ textAlign: "center", color: "var(--dash-muted)" }}>
            No materials to review ✓
          </div>
        </DashboardCard>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {materials.map((m, i) => (
            <motion.div
              key={m.id}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <DashboardCard padding="18px">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "var(--dash-text)" }}>
                        {m.filename}
                      </span>
                      {m.flags.length > 0 && m.flags.map((flag) => (
                        <Badge key={flag} label={flag} color="var(--dash-danger)" />
                      ))}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--dash-muted)" }}>
                      Uploaded by {m.student_name} · {m.subject} · {formatSize(m.file_size_bytes)}
                      {m.page_count ? ` · ${m.page_count} pages` : ""}
                      {m.page_count && m.page_count > 50 && (
                        <span style={{ color: "var(--dash-amber)", marginLeft: 6 }}>
                          ⚠ Large document ({m.page_count} pages — potential full textbook)
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => handleAction(m.id, "approve")}
                      style={{
                        padding: "6px 14px",
                        background: "rgba(74, 222, 128, 0.1)",
                        border: "1px solid rgba(74, 222, 128, 0.3)",
                        borderRadius: 6,
                        fontSize: 12,
                        color: "var(--dash-success)",
                        cursor: "pointer",
                      }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(m.id, "flag")}
                      style={{
                        padding: "6px 14px",
                        background: "rgba(251, 191, 36, 0.1)",
                        border: "1px solid rgba(251, 191, 36, 0.3)",
                        borderRadius: 6,
                        fontSize: 12,
                        color: "var(--dash-amber)",
                        cursor: "pointer",
                      }}
                    >
                      Flag
                    </button>
                    <button
                      onClick={() => handleAction(m.id, "remove")}
                      style={{
                        padding: "6px 14px",
                        background: "rgba(248, 113, 113, 0.1)",
                        border: "1px solid rgba(248, 113, 113, 0.3)",
                        borderRadius: 6,
                        fontSize: 12,
                        color: "var(--dash-danger)",
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </DashboardCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
