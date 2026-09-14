"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  DashboardCard,
  SectionHeader,
  Badge,
} from "@/components/dashboard/dashboard-primitives";

/* =============================================================================
   MATERIAL LIBRARY PAGE
   Route: /materials
   Card grid of uploaded files with status chips, upload CTA, empty state.
   ============================================================================= */

interface Material {
  id: string;
  subject: string;
  filename: string;
  type: string;
  status: "queued" | "extracting" | "ready" | "failed";
  page_count: number | null;
  file_size_bytes: number | null;
  error_message: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  queued: { label: "Queued", color: "var(--dash-amber)" },
  extracting: { label: "Extracting…", color: "var(--dash-blue)" },
  ready: { label: "Ready", color: "var(--dash-success)" },
  failed: { label: "Failed", color: "var(--dash-danger)" },
};

const FILE_ICONS: Record<string, string> = {
  pdf: "📄",
  image: "🖼️",
  text: "📝",
};

export default function MaterialLibraryPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadSubject, setUploadSubject] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const fetchMaterials = useCallback(async () => {
    try {
      const res = await fetch("/api/materials");
      const data = await res.json();
      setMaterials(data.materials || []);
    } catch (err) {
      console.error("Failed to fetch materials:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // Poll for status updates on queued/extracting items
  useEffect(() => {
    const pending = materials.filter(
      (m) => m.status === "queued" || m.status === "extracting"
    );
    if (pending.length === 0) return;

    const interval = setInterval(fetchMaterials, 5000);
    return () => clearInterval(interval);
  }, [materials, fetchMaterials]);

  async function handleUpload() {
    if (!uploadFile || !uploadSubject.trim()) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("subject", uploadSubject.trim());

      const res = await fetch("/api/materials", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setShowUpload(false);
        setUploadFile(null);
        setUploadSubject("");
        fetchMaterials();
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/materials/${id}`, { method: "DELETE" });
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  function formatSize(bytes: number | null): string {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (loading) {
    return (
      <div className="dash-page-enter" style={{ maxWidth: 900, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, color: "var(--dash-text)", marginBottom: 24 }}>
          Material Library
        </h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                background: "var(--dash-surface)",
                border: "1px solid var(--dash-border)",
                borderRadius: "var(--dash-radius-card)",
                height: 160,
                animation: "commitPulse 1.5s ease-in-out infinite",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="dash-page-enter" style={{ maxWidth: 900, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, color: "var(--dash-text)" }}>
          Material Library
        </h1>
        <button
          onClick={() => setShowUpload(true)}
          style={{
            padding: "10px 20px",
            background: "var(--dash-teal)",
            color: "#0f1b1e",
            border: "none",
            borderRadius: "var(--dash-radius-pill)",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            transition: "opacity 200ms",
          }}
        >
          + Upload notes
        </button>
      </div>

      {/* ═══ Empty State ═══ */}
      {materials.length === 0 && (
        <DashboardCard padding="48px 32px">
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
            <h2 style={{ fontSize: 18, fontWeight: 500, color: "var(--dash-text)", marginBottom: 8 }}>
              Add your class notes and Zorvai will teach straight from them
            </h2>
            <p style={{ fontSize: 14, color: "var(--dash-muted)", marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
              Upload your PDFs, slides, or photos of handwritten notes. Your plan and lessons will be built from your own material.
            </p>
            <button
              onClick={() => setShowUpload(true)}
              style={{
                padding: "12px 28px",
                background: "var(--dash-teal)",
                color: "#0f1b1e",
                border: "none",
                borderRadius: "var(--dash-radius-pill)",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Upload your first file
            </button>
            <div style={{ marginTop: 12 }}>
              <span style={{ fontSize: 13, color: "var(--dash-dim)", cursor: "pointer" }}>
                Skip — teach me the standard way
              </span>
            </div>
          </div>
        </DashboardCard>
      )}

      {/* ═══ Material Cards Grid ═══ */}
      {materials.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
          {materials.map((m, i) => {
            const statusConfig = STATUS_CONFIG[m.status] || STATUS_CONFIG.queued;
            return (
              <motion.div
                key={m.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
              >
                <DashboardCard padding="16px">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <span style={{ fontSize: 28 }}>{FILE_ICONS[m.type] || "📄"}</span>
                    <Badge
                      label={statusConfig.label}
                      color={statusConfig.color}
                    />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--dash-text)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.filename}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--dash-muted)", marginBottom: 8 }}>
                    {m.subject}
                    {m.page_count ? ` · ${m.page_count} pages` : ""}
                    {m.file_size_bytes ? ` · ${formatSize(m.file_size_bytes)}` : ""}
                  </div>
                  {m.error_message && (
                    <div style={{ fontSize: 12, color: "var(--dash-danger)", marginBottom: 8 }}>
                      {m.error_message}
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => handleDelete(m.id)}
                      style={{
                        padding: "4px 10px",
                        background: "transparent",
                        border: "1px solid var(--dash-border)",
                        borderRadius: 6,
                        fontSize: 12,
                        color: "var(--dash-muted)",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </DashboardCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ═══ Upload Modal ═══ */}
      {showUpload && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={() => setShowUpload(false)}
        >
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--dash-surface)",
              border: "1px solid var(--dash-border)",
              borderRadius: "var(--dash-radius-card)",
              padding: 28,
              width: "min(420px, 90vw)",
            }}
          >
            <SectionHeader title="Upload study material" />
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, color: "var(--dash-muted)", display: "block", marginBottom: 6 }}>
                  Subject
                </label>
                <input
                  type="text"
                  value={uploadSubject}
                  onChange={(e) => setUploadSubject(e.target.value)}
                  placeholder="e.g., Biology, Mathematics"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "var(--dash-bg)",
                    border: "1px solid var(--dash-border)",
                    borderRadius: 8,
                    fontSize: 14,
                    color: "var(--dash-text)",
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "var(--dash-muted)", display: "block", marginBottom: 6 }}>
                  File (PDF, image, or text — max 20MB)
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "var(--dash-bg)",
                    border: "1px solid var(--dash-border)",
                    borderRadius: 8,
                    fontSize: 14,
                    color: "var(--dash-text)",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button
                  onClick={() => setShowUpload(false)}
                  style={{
                    padding: "10px 20px",
                    background: "transparent",
                    border: "1px solid var(--dash-border)",
                    borderRadius: "var(--dash-radius-pill)",
                    fontSize: 14,
                    color: "var(--dash-muted)",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!uploadFile || !uploadSubject.trim() || uploading}
                  style={{
                    padding: "10px 20px",
                    background: uploading ? "var(--dash-dim)" : "var(--dash-teal)",
                    color: "#0f1b1e",
                    border: "none",
                    borderRadius: "var(--dash-radius-pill)",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: uploading ? "wait" : "pointer",
                    opacity: !uploadFile || !uploadSubject.trim() ? 0.5 : 1,
                  }}
                >
                  {uploading ? "Uploading…" : "Upload"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
