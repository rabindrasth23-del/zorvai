"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { DashboardCard, SectionHeader } from "@/components/dashboard/dashboard-primitives";

/* =============================================================================
   REVIEW DECK PAGE
   Route: /review
   Flashcard-flip interaction, short queue, separate visual style from sessions
   ============================================================================= */

interface ReviewItem {
  id: string;
  topicId: string;
  topicTitle: string;
  topicDescription: string;
  streakCount: number;
  intervalDays: number;
}

export default function ReviewDeckPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completing, setCompleting] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch("/api/review-deck/today");
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  async function handleResult(passed: boolean) {
    if (completing) return;
    setCompleting(true);

    const current = reviews[currentIndex];
    try {
      await fetch(`/api/review-deck/${current.topicId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passed }),
      });

      // Move to next card
      setFlipped(false);
      if (currentIndex < reviews.length - 1) {
        setTimeout(() => setCurrentIndex(currentIndex + 1), 300);
      } else {
        // All done
        setReviews([]);
      }
    } catch (err) {
      console.error("Complete failed:", err);
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <div className="dash-page-enter" style={{ maxWidth: 600, margin: "0 auto", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, color: "var(--dash-text)", marginBottom: 24 }}>Review Deck</h1>
        <div style={{ height: 280, background: "var(--dash-surface)", border: "1px solid var(--dash-border)", borderRadius: "var(--dash-radius-card)", animation: "commitPulse 1.5s ease-in-out infinite" }} />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="dash-page-enter" style={{ maxWidth: 600, margin: "0 auto", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, color: "var(--dash-text)", marginBottom: 24 }}>Review Deck</h1>
        <DashboardCard padding="48px 32px">
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 18, fontWeight: 500, color: "var(--dash-text)", marginBottom: 8 }}>
              All caught up!
            </h2>
            <p style={{ fontSize: 14, color: "var(--dash-muted)", maxWidth: 360, margin: "0 auto" }}>
              No reviews due right now. Topics you&apos;ve mastered will appear here when they&apos;re ready for a quick refresher.
            </p>
          </div>
        </DashboardCard>
      </div>
    );
  }

  const current = reviews[currentIndex];
  const remaining = reviews.length - currentIndex;

  return (
    <div className="dash-page-enter" style={{ maxWidth: 600, margin: "0 auto", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, color: "var(--dash-text)" }}>Review Deck</h1>
        <span style={{ fontSize: 13, color: "var(--dash-muted)" }}>
          <span className="text-number">{remaining}</span> quick review{remaining !== 1 ? "s" : ""} today
        </span>
      </div>

      {/* ═══ Progress dots ═══ */}
      <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 20 }}>
        {reviews.map((_, i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: i < currentIndex
                ? "var(--dash-success)"
                : i === currentIndex
                  ? "var(--dash-teal)"
                  : "var(--dash-border-hi)",
              transition: "all 300ms",
            }}
          />
        ))}
      </div>

      {/* ═══ Flashcard ═══ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.topicId}
          initial={shouldReduceMotion ? false : { opacity: 0, rotateY: -90 }}
          animate={{ opacity: 1, rotateY: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, rotateY: 90 }}
          transition={{ duration: 0.35 }}
          onClick={() => setFlipped(!flipped)}
          style={{
            cursor: "pointer",
            perspective: 600,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              minHeight: 240,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "32px 28px",
              background: flipped
                ? "linear-gradient(135deg, var(--dash-surface), var(--dash-raised))"
                : "var(--dash-surface)",
              border: "1px solid var(--dash-border)",
              borderRadius: 16,
              transition: "background 300ms",
              textAlign: "center",
            }}
          >
            {!flipped ? (
              <>
                <div style={{ fontSize: 12, color: "var(--dash-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
                  Can you recall…
                </div>
                <div style={{ fontSize: 20, fontWeight: 500, color: "var(--dash-text)", lineHeight: 1.4 }}>
                  {current.topicTitle}
                </div>
                <div style={{ fontSize: 13, color: "var(--dash-dim)", marginTop: 24 }}>
                  Tap to flip
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 12, color: "var(--dash-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
                  Key points
                </div>
                <div style={{ fontSize: 15, color: "var(--dash-text)", lineHeight: 1.6, maxWidth: 400 }}>
                  {current.topicDescription || "Think through the key concepts, definitions, and examples for this topic."}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--dash-muted)" }}>
                    Streak: <span className="text-number">{current.streakCount}</span>
                  </span>
                  <span style={{ fontSize: 12, color: "var(--dash-dim)" }}>·</span>
                  <span style={{ fontSize: 12, color: "var(--dash-muted)" }}>
                    Next in: <span className="text-number">{current.intervalDays}</span> days
                  </span>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ═══ Result buttons (show only when flipped) ═══ */}
      {flipped && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", gap: 12, justifyContent: "center" }}
        >
          <button
            onClick={() => handleResult(false)}
            disabled={completing}
            style={{
              padding: "12px 28px",
              background: "transparent",
              border: "1px solid rgba(248, 113, 113, 0.3)",
              borderRadius: "var(--dash-radius-pill)",
              fontSize: 14,
              color: "var(--dash-danger)",
              cursor: "pointer",
            }}
          >
            Need to review
          </button>
          <button
            onClick={() => handleResult(true)}
            disabled={completing}
            style={{
              padding: "12px 28px",
              background: "var(--dash-success)",
              color: "#0f1b1e",
              border: "none",
              borderRadius: "var(--dash-radius-pill)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Got it ✓
          </button>
        </motion.div>
      )}
    </div>
  );
}
