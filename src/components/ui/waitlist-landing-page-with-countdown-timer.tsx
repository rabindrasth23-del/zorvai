"use client";

import { useState, useEffect, useRef, useCallback, type FormEvent } from "react";

/* ═══════════════════════════════════════════════════════════════
   Zorvai Waitlist — 4-Step Commitment Workflow
   Step 1: Email form
   Step 2: Commitment paper with signature
   Step 3: Pricing selection
   Step 4: Share card (Gemini generates image)
   ═══════════════════════════════════════════════════════════════ */

// ─── Design Tokens ──────────────────────────────────────────────
const c = {
  bg: "#161514",
  surface: "#1c1b19",
  raised: "#252320",
  border: "#2a2826",
  borderHi: "#3a3835",
  text: "#f0ede8",
  muted: "#8a8680",
  dim: "#5a5753",
  teal: "#4ecdc4",
  tealBg: "rgba(78,205,196,0.08)",
  tealBorder: "rgba(78,205,196,0.2)",
  success: "#4ade80",
};

// ─── Plans ──────────────────────────────────────────────────────
const PLANS: Record<string, { label: string; sub: string; price: string; was: string; usd: number; pill: string; popular?: boolean; badge?: string }> = {
  weekly: { label: "Weekly", sub: "Try it for a week", price: "$5.99/week", was: "$14.99", usd: 5.99, pill: "60% off" },
  monthly: { label: "Monthly", sub: "Most popular", price: "$19/month", was: "$49/month", usd: 19, pill: "60% off forever", popular: true },
  annual: { label: "Annual", sub: "= $10.75/month", price: "$129/year", was: "$299/year", usd: 129, pill: "Save $170", badge: "Best value" },
};

// ─── Interfaces ─────────────────────────────────────────────────
interface SignupData {
  referralCode: string;
  position: number;
  name: string;
  childName: string | null;
  alreadyJoined: boolean;
  totalSignups?: number;
}

interface Stats {
  total: number;
  lastHour: number;
  spotsLeft: number | null;
  recentActivity?: { firstName: string; city: string | null; country: string; minutesAgo: number }[];
}

const COUNTRIES = [
  { code: "NP", name: "Nepal" }, { code: "IN", name: "India" },
  { code: "BD", name: "Bangladesh" }, { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" }, { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" }, { code: "AE", name: "UAE" },
  { code: "SG", name: "Singapore" }, { code: "OT", name: "Other" },
];

const SUBJECTS = ["Mathematics", "Science", "English", "Biology", "Chemistry", "Physics", "History", "Geography", "All subjects"];

const ACTIVITY_FEED = [
  "Priya from Mumbai just committed to helping her daughter master Mathematics 🔥",
  "47 parents in Delhi are on the waitlist ahead of you",
  "Rahul's father just shared his card in the school parent group",
  "A parent from Dhaka moved up 50 spots by referring 1 family",
  "The founding 60% off offer closes at 500 signups",
];

// ─── Helpers ────────────────────────────────────────────────────
function inputStyle(focused: boolean) {
  return {
    width: "100%",
    background: c.surface,
    border: `1px solid ${focused ? c.teal : c.border}`,
    borderRadius: 10,
    padding: "12px 16px",
    color: c.text,
    fontSize: 15,
    outline: "none",
    boxShadow: focused ? `0 0 0 3px ${c.tealBg}` : "none",
    transition: "all 200ms ease",
  };
}

// ─── Component ──────────────────────────────────────────────────
export function WaitlistExperience() {
  // Step machine
  const [step, setStep] = useState<"form" | "commitment" | "pricing" | "share">("form");

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formChildName, setFormChildName] = useState("");
  const [formCountry, setFormCountry] = useState("IN");
  const [formRole, setFormRole] = useState("parent");
  const [formLoading, setFormLoading] = useState(false);
  const [formFocus, setFormFocus] = useState<Record<string, boolean>>({});
  const [formError, setFormError] = useState("");

  // Signup data from API
  const [signupData, setSignupData] = useState<SignupData | null>(null);

  // Commitment state
  const [childName, setChildName] = useState("");
  const [subject, setSubject] = useState("");
  const [goal, setGoal] = useState("");
  const [hasSignature, setHasSignature] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

  // Pricing state
  const [selectedPlan, setSelectedPlan] = useState("monthly");

  // Share state
  const [cardImageUrl, setCardImageUrl] = useState<string | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Live stats
  const [stats, setStats] = useState<Stats>({ total: 0, lastHour: 0, spotsLeft: 100 });
  const [activityIndex, setActivityIndex] = useState(0);
  const [activityVisible, setActivityVisible] = useState(true);
  const [jealousyText, setJealousyText] = useState(ACTIVITY_FEED[0]);
  const [jealousyVisible, setJealousyVisible] = useState(true);

  // Referral from URL
  const [referredBy, setReferredBy] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setReferredBy(params.get("ref") || null);
  }, []);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/waitlist/stats");
        const data = await res.json();
        setStats(data);
      } catch { /* silent */ }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Rotate real activity feed
  useEffect(() => {
    if (!stats.recentActivity?.length) return;
    const interval = setInterval(() => {
      setActivityVisible(false);
      setTimeout(() => {
        setActivityIndex((i) => (i + 1) % (stats.recentActivity?.length || 1));
        setActivityVisible(true);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, [stats.recentActivity]);

  // Rotate jealousy feed in share step
  useEffect(() => {
    if (step !== "share") return;
    let i = 0;
    const interval = setInterval(() => {
      setJealousyVisible(false);
      setTimeout(() => {
        i = (i + 1) % ACTIVITY_FEED.length;
        setJealousyText(ACTIVITY_FEED[i]);
        setJealousyVisible(true);
      }, 400);
    }, 6000);
    return () => clearInterval(interval);
  }, [step]);

  // Canvas drawing setup
  useEffect(() => {
    if (step !== "commitment") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function getPos(e: MouseEvent | TouchEvent) {
      const rect = canvas!.getBoundingClientRect();
      const scaleX = canvas!.width / rect.width;
      const scaleY = canvas!.height / rect.height;
      const touch = "touches" in e ? e.touches[0] : null;
      return {
        x: ((touch?.clientX ?? (e as MouseEvent).clientX) - rect.left) * scaleX,
        y: ((touch?.clientY ?? (e as MouseEvent).clientY) - rect.top) * scaleY,
      };
    }

    function startDraw(e: MouseEvent | TouchEvent) {
      e.preventDefault();
      drawingRef.current = true;
      ctx!.beginPath();
      const { x, y } = getPos(e);
      ctx!.moveTo(x, y);
    }
    function draw(e: MouseEvent | TouchEvent) {
      e.preventDefault();
      if (!drawingRef.current) return;
      const { x, y } = getPos(e);
      ctx!.lineTo(x, y);
      ctx!.strokeStyle = c.teal;
      ctx!.lineWidth = 2.5;
      ctx!.lineCap = "round";
      ctx!.lineJoin = "round";
      ctx!.stroke();
      setHasSignature(true);
    }
    function stopDraw() { drawingRef.current = false; }

    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDraw);
    canvas.addEventListener("touchstart", startDraw, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stopDraw);

    return () => {
      canvas.removeEventListener("mousedown", startDraw);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stopDraw);
      canvas.removeEventListener("touchstart", startDraw);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", stopDraw);
    };
  }, [step]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  }, []);

  // ── HANDLERS ──────────────────────────────────────────────────

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;
    setFormLoading(true);
    setFormError("");
    try {
      const res = await fetch("/api/waitlist/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          email: formEmail.toLowerCase().trim(),
          childName: formChildName.trim() || null,
          countryCode: formCountry,
          role: formRole,
          referredBy,
        }),
      });
      const data = await res.json();
      if (data.ok || data.referralCode) {
        setSignupData(data);
        setChildName(data.childName || formChildName || "");
        setReferralCode(data.referralCode);
        setStep("commitment");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setFormError(data.error || "Something went wrong.");
      }
    } catch {
      setFormError("Network error. Please try again.");
    }
    setFormLoading(false);
  };

  const handleCommit = async () => {
    if (!subject || !goal || !hasSignature) return;
    setCommitLoading(true);
    const canvas = canvasRef.current;
    const signatureDataUrl = canvas?.toDataURL("image/png");
    const commitmentText = `I, ${signupData?.name}, commit to helping ${childName || "my child"} master ${subject}. My goal: ${goal}.`;
    try {
      await fetch("/api/waitlist/commitment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formEmail,
          childName,
          commitmentSubject: subject,
          commitmentGoal: goal,
          commitmentText,
          signatureDataUrl,
        }),
      });
      setStep("pricing");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch { /* silent */ }
    setCommitLoading(false);
  };

  const handleProceed = async (planId: string | null) => {
    setStep("share");
    setCardLoading(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    const plan = planId ? PLANS[planId] : null;

    // Save chosen plan
    if (planId && plan) {
      try {
        await fetch("/api/waitlist/commitment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formEmail,
            chosenPlan: planId,
            planPriceUsd: plan.usd,
            planOriginalPrice: plan.was,
          }),
        });
      } catch { /* silent */ }
    }

    // Generate image
    try {
      const res = await fetch("/api/waitlist/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referralCode,
          childName,
          subject,
          goal,
          plan: plan ? `${plan.label} — ${plan.price} · 60% off forever` : "Founding Member",
        }),
      });
      const data = await res.json();
      if (data.imageBase64) setCardImageUrl(data.imageBase64);
      else if (data.imageUrl) setCardImageUrl(data.imageUrl);
    } catch { /* silent */ }
    setCardLoading(false);
  };

  const shareWhatsApp = () => {
    const plan = PLANS[selectedPlan];
    const link = `https://zorvai.ca/waitlist?ref=${referralCode}`;
    const msg = `I just made a commitment for ${childName || "my child"}'s future. 📚\n\nI committed to helping ${childName || "my child"} master ${subject} — and I found an AI that teaches the way a real one-to-one tutor would.\n\nIf their score doesn't improve — full refund. No questions.\n\nFounding members get 60% off forever (${plan?.price || "$19/month"} instead of $49/month).\n\nYou should do this for your child: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const shareTwitter = () => {
    const link = `https://zorvai.ca/waitlist?ref=${referralCode}`;
    const msg = `I just committed to helping ${childName || "my child"} master ${subject} with @zorvai — an AI tutor that gives you a full refund if scores don't improve. Founding members get 60% off forever. ${link}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const shareFacebook = () => {
    const link = `https://zorvai.ca/waitlist?ref=${referralCode}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, "_blank");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`https://zorvai.ca/waitlist?ref=${referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCard = () => {
    if (!cardImageUrl) return;
    const a = document.createElement("a");
    a.href = cardImageUrl;
    a.download = `zorvai-commitment-${referralCode}.png`;
    a.click();
  };

  const activity = stats.recentActivity?.[activityIndex];
  const firstName = signupData?.name?.split(" ")[0] || "";

  // ── RENDER ──────────────────────────────────────────────────

  return (
    <div style={{ background: c.bg, minHeight: "100vh", color: c.text, fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* NAV */}
      <nav style={{ height: 56, background: c.bg, borderBottom: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: c.text, fontSize: 16, fontWeight: 700 }}>Zorvai</span>
          <span style={{ width: 5, height: 5, background: c.teal, borderRadius: "50%" }} />
        </div>
        {stats.total > 0 && (
          <span style={{ color: c.dim, fontSize: 12 }}>
            {stats.total} families joined
          </span>
        )}
      </nav>

      {/* LIVE ACTIVITY BADGE */}
      {activity && step === "form" && (
        <div style={{ maxWidth: 420, margin: "16px auto 0", padding: "0 24px" }}>
          <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 99, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 6, height: 6, background: c.success, borderRadius: "50%", flexShrink: 0, animation: "commitPulse 2s ease-in-out infinite" }} />
            <span style={{ color: c.muted, fontSize: 13, opacity: activityVisible ? 1 : 0, transition: "opacity 300ms ease" }}>
              {activity.firstName} from {activity.city || activity.country} joined {activity.minutesAgo}m ago
            </span>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* ═══════════════════ STEP 1: FORM ═══════════════════ */}
        {step === "form" && (
          <div>
            {/* Hero */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: c.tealBg, border: `1px solid ${c.tealBorder}`, borderRadius: 99, padding: "5px 14px", marginBottom: 20 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill={c.teal}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                <span style={{ color: c.teal, fontSize: 12, fontWeight: 500 }}>
                  {stats.spotsLeft ? `${stats.spotsLeft} founding spots left — 60% off forever` : "Join the waitlist"}
                </span>
              </div>
              <h1 style={{ fontSize: "clamp(24px, 5vw, 32px)", fontWeight: 600, lineHeight: 1.25, letterSpacing: "-0.3px", margin: "0 0 12px", fontFamily: "system-ui, sans-serif", color: c.text }}>
                Your child deserves<br />
                <span style={{ color: c.teal }}>a real tutor.</span>
              </h1>
              <p style={{ color: c.muted, fontSize: 15, lineHeight: 1.65, margin: 0 }}>
                Zorvai teaches the way a one-to-one tutor would — checking real understanding before moving on. If scores don&apos;t improve, full refund.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleJoin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ color: c.muted, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, display: "block", marginBottom: 6 }}>Your name</label>
                <input value={formName} onChange={(e) => setFormName(e.target.value)} onFocus={() => setFormFocus((p) => ({ ...p, name: true }))} onBlur={() => setFormFocus((p) => ({ ...p, name: false }))} placeholder="Priya Sharma" required style={inputStyle(!!formFocus.name)} />
              </div>
              <div>
                <label style={{ color: c.muted, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, display: "block", marginBottom: 6 }}>Email address</label>
                <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} onFocus={() => setFormFocus((p) => ({ ...p, email: true }))} onBlur={() => setFormFocus((p) => ({ ...p, email: false }))} placeholder="priya@email.com" required style={inputStyle(!!formFocus.email)} />
              </div>
              <div>
                <label style={{ color: c.muted, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, display: "block", marginBottom: 6 }}>Child&apos;s first name (optional)</label>
                <input value={formChildName} onChange={(e) => setFormChildName(e.target.value)} onFocus={() => setFormFocus((p) => ({ ...p, child: true }))} onBlur={() => setFormFocus((p) => ({ ...p, child: false }))} placeholder="Aanya" style={inputStyle(!!formFocus.child)} />
              </div>
              <div>
                <label style={{ color: c.muted, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, display: "block", marginBottom: 6 }}>Country</label>
                <select value={formCountry} onChange={(e) => setFormCountry(e.target.value)} style={{ ...inputStyle(false), appearance: "none" as const, cursor: "pointer" }}>
                  {COUNTRIES.map((co) => <option key={co.code} value={co.code}>{co.name}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {([["parent", "I'm a parent"], ["student", "I'm a student"]] as const).map(([val, label]) => (
                  <button key={val} type="button" onClick={() => setFormRole(val)} style={{
                    flex: 1, padding: 10, borderRadius: 10, fontSize: 13, cursor: "pointer",
                    border: `1px solid ${formRole === val ? c.teal : c.border}`,
                    background: formRole === val ? c.tealBg : c.surface,
                    color: formRole === val ? c.teal : c.muted,
                    transition: "all 150ms ease", fontWeight: 500,
                  }}>
                    {label}
                  </button>
                ))}
              </div>
              {formError && <p style={{ color: "#ef4444", fontSize: 13, textAlign: "center" }}>{formError}</p>}
              <div style={{ marginTop: 4 }}>
                <button type="submit" disabled={formLoading} style={{
                  width: "100%", padding: "14px 24px", background: formLoading ? c.raised : c.teal,
                  color: formLoading ? c.dim : c.bg, border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700,
                  cursor: formLoading ? "not-allowed" : "pointer", transition: "all 150ms ease",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  {formLoading ? (<><span style={{ width: 16, height: 16, border: `2px solid ${c.bg}`, borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />Processing...</>) : "Continue →"}
                </button>
                <p style={{ color: c.dim, fontSize: 12, textAlign: "center", marginTop: 10 }}>No credit card. No commitment yet. Just your spot.</p>
              </div>
            </form>

            {/* Guarantee box */}
            <div style={{ marginTop: 32, background: c.surface, border: `1px solid ${c.border}`, borderRadius: 12, padding: "16px 20px" }}>
              <p style={{ color: c.text, fontSize: 14, fontWeight: 600, margin: "0 0 6px" }}>Scores go up — or full refund.</p>
              <p style={{ color: c.muted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>We track your child&apos;s score before and after. If it doesn&apos;t improve after 12 sessions in 30 days — full refund. No questions.</p>
            </div>
          </div>
        )}

        {/* ═══════════════════ STEP 2: COMMITMENT PAPER ═══════════════════ */}
        {step === "commitment" && (
          <div style={{ animation: "slideIn 300ms ease both" }}>
            <p style={{ color: c.muted, fontSize: 14, marginBottom: 20 }}>The families who improve the most made a specific promise first.</p>

            {/* Paper */}
            <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, padding: 28, boxShadow: "0 24px 64px rgba(0,0,0,0.4)", marginBottom: 16 }}>
              <p style={{ textAlign: "center", color: c.teal, fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", margin: "0 0 6px" }}>ZORVAI</p>
              <h2 style={{ textAlign: "center", fontSize: 18, fontWeight: 600, color: c.text, margin: "0 0 16px", fontFamily: "system-ui, sans-serif" }}>Commitment Letter</h2>
              <div style={{ height: 1, background: c.border, marginBottom: 20 }} />

              <p style={{ fontSize: 15, color: c.text, lineHeight: 2.1, margin: "0 0 12px" }}>
                I, <span style={{ color: c.teal, fontWeight: 600 }}>{signupData?.name}</span>, as the parent of{" "}
                <input value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="child's name" style={{ background: "transparent", border: "none", borderBottom: `1px solid ${c.borderHi}`, color: c.teal, fontSize: 15, outline: "none", padding: "0 4px 2px", minWidth: 100 }} />, commit to investing in my child&apos;s education.
              </p>

              <p style={{ fontSize: 15, color: c.text, lineHeight: 1.8, margin: "0 0 8px" }}>My child currently struggles most with:</p>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} style={{ background: "transparent", border: "none", borderBottom: `1px solid ${c.borderHi}`, color: c.teal, fontSize: 15, outline: "none", padding: "0 4px 6px", marginBottom: 16, width: "100%", cursor: "pointer" }}>
                <option value="" style={{ background: c.surface }}>Select subject...</option>
                {SUBJECTS.map((s) => <option key={s} value={s} style={{ background: c.surface }}>{s}</option>)}
              </select>

              <p style={{ fontSize: 15, color: c.text, lineHeight: 1.8, margin: "0 0 8px" }}>My specific goal for them is:</p>
              <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Pass board exam / Improve from C to A / Score above 80%" style={{ background: "transparent", border: "none", borderBottom: `1px solid ${c.borderHi}`, color: c.teal, fontSize: 15, outline: "none", padding: "0 4px 6px", marginBottom: 20, width: "100%" }} />

              <p style={{ fontSize: 14, color: c.muted, lineHeight: 1.7, fontStyle: "italic", margin: "0 0 20px" }}>
                &ldquo;I believe my child is capable of more. I am making this commitment today because their future matters more than the cost of one month of private tutoring.&rdquo;
              </p>

              <div style={{ height: 1, background: c.border, marginBottom: 16 }} />

              {/* Signature canvas */}
              <p style={{ fontSize: 12, color: c.muted, margin: "0 0 8px" }}>Your signature</p>
              <canvas ref={canvasRef} width={600} height={120} style={{ width: "100%", height: 100, background: c.raised, borderRadius: 8, border: `1px solid ${c.border}`, cursor: "crosshair", touchAction: "none", display: "block" }} />
              <button onClick={clearCanvas} style={{ background: "none", border: "none", color: c.dim, fontSize: 12, cursor: "pointer", marginTop: 6, padding: 0 }}>Clear signature</button>

              <p style={{ fontSize: 12, color: c.dim, marginTop: 12 }}>
                Date: {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            </div>

            {/* Commit button */}
            <button onClick={handleCommit} disabled={!subject || !goal || !hasSignature || commitLoading} style={{
              width: "100%", padding: "14px 24px", borderRadius: 10, border: "none", fontSize: 15, fontWeight: 700,
              background: (!subject || !goal || !hasSignature) ? c.raised : c.teal,
              color: (!subject || !goal || !hasSignature) ? c.dim : c.bg,
              cursor: (!subject || !goal || !hasSignature || commitLoading) ? "not-allowed" : "pointer",
              transition: "all 200ms ease",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              {commitLoading ? (<><span style={{ width: 16, height: 16, border: `2px solid ${c.bg}`, borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />Processing...</>) : "I commit to my child's future →"}
            </button>
            {(!subject || !goal || !hasSignature) && (
              <p style={{ textAlign: "center", color: c.dim, fontSize: 12, marginTop: 8 }}>
                {!hasSignature ? "Add your signature above to continue" : "Fill in subject and goal to continue"}
              </p>
            )}
          </div>
        )}

        {/* ═══════════════════ STEP 3: PRICING ═══════════════════ */}
        {step === "pricing" && (
          <div style={{ animation: "slideIn 300ms ease both" }}>
            <h2 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 8px", color: c.text, fontFamily: "system-ui, sans-serif" }}>
              {firstName}, can you invest in {childName || "your child"}&apos;s future?
            </h2>
            <p style={{ color: c.muted, fontSize: 15, lineHeight: 1.7, margin: "0 0 28px" }}>
              You just committed to helping {childName || "your child"} master {subject}. One month of private tutoring costs $200–400. Zorvai costs less than a family dinner out. And if their scores don&apos;t improve — full refund.
            </p>

            {/* Plan cards */}
            {Object.entries(PLANS).map(([id, plan], i) => (
              <div key={id} onClick={() => setSelectedPlan(id)} style={{
                position: "relative",
                background: selectedPlan === id ? c.tealBg : c.surface,
                border: `1px solid ${selectedPlan === id ? c.teal : c.border}`,
                borderRadius: 14, padding: "18px 20px", marginBottom: 10, cursor: "pointer",
                transition: "all 150ms ease",
                animation: `fadeUp 300ms ${i * 80}ms ease both`,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                {(plan.popular || plan.badge) && (
                  <span style={{ position: "absolute", top: -10, right: 14, background: c.teal, color: c.bg, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99 }}>
                    {plan.popular ? "MOST POPULAR" : plan.badge?.toUpperCase()}
                  </span>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                    border: `2px solid ${selectedPlan === id ? c.teal : c.borderHi}`,
                    background: selectedPlan === id ? c.teal : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 150ms ease",
                  }}>
                    {selectedPlan === id && <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.bg }} />}
                  </span>
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 600, color: c.text, margin: 0 }}>{plan.label}</p>
                    <p style={{ fontSize: 12, color: c.muted, margin: 0 }}>{plan.sub}</p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 20, fontWeight: 700, color: selectedPlan === id ? c.teal : c.text, margin: 0 }}>{plan.price}</p>
                  <p style={{ fontSize: 12, color: c.dim, textDecoration: "line-through", margin: 0 }}>{plan.was}</p>
                  <span style={{ display: "inline-block", marginTop: 4, background: c.tealBg, color: c.teal, border: `1px solid ${c.tealBorder}`, borderRadius: 99, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{plan.pill}</span>
                </div>
              </div>
            ))}

            <p style={{ textAlign: "center", color: c.dim, fontSize: 12, margin: "8px 0 20px" }}>🔒 60% off is locked in forever for founding members. Regular price returns after 500 signups.</p>

            <button onClick={() => handleProceed(selectedPlan)} style={{ width: "100%", padding: "14px 24px", background: c.teal, color: c.bg, fontWeight: 700, fontSize: 15, borderRadius: 10, border: "none", cursor: "pointer", transition: "all 150ms ease" }}>
              Get {childName || "my child"} started for {PLANS[selectedPlan].price} →
            </button>

            <p onClick={() => handleProceed(null)} style={{ textAlign: "center", color: c.dim, fontSize: 13, marginTop: 14, cursor: "pointer" }}>
              Not ready to pay yet — stay on the free waitlist
            </p>
          </div>
        )}

        {/* ═══════════════════ STEP 4: SHARE CARD ═══════════════════ */}
        {step === "share" && (
          <div style={{ animation: "slideIn 300ms ease both" }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 6px", color: c.text, fontFamily: "system-ui, sans-serif" }}>Your commitment card is ready.</h2>
            <p style={{ color: c.muted, fontSize: 14, margin: "0 0 24px" }}>Share it. Every 3 families you refer keeps your price locked forever.</p>

            {/* Card or loading */}
            {cardLoading ? (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <p style={{ color: c.teal, fontSize: 11, letterSpacing: "0.1em", fontWeight: 700, marginBottom: 16 }}>ZORVAI</p>
                <div style={{ width: "100%", height: 4, background: c.raised, borderRadius: 99, overflow: "hidden", marginBottom: 16 }}>
                  <div style={{ height: "100%", background: c.teal, borderRadius: 99, animation: "loadBar 12s linear forwards" }} />
                </div>
                <p style={{ color: c.muted, fontSize: 14, marginBottom: 4 }}>Creating your commitment card...</p>
                <p style={{ color: c.dim, fontSize: 12 }}>Our AI is designing a card from your commitment</p>
              </div>
            ) : cardImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cardImageUrl} alt="Your commitment card" style={{ width: "100%", maxWidth: 300, display: "block", margin: "0 auto 24px", borderRadius: 20, boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(78,205,196,0.15)", animation: "commitFloat 5s ease-in-out infinite" }} />
            ) : (
              <div style={{ width: "100%", height: 320, background: c.surface, border: `1px solid ${c.border}`, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", color: c.dim, fontSize: 14, marginBottom: 24 }}>
                Card unavailable — share the link below
              </div>
            )}

            {/* Download */}
            {cardImageUrl && (
              <button onClick={downloadCard} style={{ width: "100%", padding: 12, background: c.surface, color: c.text, border: `1px solid ${c.border}`, borderRadius: 10, fontSize: 14, cursor: "pointer", marginBottom: 12 }}>↓ Download card</button>
            )}

            {/* WhatsApp primary */}
            <button onClick={shareWhatsApp} style={{ width: "100%", padding: 14, background: "#25D366", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" /></svg>
              Share on WhatsApp
            </button>

            {/* Other share */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 24 }}>
              <button onClick={shareTwitter} style={{ padding: 10, background: "#000", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>𝕏 Twitter</button>
              <button onClick={shareFacebook} style={{ padding: 10, background: "#1877F2", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Facebook</button>
              <button onClick={copyLink} style={{ padding: 10, background: copied ? c.tealBg : c.surface, color: copied ? c.teal : c.text, border: `1px solid ${copied ? c.teal : c.border}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 200ms ease" }}>{copied ? "Copied ✓" : "Copy link"}</button>
            </div>

            {/* Referral info */}
            <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
              <p style={{ color: c.muted, fontSize: 12, margin: "0 0 6px" }}>Your referral link</p>
              <p style={{ color: c.teal, fontSize: 13, fontFamily: "monospace", margin: "0 0 16px", wordBreak: "break-all" }}>zorvai.ca/waitlist?ref={referralCode}</p>
              {[
                { n: 1, text: "referral → jump 50 spots" },
                { n: 3, text: "referrals → 60% off stays locked even if tier closes" },
                { n: 5, text: "referrals → first month completely free" },
                { n: 10, text: "referrals → Founding Resistance Member — in the app forever" },
              ].map((m) => (
                <div key={m.n} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: c.tealBg, border: `1px solid ${c.tealBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: c.teal }}>{m.n}</span>
                  <span style={{ fontSize: 13, color: c.muted }}>{m.text}</span>
                </div>
              ))}
            </div>

            {/* Jealousy / curiosity rotating feed */}
            <div style={{ borderLeft: `3px solid ${c.teal}`, background: c.raised, borderRadius: "0 8px 8px 0", padding: "12px 16px", opacity: jealousyVisible ? 1 : 0, transition: "opacity 400ms ease" }}>
              <p style={{ margin: 0, fontSize: 13, color: c.muted, lineHeight: 1.5 }}>{jealousyText}</p>
            </div>
          </div>
        )}

      </div>

      {/* FOOTER */}
      <footer style={{ background: c.bg, borderTop: `1px solid ${c.border}`, padding: 24, textAlign: "center" }}>
        <p style={{ color: c.dim, fontSize: 12, margin: "0 0 8px" }}>
          © 2026 Zorvai · <a href="/privacy" style={{ color: c.dim }}>Privacy</a> · hello@zorvai.ca
        </p>
        <p style={{ color: c.dim, fontSize: 11, margin: 0 }}>
          Regular price: $49/month. Founding members get 60% off forever.
        </p>
      </footer>
    </div>
  );
}
