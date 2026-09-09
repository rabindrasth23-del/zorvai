"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import Link from "next/link";
import { DashButton } from "@/components/dashboard/dashboard-primitives";

/* =============================================================================
   SESSION PAGE — Full-Screen Live Study Session
   Route: /session
   Full screen, no sidebar. Focused mode with phase indicator,
   countdown timer, AI speaking indicator, and mic input.
   ============================================================================= */

type Phase = "learn" | "recall" | "challenge" | "feedback";

const phases: { key: Phase; label: string }[] = [
  { key: "learn", label: "Learn" },
  { key: "recall", label: "Recall" },
  { key: "challenge", label: "Challenge" },
  { key: "feedback", label: "Feedback" },
];

export default function SessionPage() {
  const shouldReduceMotion = useReducedMotion();
  const [currentPhase, setCurrentPhase] = useState<Phase>("learn");
  const [timeLeft, setTimeLeft] = useState(10 * 60); // 10 minutes
  const [isRecording, setIsRecording] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [displayedText, setDisplayedText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [challengeQuestion, setChallengeQuestion] = useState(0);
  const [feedbackItems, setFeedbackItems] = useState<{
    nailed: string[];
    revisit: string[];
    missed: string[];
  }>({ nailed: [], revisit: [], missed: [] });
  const [sessionResult, setSessionResult] = useState<"pass" | "fail" | null>(null);
  const [inputText, setInputText] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          // Auto-advance phase
          const phaseIndex = phases.findIndex((p) => p.key === currentPhase);
          if (phaseIndex < phases.length - 1) {
            setCurrentPhase(phases[phaseIndex + 1].key);
            return getPhaseTime(phases[phaseIndex + 1].key);
          }
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentPhase]);

  // Simulate AI message on phase change
  useEffect(() => {
    const messages: Record<Phase, string> = {
      learn:
        "Let's begin today's lesson. I'll walk you through the key concepts, and you can ask me questions at any time. Remember — understanding beats memorization.",
      recall:
        "Close your notes. Tell me everything you remember about what we just covered. Don't worry about getting it perfect — this is how your brain strengthens the connections.",
      challenge:
        "Now let's test your understanding with some questions. Take your time and think carefully before answering.",
      feedback:
        "Great work on today's session! Here's a summary of how you did.",
    };
    setAiMessage(messages[currentPhase]);
    setDisplayedText("");
    setIsSpeaking(true);

    if (currentPhase === "feedback") {
      setFeedbackItems({
        nailed: ["Key concept definition", "Application to real-world example"],
        revisit: ["Secondary mechanism details"],
        missed: [],
      });
      setSessionResult("pass");
    }
  }, [currentPhase]);

  // Typewriter effect
  useEffect(() => {
    if (!aiMessage) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i < aiMessage.length) {
        setDisplayedText(aiMessage.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setIsSpeaking(false);
      }
    }, 20);
    return () => clearInterval(interval);
  }, [aiMessage]);

  function getPhaseTime(phase: Phase): number {
    switch (phase) {
      case "learn": return 10 * 60;
      case "recall": return 5 * 60;
      case "challenge": return 5 * 60;
      case "feedback": return 0;
    }
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const phaseIndex = phases.findIndex((p) => p.key === currentPhase);
  const timerRadius = 90;
  const timerCircumference = 2 * Math.PI * timerRadius;
  const totalPhaseTime = getPhaseTime(currentPhase);
  const timerProgress = totalPhaseTime > 0 ? (timeLeft / totalPhaseTime) : 0;
  const timerOffset = timerCircumference * (1 - timerProgress);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--dash-bg)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ═══ Minimal Header ═══ */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          borderBottom: "1px solid var(--dash-border)",
        }}
      >
        <span
          style={{
            fontSize: "16px",
            fontWeight: 700,
            color: "var(--dash-text)",
            letterSpacing: "-0.02em",
          }}
        >
          Zorvai
        </span>
        <Link
          href="/dashboard"
          style={{
            fontSize: "13px",
            color: "var(--dash-muted)",
            textDecoration: "none",
            cursor: "pointer",
          }}
          onClick={(e) => {
            if (!confirm("End this session? Progress will be saved.")) {
              e.preventDefault();
            }
          }}
        >
          End session
        </Link>
      </header>

      {/* ═══ Main Content ═══ */}
      <div
        style={{
          flex: 1,
          maxWidth: "640px",
          margin: "0 auto",
          padding: "32px 24px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "32px",
        }}
      >
        {/* Phase Indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0",
            width: "100%",
            maxWidth: "400px",
          }}
        >
          {phases.map((phase, i) => (
            <div key={phase.key} style={{ display: "flex", alignItems: "center", flex: i < phases.length - 1 ? 1 : 0 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", position: "relative" }}>
                {/* Dot / checkmark */}
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background:
                      i < phaseIndex
                        ? "var(--dash-teal)"
                        : i === phaseIndex
                          ? "var(--dash-teal)"
                          : "var(--dash-dim)",
                    transition: "all 300ms ease",
                  }}
                />
                {/* Active dot glow */}
                {i === phaseIndex && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-2px",
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: "var(--dash-teal)",
                      opacity: 0.3,
                      animation: "glowPulse 2s infinite",
                    }}
                  />
                )}
                {/* Label */}
                <span
                  style={{
                    fontSize: "11px",
                    color:
                      i < phaseIndex
                        ? "var(--dash-muted)"
                        : i === phaseIndex
                          ? "var(--dash-teal)"
                          : "var(--dash-dim)",
                    fontWeight: i === phaseIndex ? 600 : 400,
                    whiteSpace: "nowrap",
                  }}
                >
                  {i < phaseIndex ? "✓" : ""} {phase.label}
                </span>
              </div>
              {/* Connecting line */}
              {i < phases.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: "2px",
                    background: "var(--dash-raised)",
                    margin: "0 8px",
                    marginBottom: "18px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    style={{
                      height: "100%",
                      background: "var(--dash-teal)",
                      position: "absolute",
                      left: 0,
                      top: 0,
                    }}
                    initial={{ width: "0%" }}
                    animate={{
                      width: i < phaseIndex ? "100%" : "0%",
                    }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Timer */}
        {currentPhase !== "feedback" && (
          <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <svg width="200" height="200" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="100" cy="100" r={timerRadius} fill="none" stroke="var(--dash-raised)" strokeWidth="6" />
              <motion.circle
                cx="100"
                cy="100"
                r={timerRadius}
                fill="none"
                stroke="var(--dash-teal)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={timerCircumference}
                animate={{ strokeDashoffset: timerOffset }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </svg>
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "24px",
                  fontFamily: "monospace",
                  color: "var(--dash-text)",
                  fontWeight: 500,
                }}
              >
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--dash-muted)",
                  marginTop: "4px",
                  textTransform: "capitalize",
                }}
              >
                {currentPhase} phase
              </div>
            </div>
          </div>
        )}

        {/* AI Speaking Indicator */}
        <div style={{ display: "flex", gap: "6px", alignItems: "flex-end", height: "32px" }}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              style={{
                width: "4px",
                borderRadius: "2px",
                background: "var(--dash-teal)",
              }}
              animate={{
                height: isSpeaking ? [8, 32, 8] : 4,
              }}
              transition={{
                duration: 0.6,
                repeat: isSpeaking ? Infinity : 0,
                delay: i * 0.1,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* AI Message Area */}
        <div
          style={{
            width: "100%",
            background: "var(--dash-surface)",
            borderRadius: "var(--dash-radius-card)",
            padding: "18px",
            maxHeight: "200px",
            overflowY: "auto",
            fontSize: "15px",
            lineHeight: 1.7,
            color: "var(--dash-text)",
          }}
          className="dash-scrollbar"
        >
          {displayedText}
          {isSpeaking && (
            <span style={{ opacity: 0.5, animation: "commitPulse 1s infinite" }}>▊</span>
          )}
        </div>

        {/* Challenge Phase — Questions */}
        {currentPhase === "challenge" && (
          <div style={{ textAlign: "center", width: "100%" }}>
            <div style={{ fontSize: "12px", color: "var(--dash-muted)", marginBottom: "12px" }}>
              Question {challengeQuestion + 1} of 4
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={challengeQuestion}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  fontSize: "20px",
                  fontWeight: 500,
                  color: "var(--dash-text)",
                  marginBottom: "20px",
                }}
              >
                What is the key principle behind this concept?
              </motion.div>
            </AnimatePresence>
            {/* Progress dots */}
            <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    width: i === challengeQuestion ? "10px" : "8px",
                    height: i === challengeQuestion ? "10px" : "8px",
                    borderRadius: "50%",
                    background:
                      i < challengeQuestion
                        ? "var(--dash-teal)"
                        : i === challengeQuestion
                          ? "var(--dash-teal)"
                          : "var(--dash-raised)",
                    transition: "all 200ms ease",
                    animation: i === challengeQuestion ? "glowPulse 2s infinite" : undefined,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Feedback Phase */}
        {currentPhase === "feedback" && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* What you nailed */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
            >
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--dash-text)", marginBottom: "8px" }}>
                What you nailed ✅
              </h3>
              {feedbackItems.nailed.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center", padding: "6px 0" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--dash-success)", flexShrink: 0 }} />
                  <span style={{ fontSize: "14px", color: "var(--dash-text)" }}>{item}</span>
                </div>
              ))}
            </motion.div>

            {/* What to revisit */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--dash-text)", marginBottom: "8px" }}>
                What to revisit 📌
              </h3>
              {feedbackItems.revisit.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center", padding: "6px 0" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--dash-amber)", flexShrink: 0 }} />
                  <span style={{ fontSize: "14px", color: "var(--dash-text)" }}>{item}</span>
                </div>
              ))}
            </motion.div>

            {/* What you missed */}
            {feedbackItems.missed.length > 0 && (
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--dash-text)", marginBottom: "8px" }}>
                  What you missed ❌
                </h3>
                {feedbackItems.missed.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center", padding: "6px 0" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--dash-danger)", flexShrink: 0 }} />
                    <span style={{ fontSize: "14px", color: "var(--dash-text)" }}>{item}</span>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Result Action */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              style={{ textAlign: "center", paddingTop: "12px" }}
            >
              {sessionResult === "pass" ? (
                <Link href="/dashboard" style={{ textDecoration: "none" }}>
                  <DashButton variant="primary">Moving on to next topic →</DashButton>
                </Link>
              ) : (
                <Link href="/chat" style={{ textDecoration: "none" }}>
                  <DashButton variant="secondary">Let&apos;s review the weak spots →</DashButton>
                </Link>
              )}
            </motion.div>
          </div>
        )}

        {/* Microphone Button (Recall + Challenge) */}
        {(currentPhase === "recall" || currentPhase === "challenge") && (
          <motion.button
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: isRecording ? "var(--dash-teal)" : "var(--dash-teal-bg)",
              border: `2px solid var(--dash-teal)`,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
            onClick={() => setIsRecording(!isRecording)}
            whileTap={{ scale: 0.95 }}
          >
            {/* Ripple rings when recording */}
            {isRecording && (
              <>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      border: "2px solid rgba(78, 205, 196, 0.3)",
                      animation: `ripple 1.5s cubic-bezier(0.16, 1, 0.3, 1) infinite`,
                      animationDelay: `${i * 200}ms`,
                    }}
                  />
                ))}
              </>
            )}
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isRecording ? "var(--dash-bg)" : "var(--dash-teal)"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
              <path d="M19 10v2a7 7 0 01-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </motion.button>
        )}

        {/* Student Text Input (Learn phase only) */}
        {currentPhase === "learn" && (
          <div
            style={{
              width: "100%",
              display: "flex",
              gap: "10px",
              alignItems: "flex-end",
              background: "var(--dash-surface)",
              border: "1px solid var(--dash-border)",
              borderRadius: "var(--dash-radius-card)",
              padding: "12px 16px",
            }}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask a question..."
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--dash-text)",
                fontSize: "15px",
                fontFamily: "system-ui, -apple-system, sans-serif",
              }}
            />
            {/* Mic icon */}
            <button
              onClick={() => setIsRecording(!isRecording)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                color: isRecording ? "var(--dash-teal)" : "var(--dash-dim)",
                transition: "color 150ms ease",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
              </svg>
            </button>
            {/* Send button */}
            {inputText.trim() && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "var(--dash-teal)",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setInputText("")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dash-bg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </motion.button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
