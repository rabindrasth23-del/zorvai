"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

/* =============================================================================
   CHAT PAGE — Always-On AI Chatbot
   Route: /chat
   Full-height chat interface with message bubbles, typing indicator,
   photo upload, and suggested chips on empty state.
   ============================================================================= */

interface Message {
  id: string;
  role: "student" | "ai";
  content: string;
  imageUrl?: string;
  timestamp: Date;
}

export default function ChatPage() {
  const shouldReduceMotion = useReducedMotion();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [solveMode, setSolveMode] = useState<"chat" | "hint" | "full">("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Check for pre-loaded topic from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const topic = params.get("topic");
    if (topic) {
      handleSend(`Explain ${topic}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    const studentMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "student",
      content: messageText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, studentMsg]);
    setInputText("");
    setIsTyping(true);

    try {
      // Use solve API for hint/full modes, chat API for regular chat
      if (solveMode !== "chat") {
        const res = await fetch("/api/solve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ocrText: messageText,
            mode: solveMode === "hint" ? "hint" : "full",
          }),
        });
        const data = await res.json();
        const aiMsg: Message = {
          id: `msg-${Date.now()}-ai`,
          role: "ai",
          content: data.error
            ? `Sorry, I couldn't solve that: ${data.error}`
            : formatSolveResponse(data),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: messageText,
            history: messages.slice(-10).map((m) => ({
              role: m.role === "student" ? "user" : "assistant",
              content: m.content,
            })),
          }),
        });
        const data = await res.json();
        const aiMsg: Message = {
          id: `msg-${Date.now()}-ai`,
          role: "ai",
          content: data.error ? `Sorry, something went wrong.` : data.response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch {
      const errorMsg: Message = {
        id: `msg-${Date.now()}-err`,
        role: "ai",
        content: "Connection issue — please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestedChips = [
    "Explain photosynthesis",
    "Quiz me on cell biology",
    "What's next in my plan?",
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        maxWidth: "680px",
        margin: "0 auto",
        width: "100%",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ═══ Chat Area ═══ */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
        className="dash-scrollbar"
      >
        {/* Empty State */}
        {messages.length === 0 && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px",
              padding: "40px 20px",
            }}
          >
            {/* Spark icon */}
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "var(--dash-teal-bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--dash-teal)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <h2
              style={{
                fontSize: "20px",
                color: "var(--dash-text)",
                fontWeight: 500,
                margin: 0,
              }}
            >
              Ask me anything
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "var(--dash-muted)",
                textAlign: "center",
                maxWidth: "360px",
                lineHeight: 1.5,
              }}
            >
              I know your subjects, your recent sessions, and where you&apos;re stuck.
            </p>

            {/* Suggested chips */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                justifyContent: "center",
                marginTop: "8px",
              }}
            >
              {suggestedChips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSend(chip)}
                  style={{
                    background: "var(--dash-surface)",
                    border: "1px solid var(--dash-border)",
                    borderRadius: "var(--dash-radius-pill)",
                    padding: "8px 16px",
                    fontSize: "13px",
                    color: "var(--dash-muted)",
                    cursor: "pointer",
                    transition: "all 150ms ease",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--dash-teal)";
                    e.currentTarget.style.color = "var(--dash-teal)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--dash-border)";
                    e.currentTarget.style.color = "var(--dash-muted)";
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={
                shouldReduceMotion
                  ? false
                  : msg.role === "student"
                    ? { opacity: 0, x: 20 }
                    : { opacity: 0, x: -20 }
              }
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                display: "flex",
                justifyContent: msg.role === "student" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: msg.role === "student" ? "75%" : "80%",
                  padding: msg.role === "student" ? "11px 15px" : "14px 18px",
                  borderRadius:
                    msg.role === "student"
                      ? "14px 14px 4px 14px"
                      : "14px 14px 14px 4px",
                  background:
                    msg.role === "student"
                      ? "var(--dash-teal)"
                      : "var(--dash-surface)",
                  color:
                    msg.role === "student"
                      ? "var(--dash-bg)"
                      : "var(--dash-text)",
                  border:
                    msg.role === "ai"
                      ? "1px solid var(--dash-border)"
                      : "none",
                  fontSize: "14px",
                  lineHeight: 1.6,
                }}
              >
                {msg.imageUrl && (
                  <div
                    style={{
                      borderRadius: "var(--dash-radius-inner)",
                      overflow: "hidden",
                      marginBottom: "8px",
                    }}
                  >
                    <img
                      src={msg.imageUrl}
                      alt="Uploaded"
                      style={{
                        width: "100%",
                        maxHeight: "200px",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                )}
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: "flex", justifyContent: "flex-start" }}
          >
            <div
              style={{
                background: "var(--dash-surface)",
                border: "1px solid var(--dash-border)",
                borderRadius: "14px 14px 14px 4px",
                padding: "14px 18px",
                display: "flex",
                gap: "4px",
                alignItems: "center",
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "var(--dash-muted)",
                    animation: `dotBounce 1.2s infinite`,
                    animationDelay: `${i * 150}ms`,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ═══ Input Area ═══ */}
      <div
        style={{
          background: "var(--dash-bg)",
          borderTop: "1px solid var(--dash-border)",
          padding: "14px 24px",
          display: "flex",
          alignItems: "flex-end",
          gap: "10px",
        }}
      >
        {/* Photo upload */}
        <button
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            color: "var(--dash-dim)",
            transition: "color 150ms ease",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--dash-teal)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--dash-dim)";
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </button>

        {/* Text input */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {/* Mode toggle strip */}
          <div style={{ display: "flex", gap: 4 }}>
            {([
              { key: "chat" as const, label: "💬 Chat", color: "var(--dash-teal)" },
              { key: "hint" as const, label: "💡 Hint", color: "var(--dash-amber)" },
              { key: "full" as const, label: "📝 Solve", color: "var(--dash-success)" },
            ]).map((m) => (
              <button
                key={m.key}
                onClick={() => setSolveMode(m.key)}
                style={{
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: solveMode === m.key ? 600 : 400,
                  color: solveMode === m.key ? m.color : "var(--dash-dim)",
                  background: solveMode === m.key ? `${m.color}12` : "transparent",
                  border: `1px solid ${solveMode === m.key ? `${m.color}30` : "transparent"}`,
                  borderRadius: "var(--dash-radius-pill)",
                  cursor: "pointer",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  transition: "all 150ms",
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Input field */}
          <div
            style={{
              background: "var(--dash-surface)",
              border: "1px solid var(--dash-border)",
              borderRadius: "24px",
              padding: "12px 18px",
              display: "flex",
              alignItems: "center",
              transition: "border-color 200ms ease",
            }}
          >
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              onFocus={(e) => {
                (e.currentTarget.parentElement as HTMLDivElement).style.borderColor = "var(--dash-teal)";
              }}
              onBlur={(e) => {
                (e.currentTarget.parentElement as HTMLDivElement).style.borderColor = "var(--dash-border)";
              }}
              placeholder={solveMode !== "chat" ? "Type a math problem…" : "Type a message..."}
              rows={1}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--dash-text)",
                fontSize: "14px",
                fontFamily: "system-ui, -apple-system, sans-serif",
                resize: "none",
                lineHeight: 1.5,
                maxHeight: "120px",
              }}
            />
          </div>
        </div>

        {/* Send button */}
        <motion.button
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: inputText.trim() ? "var(--dash-teal)" : "var(--dash-raised)",
            border: "none",
            cursor: inputText.trim() ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 200ms ease",
            flexShrink: 0,
            alignSelf: "flex-end",
          }}
          whileTap={inputText.trim() ? { scale: 0.9 } : {}}
          onClick={() => handleSend()}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={inputText.trim() ? "var(--dash-bg)" : "var(--dash-dim)"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}

// Format solve response into readable text
function formatSolveResponse(data: {
  answer: string;
  steps: string[];
  explanation: string;
  confidence: string;
  solverVerified: boolean;
}): string {
  let text = "";

  if (data.solverVerified) {
    text += "✓ Verified by math solver\n\n";
  }

  text += `**Answer:** ${data.answer}\n\n`;

  if (data.steps?.length > 0) {
    text += "**Steps:**\n";
    data.steps.forEach((step, i) => {
      text += `${i + 1}. ${step}\n`;
    });
    text += "\n";
  }

  if (data.explanation) {
    text += `**Why:** ${data.explanation}`;
  }

  if (data.confidence === "low") {
    text += "\n\n⚠ Lower confidence — double-check this one.";
  }

  return text;
}

