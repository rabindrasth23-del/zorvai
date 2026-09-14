"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { DashboardCard, SectionHeader } from "@/components/dashboard/dashboard-primitives";

/* =============================================================================
   SNAP & SOLVE PAGE
   Route: /solve
   Photo capture → OCR text → symbolic solver → LLM explanation
   Supports hint-first and full-solution modes
   ============================================================================= */

type Mode = "hint" | "full";

interface SolveResult {
  solverVerified: boolean;
  solverResult: string | null;
  answer: string;
  steps: string[];
  explanation: string;
  confidence: string;
  mode: Mode;
}

export default function SnapSolvePage() {
  const [ocrText, setOcrText] = useState("");
  const [mode, setMode] = useState<Mode>("hint");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SolveResult | null>(null);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shouldReduceMotion = useReducedMotion();

  async function handleSolve() {
    if (!ocrText.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ocrText: ocrText.trim(), mode }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setResult(data);
      }
    } catch {
      setError("Failed to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleImageCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);

    // For now, prompt user to type the question
    // In production, this would send to a cloud OCR API
    setOcrText("(Photo uploaded — type the problem text here for now)");
  }

  return (
    <div className="dash-page-enter" style={{ maxWidth: 650, margin: "0 auto", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 500, color: "var(--dash-text)", marginBottom: 8 }}>
        Snap & Solve
      </h1>
      <p style={{ fontSize: 14, color: "var(--dash-muted)", marginBottom: 28 }}>
        Type or photograph a problem. Get a hint first, or jump to the full solution.
      </p>

      {/* ═══ Input Section ═══ */}
      <DashboardCard padding="24px">
        <SectionHeader title="Your problem" />

        {/* Image capture */}
        <div style={{ display: "flex", gap: 10, marginTop: 14, marginBottom: 14 }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: "10px 18px",
              background: "var(--dash-raised)",
              border: "1px solid var(--dash-border)",
              borderRadius: 10,
              fontSize: 14,
              color: "var(--dash-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            📷 Take a photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageCapture}
            style={{ display: "none" }}
          />
        </div>

        {/* Image preview */}
        {imagePreview && (
          <div style={{ marginBottom: 14 }}>
            <img
              src={imagePreview}
              alt="Captured problem"
              style={{
                maxWidth: "100%",
                maxHeight: 200,
                borderRadius: 10,
                border: "1px solid var(--dash-border)",
                objectFit: "contain",
              }}
            />
          </div>
        )}

        {/* Text input */}
        <textarea
          value={ocrText}
          onChange={(e) => setOcrText(e.target.value)}
          placeholder="Type or paste a math problem here…&#10;e.g., solve 2x + 5 = 13"
          rows={4}
          style={{
            width: "100%",
            padding: "14px",
            background: "var(--dash-bg)",
            border: "1px solid var(--dash-border)",
            borderRadius: 10,
            fontSize: 15,
            color: "var(--dash-text)",
            outline: "none",
            resize: "vertical",
            fontFamily: "inherit",
            lineHeight: 1.5,
          }}
        />

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          {(["hint", "full"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                padding: "10px",
                background: mode === m ? "var(--dash-teal-bg)" : "var(--dash-bg)",
                border: `1px solid ${mode === m ? "var(--dash-teal-border)" : "var(--dash-border)"}`,
                borderRadius: 10,
                fontSize: 14,
                fontWeight: mode === m ? 600 : 400,
                color: mode === m ? "var(--dash-teal)" : "var(--dash-muted)",
                cursor: "pointer",
                transition: "all 200ms",
              }}
            >
              {m === "hint" ? "💡 Hint first" : "📝 Full solution"}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ marginTop: 12, fontSize: 13, color: "var(--dash-danger)", padding: "10px 14px", background: "rgba(248, 113, 113, 0.08)", borderRadius: 8 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSolve}
          disabled={!ocrText.trim() || loading}
          style={{
            width: "100%",
            marginTop: 16,
            padding: "14px",
            background: loading ? "var(--dash-dim)" : "var(--dash-teal)",
            color: "#0f1b1e",
            border: "none",
            borderRadius: "var(--dash-radius-pill)",
            fontSize: 16,
            fontWeight: 600,
            cursor: loading ? "wait" : "pointer",
            opacity: !ocrText.trim() ? 0.5 : 1,
          }}
        >
          {loading ? "Thinking…" : mode === "hint" ? "Get a hint" : "Show me the solution"}
        </button>
      </DashboardCard>

      {/* ═══ Solution Display ═══ */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ marginTop: 16 }}
          >
            <DashboardCard padding="24px">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <SectionHeader title={result.mode === "hint" ? "Hint" : "Solution"} />
                {result.solverVerified && (
                  <span style={{
                    fontSize: 11,
                    padding: "3px 8px",
                    background: "rgba(74, 222, 128, 0.1)",
                    color: "var(--dash-success)",
                    borderRadius: "var(--dash-radius-pill)",
                    border: "1px solid rgba(74, 222, 128, 0.2)",
                  }}>
                    ✓ Verified by solver
                  </span>
                )}
              </div>

              {/* Answer */}
              <div style={{
                padding: "16px",
                background: "var(--dash-raised)",
                borderRadius: 10,
                marginBottom: 16,
              }}>
                <div style={{ fontSize: 16, color: "var(--dash-text)", lineHeight: 1.6 }}>
                  {result.answer}
                </div>
              </div>

              {/* Steps */}
              {result.steps.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: "var(--dash-dim)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>
                    Step by step
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {result.steps.map((step, i) => (
                      <motion.div
                        key={i}
                        initial={shouldReduceMotion ? false : { opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "flex-start",
                        }}
                      >
                        <span className="text-number" style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "var(--dash-teal)",
                          background: "var(--dash-teal-bg)",
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: 2,
                        }}>
                          {i + 1}
                        </span>
                        <span style={{ fontSize: 14, color: "var(--dash-text)", lineHeight: 1.5 }}>
                          {step}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanation */}
              {result.explanation && (
                <div style={{
                  padding: "14px 16px",
                  background: "rgba(91, 168, 184, 0.06)",
                  borderRadius: 10,
                  borderLeft: "3px solid var(--dash-teal)",
                }}>
                  <div style={{ fontSize: 12, color: "var(--dash-dim)", marginBottom: 6 }}>Why this works</div>
                  <div style={{ fontSize: 14, color: "var(--dash-text)", lineHeight: 1.5 }}>
                    {result.explanation}
                  </div>
                </div>
              )}

              {/* Confidence indicator */}
              {result.confidence === "low" && (
                <div style={{
                  marginTop: 12,
                  fontSize: 12,
                  color: "var(--dash-amber)",
                  fontStyle: "italic",
                }}>
                  ⚠ Confidence is lower on this one — double-check the answer
                </div>
              )}

              {/* Switch mode button */}
              {result.mode === "hint" && (
                <button
                  onClick={() => { setMode("full"); handleSolve(); }}
                  style={{
                    marginTop: 16,
                    padding: "10px 20px",
                    background: "transparent",
                    border: "1px solid var(--dash-border)",
                    borderRadius: "var(--dash-radius-pill)",
                    fontSize: 13,
                    color: "var(--dash-muted)",
                    cursor: "pointer",
                  }}
                >
                  Show me the full solution →
                </button>
              )}
            </DashboardCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
