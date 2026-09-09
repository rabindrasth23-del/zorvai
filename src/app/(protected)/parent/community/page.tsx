"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { DashboardCard, SectionHeader, DashButton, EmptyState } from "@/components/dashboard/dashboard-primitives";

/* =============================================================================
   PARENT COMMUNITY PAGE
   Route: /parent/community
   Community feed with milestone nudges, post cards with reactions,
   share modal, and encouragement system.
   ============================================================================= */

interface Post {
  id: string;
  authorName: string;
  authorInitials: string;
  timeAgo: string;
  type: "win" | "custom";
  winHeadline?: string;
  winEmoji?: string;
  text?: string;
  reactions: { fire: number; party: number; muscle: number };
  myReactions: { fire: boolean; party: boolean; muscle: boolean };
  commentCount: number;
  isOwn: boolean;
}

const mockPosts: Post[] = [
  {
    id: "1",
    authorName: "Sarah M.",
    authorInitials: "SM",
    timeAgo: "2 hours ago",
    type: "win",
    winHeadline: "5-day study streak!",
    winEmoji: "🔥",
    reactions: { fire: 12, party: 5, muscle: 3 },
    myReactions: { fire: false, party: false, muscle: false },
    commentCount: 2,
    isOwn: false,
  },
  {
    id: "2",
    authorName: "You",
    authorInitials: "AJ",
    timeAgo: "Yesterday",
    type: "win",
    winHeadline: "Alex mastered Cell Division!",
    winEmoji: "🎯",
    reactions: { fire: 8, party: 15, muscle: 6 },
    myReactions: { fire: true, party: false, muscle: false },
    commentCount: 4,
    isOwn: true,
  },
  {
    id: "3",
    authorName: "David K.",
    authorInitials: "DK",
    timeAgo: "2 days ago",
    type: "custom",
    text: "So proud of Emma for sticking with her study schedule even during the holidays. Consistency really pays off!",
    reactions: { fire: 6, party: 3, muscle: 9 },
    myReactions: { fire: false, party: false, muscle: false },
    commentCount: 1,
    isOwn: false,
  },
];

const milestoneNudges = [
  { emoji: "🔥", headline: "Alex hit a 5-day streak!", subtext: "Share this win with the community" },
  { emoji: "🎯", headline: "Biology mastery reached 85%", subtext: "Celebrate this achievement" },
];

export default function CommunityPage() {
  const shouldReduceMotion = useReducedMotion();
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareStep, setShareStep] = useState(1);
  const [shareType, setShareType] = useState<string | null>(null);
  const [shareText, setShareText] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [encouragedPosts, setEncouragedPosts] = useState<Set<string>>(new Set());

  const handleReaction = (postId: string, type: "fire" | "party" | "muscle") => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const isActive = p.myReactions[type];
        return {
          ...p,
          reactions: { ...p.reactions, [type]: p.reactions[type] + (isActive ? -1 : 1) },
          myReactions: { ...p.myReactions, [type]: !isActive },
        };
      })
    );
  };

  const handleEncourage = (postId: string) => {
    setEncouragedPosts((prev) => new Set(prev).add(postId));
  };

  const handleShare = () => {
    const newPost: Post = {
      id: `post-${Date.now()}`,
      authorName: anonymous ? "Anonymous Parent" : "You",
      authorInitials: anonymous ? "AP" : "AJ",
      timeAgo: "Just now",
      type: shareType === "custom" ? "custom" : "win",
      winHeadline: shareType !== "custom" ? `New ${shareType} milestone!` : undefined,
      winEmoji: shareType !== "custom" ? "🎉" : undefined,
      text: shareText || undefined,
      reactions: { fire: 0, party: 0, muscle: 0 },
      myReactions: { fire: false, party: false, muscle: false },
      commentCount: 0,
      isOwn: true,
    };
    setPosts((prev) => [newPost, ...prev]);
    setShowShareModal(false);
    setShareStep(1);
    setShareType(null);
    setShareText("");
    setAnonymous(false);
  };

  return (
    <div className="dash-page-enter" style={{ maxWidth: "640px", margin: "0 auto", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 500, color: "var(--dash-text)", margin: 0 }}>
            Family Community
          </h1>
          <p style={{ fontSize: "14px", color: "var(--dash-muted)", margin: "4px 0 0" }}>
            Celebrating the wins that matter.
          </p>
        </div>
        <DashButton variant="primary" onClick={() => setShowShareModal(true)}>
          Share a win +
        </DashButton>
      </div>

      {/* Milestone Nudges */}
      {milestoneNudges.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <span style={{ fontSize: "12px", color: "var(--dash-teal)", fontWeight: 500, marginBottom: "8px", display: "block" }}>
            🎉 Ready to share
          </span>
          <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "4px" }} className="dash-scrollbar">
            {milestoneNudges.map((nudge, i) => (
              <motion.div
                key={i}
                initial={shouldReduceMotion ? false : { opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                style={{
                  background: "var(--dash-teal-bg)",
                  border: "1px solid var(--dash-teal-border)",
                  borderRadius: "12px",
                  padding: "16px",
                  minWidth: "220px",
                  flexShrink: 0,
                }}
              >
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>{nudge.emoji}</div>
                <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--dash-text)", marginBottom: "4px" }}>{nudge.headline}</div>
                <div style={{ fontSize: "12px", color: "var(--dash-muted)", marginBottom: "12px" }}>{nudge.subtext}</div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => { setShareType("streak"); setShowShareModal(true); }}
                    style={{ fontSize: "12px", color: "var(--dash-teal)", background: "transparent", border: "none", cursor: "pointer", fontWeight: 600, padding: 0 }}
                  >
                    Share it
                  </button>
                  <button style={{ fontSize: "12px", color: "var(--dash-dim)", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
                    Not now
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Feed Posts */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <AnimatePresence initial={false}>
          {posts.map((post) => (
            <motion.div
              key={post.id}
              layout
              initial={shouldReduceMotion ? false : { opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: "var(--dash-surface)",
                border: "1px solid var(--dash-border)",
                borderRadius: "var(--dash-radius-card)",
                padding: "20px",
              }}
            >
              {/* Author row */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  background: "var(--dash-teal-bg)", border: "1px solid var(--dash-teal-border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "11px", fontWeight: 600, color: "var(--dash-teal)",
                }}>
                  {post.authorInitials}
                </div>
                <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--dash-text)" }}>{post.authorName}</span>
                <span style={{ fontSize: "12px", color: "var(--dash-dim)" }}>{post.timeAgo}</span>
              </div>

              {/* Content */}
              {post.type === "win" && (
                <div style={{
                  background: "var(--dash-teal-bg)",
                  border: "1px solid var(--dash-teal-border)",
                  borderRadius: "var(--dash-radius-inner)",
                  padding: "14px 16px",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}>
                  <span style={{ fontSize: "24px" }}>{post.winEmoji}</span>
                  <span style={{ fontSize: "15px", fontWeight: 500, color: "var(--dash-teal)" }}>{post.winHeadline}</span>
                </div>
              )}
              {post.text && (
                <p style={{ fontSize: "14px", color: "var(--dash-text)", lineHeight: 1.6, margin: "0 0 12px" }}>{post.text}</p>
              )}

              {/* Reactions */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                {(["fire", "party", "muscle"] as const).map((type) => {
                  const emoji = type === "fire" ? "🔥" : type === "party" ? "🎉" : "💪";
                  const isActive = post.myReactions[type];
                  return (
                    <motion.button
                      key={type}
                      onClick={() => handleReaction(post.id, type)}
                      whileTap={{ scale: 1.3 }}
                      style={{
                        display: "flex", alignItems: "center", gap: "4px",
                        padding: "4px 10px", borderRadius: "var(--dash-radius-pill)",
                        background: isActive ? "rgba(78, 205, 196, 0.1)" : "var(--dash-raised)",
                        border: "none", cursor: "pointer",
                        fontSize: "13px",
                        color: isActive ? "var(--dash-teal)" : "var(--dash-muted)",
                        transition: "all 150ms ease",
                        fontFamily: "system-ui, -apple-system, sans-serif",
                      }}
                    >
                      {emoji} {post.reactions[type]}
                    </motion.button>
                  );
                })}
                <span style={{ fontSize: "13px", color: "var(--dash-muted)", cursor: "pointer" }}>
                  {post.commentCount} comments
                </span>
                {!post.isOwn && (
                  <button
                    onClick={() => handleEncourage(post.id)}
                    disabled={encouragedPosts.has(post.id)}
                    style={{
                      fontSize: "13px",
                      color: encouragedPosts.has(post.id) ? "var(--dash-teal)" : "var(--dash-muted)",
                      background: "transparent", border: "none", cursor: "pointer",
                      fontFamily: "system-ui, -apple-system, sans-serif",
                    }}
                  >
                    {encouragedPosts.has(post.id) ? "💙 Sent" : "💙 Encourage"}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ═══ Share Modal ═══ */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(22, 21, 20, 0.9)",
              backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 100, padding: "20px",
            }}
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{
                width: "480px", maxWidth: "100%",
                background: "var(--dash-surface)",
                border: "1px solid var(--dash-border)",
                borderRadius: "16px",
                padding: "28px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Step 1: Choose type */}
              {shareStep === 1 && (
                <>
                  <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--dash-text)", margin: "0 0 20px" }}>Share a win</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    {[
                      { key: "streak", label: "Streak", emoji: "🔥" },
                      { key: "score", label: "Score", emoji: "📈" },
                      { key: "mastery", label: "Mastery", emoji: "🎯" },
                      { key: "custom", label: "Custom", emoji: "✍️" },
                    ].map((t) => (
                      <button
                        key={t.key}
                        onClick={() => { setShareType(t.key); setShareStep(2); }}
                        style={{
                          padding: "20px",
                          background: "var(--dash-raised)",
                          border: "1px solid var(--dash-border)",
                          borderRadius: "var(--dash-radius-inner)",
                          cursor: "pointer",
                          textAlign: "center",
                          transition: "border-color 150ms ease",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--dash-teal)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--dash-border)"; }}
                      >
                        <div style={{ fontSize: "24px", marginBottom: "8px" }}>{t.emoji}</div>
                        <div style={{ fontSize: "14px", color: "var(--dash-text)" }}>{t.label}</div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Step 2: Add text */}
              {shareStep === 2 && (
                <>
                  <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--dash-text)", margin: "0 0 16px" }}>Add a note (optional)</h3>
                  <textarea
                    value={shareText}
                    onChange={(e) => setShareText(e.target.value.slice(0, 280))}
                    placeholder="Say something about this win..."
                    rows={4}
                    style={{
                      width: "100%", padding: "12px",
                      background: "var(--dash-raised)",
                      border: "1px solid var(--dash-border)",
                      borderRadius: "var(--dash-radius-inner)",
                      color: "var(--dash-text)", fontSize: "14px",
                      fontFamily: "system-ui, -apple-system, sans-serif",
                      resize: "none", outline: "none",
                    }}
                  />
                  <div style={{ fontSize: "11px", color: "var(--dash-dim)", textAlign: "right", marginTop: "4px" }}>
                    {shareText.length}/280
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px" }}>
                    <button onClick={() => setShareStep(1)} style={{ fontSize: "13px", color: "var(--dash-muted)", background: "transparent", border: "none", cursor: "pointer" }}>
                      ← Back
                    </button>
                    <DashButton variant="primary" onClick={() => setShareStep(3)}>Next</DashButton>
                  </div>
                </>
              )}

              {/* Step 3: Privacy */}
              {shareStep === 3 && (
                <>
                  <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--dash-text)", margin: "0 0 16px" }}>Privacy</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                      <input type="radio" checked={!anonymous} onChange={() => setAnonymous(false)} style={{ accentColor: "var(--dash-teal)" }} />
                      <span style={{ fontSize: "14px", color: "var(--dash-text)" }}>Show child&apos;s name</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                      <input type="radio" checked={anonymous} onChange={() => setAnonymous(true)} style={{ accentColor: "var(--dash-teal)" }} />
                      <span style={{ fontSize: "14px", color: "var(--dash-text)" }}>Post anonymously</span>
                    </label>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <button onClick={() => setShareStep(2)} style={{ fontSize: "13px", color: "var(--dash-muted)", background: "transparent", border: "none", cursor: "pointer" }}>
                      ← Back
                    </button>
                    <DashButton variant="primary" onClick={handleShare} style={{ width: "100%", maxWidth: "200px" }}>
                      Share to community
                    </DashButton>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
