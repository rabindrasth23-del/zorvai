"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";

/* ═══════════════════════════════════════════════════════════════════
   Zorvai Waitlist — Premium Redesign
   Design: Minimalist dark, 3D depth, distinctive typography,
   deliberate motion, compact single-purpose layout
   ═══════════════════════════════════════════════════════════════════ */

const LAUNCH_DATE = new Date("2026-09-19T00:00:00+05:45");

/* ── Types ── */
interface Stats {
  total: number;
  lastHour: number;
  currentTier: number;
  spotsLeft: number | null;
  discountPercent: number;
  recentActivity: Array<{ firstName: string; city: string | null; country: string; minutesAgo: number }>;
}

interface SignupData {
  referralCode: string;
  position: number;
  tier: number;
  discountPercent: number;
  name: string;
  childName: string | null;
  alreadyJoined: boolean;
}

/* ── Tokens ── */
const t = {
  bg: "#0a0a09", surface: "#111110", raised: "#181716",
  border: "#1a1918", borderHi: "#2a2826",
  text: "#f0ede8", muted: "#7a7672", dim: "#4a4844",
  teal: "#4ecdc4", tealBg: "rgba(78,205,196,0.06)",
  tealBorder: "rgba(78,205,196,0.15)",
  amber: "#fbbf24", success: "#4ade80",
};

const COUNTRIES = [
  { code: "NP", name: "Nepal" }, { code: "IN", name: "India" },
  { code: "BD", name: "Bangladesh" }, { code: "GB", name: "UK" },
  { code: "US", name: "US" }, { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" }, { code: "AE", name: "UAE" },
  { code: "SG", name: "Singapore" }, { code: "XX", name: "Other" },
];

/* ── Countdown hook ── */
function useCountdown(target: Date) {
  const calc = useCallback(() => {
    const diff = Math.max(0, target.getTime() - Date.now());
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      mins: Math.floor((diff % 3600000) / 60000),
      secs: Math.floor((diff % 60000) / 1000),
    };
  }, [target]);
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);
  return time;
}

/* ── 3D Tilt Card ── */
function Card3D({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [rot, setRot] = useState({ x: 0, y: 0 });
  const handleMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setRot({
      x: ((e.clientY - r.top) / r.height - 0.5) * -8,
      y: ((e.clientX - r.left) / r.width - 0.5) * 8,
    });
  };
  return (
    <div ref={ref} onMouseMove={handleMove} onMouseLeave={() => setRot({ x: 0, y: 0 })}
      style={{
        background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16,
        padding: 24, transform: `perspective(800px) rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
        transition: "transform 150ms ease",
        boxShadow: "0 16px 48px rgba(0,0,0,0.3)", ...style,
      }}>
      {children}
    </div>
  );
}

/* ── FAQ Item ── */
function FaqItem({ q, a, open, onClick }: { q: string; a: string; open: boolean; onClick: () => void }) {
  return (
    <div style={{ borderBottom: `1px solid ${t.border}` }}>
      <button onClick={onClick} style={{
        width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 0", border: "none", background: "none", cursor: "pointer",
        fontFamily: "'Inter',sans-serif", textAlign: "left",
      }}>
        <span style={{ color: t.text, fontSize: 14, fontWeight: 500, paddingRight: 16 }}>{q}</span>
        <span style={{ color: t.dim, fontSize: 18, flexShrink: 0, transition: "transform 200ms",
          transform: open ? "rotate(45deg)" : "rotate(0)" }}>+</span>
      </button>
      <div style={{
        maxHeight: open ? 200 : 0, overflow: "hidden",
        transition: "max-height 300ms cubic-bezier(.16,1,.3,1)",
      }}>
        <p style={{ color: t.muted, fontSize: 13, lineHeight: 1.7, paddingBottom: 16 }}>{a}</p>
      </div>
    </div>
  );
}

/* ── Animated Counter Digit ── */
function CountDigit({ value, label }: { value: number; label: string }) {
  const str = String(value).padStart(2, "0");
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ display: "flex", gap: 3, justifyContent: "center" }}>
        {str.split("").map((d, i) => (
          <span key={`${label}-${i}`} style={{
            fontSize: "clamp(40px,9vw,64px)", fontWeight: 700, lineHeight: 1,
            color: t.text, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em",
          }}>{d}</span>
        ))}
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.14em",
        textTransform: "uppercase", color: t.dim, marginTop: 6, display: "block" }}>{label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
export default function WaitlistPage() {
  const countdown = useCountdown(LAUNCH_DATE);
  const [stats, setStats] = useState<Stats | null>(null);
  const [step, setStep] = useState<"form" | "success">("form");
  const [signup, setSignup] = useState<SignupData | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [referredBy, setReferredBy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Activity feed
  const [actIdx, setActIdx] = useState(0);
  const [actVisible, setActVisible] = useState(true);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("NP");
  const [role, setRole] = useState<"parent" | "student">("parent");

  const fetchStats = useCallback(async () => {
    try { setStats(await (await fetch("/api/waitlist/stats")).json()); } catch {}
  }, []);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("ref")) setReferredBy(p.get("ref"));
    fetchStats();
    const id = setInterval(fetchStats, 30000);
    return () => clearInterval(id);
  }, [fetchStats]);

  // Cycle activity feed
  useEffect(() => {
    if (!stats?.recentActivity?.length) return;
    const id = setInterval(() => {
      setActVisible(false);
      setTimeout(() => {
        setActIdx(i => (i + 1) % (stats.recentActivity?.length || 1));
        setActVisible(true);
      }, 200);
    }, 4000);
    return () => clearInterval(id);
  }, [stats?.recentActivity]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setFormLoading(true);
    try {
      const res = await fetch("/api/waitlist/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, countryCode: country, role, referredBy }),
      });
      const data = await res.json();
      if (data.ok) { setSignup(data); setStep("success"); window.scrollTo({ top: 0, behavior: "smooth" }); }
    } catch {} finally { setFormLoading(false); }
  };

  const handleCopy = () => {
    if (!signup) return;
    navigator.clipboard.writeText(`https://zorvai.ca/?ref=${signup.referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activity = stats?.recentActivity?.[actIdx];

  const faqs = [
    { q: "How is this different from ChatGPT or a chatbot?", a: "Chatbots answer questions. Zorvai teaches. It follows Learn → Recall → Challenge — the student must explain concepts back before moving on. It checks real understanding, not just whether they read the material." },
    { q: "How does the money-back guarantee work?", a: "Before starting, your child takes a short baseline quiz. After 12+ sessions in 30 days, they retake it. If scores haven't improved — full refund, no questions asked." },
    { q: "What ages and subjects?", a: "Grades 6–12 (ages 11–18). Math, Science, English, Biology, Chemistry, Physics, History, Geography. Adapts to CBSE, NEB, SSC, GCSE curriculums." },
    { q: "What languages?", a: "English, Hindi, Nepali, and Bengali. The tutor adapts to your child's preferred language." },
    { q: "What's the referral programme?", a: "Each referral = jump 50 spots. 3 referrals = best tier guaranteed forever. 10 = Founding Member with special perks." },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: ${t.bg}; overflow-x: hidden; }
        ::placeholder { color: ${t.dim}; }
        ::selection { background: rgba(78,205,196,0.2); }
        input:focus, select:focus { border-color: ${t.tealBorder} !important; box-shadow: 0 0 0 3px ${t.tealBg} !important; outline: none; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulseGlow { 0%,100% { box-shadow:0 0 0 0 rgba(78,205,196,0.3); } 50% { box-shadow:0 0 0 8px rgba(78,205,196,0); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes dotPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes gradMove { 0%,100%{opacity:0.5;transform:translate(0,0)} 50%{opacity:0.8;transform:translate(30px,-20px)} }
        .input-d { width:100%; background:${t.surface}; border:1px solid ${t.border}; border-radius:12px; padding:13px 16px; color:${t.text}; font-size:15px; font-family:'Inter',sans-serif; transition:all 200ms; }
        .input-d:hover { border-color: ${t.borderHi}; }
        .btn-p { width:100%; padding:15px; border-radius:12px; border:none; background:${t.text}; color:${t.bg}; font-weight:600; font-size:15px; cursor:pointer; font-family:'Inter',sans-serif; position:relative; overflow:hidden; transition:all 200ms; }
        .btn-p:hover { background:#fff; transform:translateY(-1px); box-shadow:0 4px 20px rgba(240,237,232,0.12); }
        .btn-p:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
        .btn-p::after { content:''; position:absolute; inset:0; background:linear-gradient(90deg,transparent 30%,rgba(255,255,255,0.2) 50%,transparent 70%); background-size:200% 100%; animation:shimmer 2.5s infinite; }
        @media (prefers-reduced-motion:reduce) { *, *::before, *::after { animation-duration:0.01ms !important; transition-duration:0.01ms !important; } }
        @media (max-width:480px) { .countdown-g { gap:10px !important; } .form-c { margin:0 12px !important; padding:24px 18px !important; } }
      `}</style>

      <div style={{ minHeight: "100vh", background: t.bg, fontFamily: "'Inter',system-ui,sans-serif", color: t.text, position: "relative" }}>

        {/* ── Ambient orbs ── */}
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
          <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(78,205,196,0.04) 0%, transparent 70%)", top: "-15%", right: "-10%", animation: "gradMove 8s ease-in-out infinite" }} />
          <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(251,191,36,0.02) 0%, transparent 70%)", bottom: "-5%", left: "-8%", animation: "gradMove 10s ease-in-out infinite reverse" }} />
        </div>

        {/* ── Grain ── */}
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1, opacity: 0.02, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

        <div style={{ position: "relative", zIndex: 2 }}>

          {/* ════ SECTION 1: HERO + FORM ════ */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 20px 40px", minHeight: step === "form" ? "auto" : undefined }}>

            {/* Logo */}
            <div style={{ animation: "fadeUp 0.4s cubic-bezier(.16,1,.3,1) both", marginBottom: 24 }}>
              <Image src="/logo.png" alt="Zorvai" width={40} height={40} style={{ borderRadius: 10 }} />
            </div>

            {/* Live badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 16px", borderRadius: 99, border: `1px solid ${t.border}`, background: t.surface, animation: "fadeUp 0.4s cubic-bezier(.16,1,.3,1) 0.05s both", marginBottom: 24 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.teal, animation: "pulseGlow 2s infinite" }} />
              <span style={{ fontSize: 12, color: t.muted, fontWeight: 500 }}>
                {stats && stats.total > 0 ? `${stats.total} families waiting` : "Get early access"}
                {stats && stats.lastHour > 0 && <span style={{ color: t.teal }}> · {stats.lastHour} joined this hour</span>}
              </span>
            </div>

            {/* Heading */}
            {step === "form" ? (
              <>
                <h1 style={{
                  fontSize: "clamp(32px,6.5vw,52px)", fontWeight: 800, textAlign: "center",
                  lineHeight: 1.08, letterSpacing: "-0.03em", maxWidth: 540,
                  animation: "fadeUp 0.5s cubic-bezier(.16,1,.3,1) 0.1s both",
                }}>
                  Your child is studying.<br />
                  They&apos;re probably not{" "}
                  <span style={{ color: t.teal }}>learning.</span>
                </h1>

                <p style={{
                  marginTop: 18, color: t.muted, fontSize: 15, lineHeight: 1.7,
                  textAlign: "center", maxWidth: 420,
                  animation: "fadeUp 0.5s cubic-bezier(.16,1,.3,1) 0.15s both",
                }}>
                  Zorvai teaches like a real tutor — it checks understanding before moving on.
                  Not a chatbot. A tutor that makes scores go up.
                </p>

                {/* Guarantee badge */}
                <div style={{
                  marginTop: 16, display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "8px 18px", borderRadius: 12,
                  background: t.tealBg, border: `1px solid ${t.tealBorder}`,
                  animation: "fadeUp 0.5s cubic-bezier(.16,1,.3,1) 0.18s both",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.teal} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span style={{ fontSize: 13, fontWeight: 600, color: t.teal }}>
                    Scores improve — or full refund
                  </span>
                </div>
              </>
            ) : (
              <>
                <h1 style={{
                  fontSize: "clamp(28px,5vw,44px)", fontWeight: 800, textAlign: "center",
                  lineHeight: 1.1, letterSpacing: "-0.03em",
                  animation: "fadeUp 0.4s cubic-bezier(.16,1,.3,1) both",
                }}>
                  {signup?.alreadyJoined ? "Welcome back! 👋" : "You're in! 🎉"}
                </h1>
                <p style={{ marginTop: 12, color: t.muted, fontSize: 15, textAlign: "center",
                  animation: "fadeUp 0.4s cubic-bezier(.16,1,.3,1) 0.08s both" }}>
                  {signup?.alreadyJoined
                    ? <>Already on the waitlist · Position <span style={{ color: t.teal, fontWeight: 700 }}>#{signup?.position}</span></>
                    : <>Position <span style={{ color: t.teal, fontWeight: 700 }}>#{signup?.position}</span> on the waitlist</>}
                </p>
                {signup?.referralCode && (
                  <div style={{
                    marginTop: 10, display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "6px 14px", borderRadius: 8, background: t.surface, border: `1px solid ${t.border}`,
                    animation: "fadeUp 0.4s cubic-bezier(.16,1,.3,1) 0.12s both",
                  }}>
                    <span style={{ fontSize: 11, color: t.dim }}>Your code:</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: t.text, fontFamily: "monospace", letterSpacing: "0.06em" }}>{signup.referralCode}</span>
                  </div>
                )}
              </>
            )}

            {/* Countdown */}
            <div className="countdown-g" style={{
              display: "flex", alignItems: "center", gap: 16, marginTop: 32,
              animation: "fadeUp 0.5s cubic-bezier(.16,1,.3,1) 0.2s both",
            }}>
              <CountDigit value={countdown.days} label="Days" />
              <span style={{ fontSize: 32, fontWeight: 300, color: t.borderHi, marginTop: -16 }}>:</span>
              <CountDigit value={countdown.hours} label="Hours" />
              <span style={{ fontSize: 32, fontWeight: 300, color: t.borderHi, marginTop: -16 }}>:</span>
              <CountDigit value={countdown.mins} label="Min" />
              <span style={{ fontSize: 32, fontWeight: 300, color: t.borderHi, marginTop: -16 }}>:</span>
              <CountDigit value={countdown.secs} label="Sec" />
            </div>

            {/* ── FORM ── */}
            {step === "form" && (
              <div className="form-c" style={{ marginTop: 36, width: "100%", maxWidth: 420, animation: "fadeUp 0.5s cubic-bezier(.16,1,.3,1) 0.25s both" }}>
                <form onSubmit={handleJoin} style={{
                  background: t.surface, border: `1px solid ${t.border}`, borderRadius: 18,
                  padding: "24px 24px 20px", display: "flex", flexDirection: "column", gap: 10,
                }}>
                  <input className="input-d" type="text" placeholder="Your full name" required value={name} onChange={e => setName(e.target.value)} />
                  <input className="input-d" type="email" placeholder="you@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <select className="input-d" value={country} onChange={e => setCountry(e.target.value)} style={{ appearance: "none" as const }}>
                      {COUNTRIES.map(c => <option key={c.code} value={c.code} style={{ background: t.surface }}>{c.name}</option>)}
                    </select>
                    <div style={{ display: "flex", background: t.surface, borderRadius: 12, border: `1px solid ${t.border}`, overflow: "hidden" }}>
                      {(["parent", "student"] as const).map(r => (
                        <button type="button" key={r} onClick={() => setRole(r)} style={{
                          flex: 1, padding: "11px 0", border: "none", cursor: "pointer",
                          fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 500,
                          transition: "all 200ms",
                          background: role === r ? t.tealBg : "transparent",
                          color: role === r ? t.teal : t.dim,
                        }}>
                          {r === "parent" ? "👨‍👩‍👧 Parent" : "🎓 Student"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="btn-p" disabled={formLoading} style={{ marginTop: 2 }}>
                    {formLoading ? "Joining..." : "Join the waitlist →"}
                  </button>
                </form>

                {/* Social proof */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14 }}>
                  <div style={{ display: "flex" }}>
                    {["#4ecdc4", "#fbbf24", "#a78bfa", "#f87171"].map((c, i) => (
                      <div key={i} style={{
                        width: 22, height: 22, borderRadius: "50%", background: c,
                        border: `2px solid ${t.bg}`, marginLeft: i > 0 ? -7 : 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 9, fontWeight: 700, color: t.bg,
                      }}>{["P", "A", "R", "S"][i]}</div>
                    ))}
                  </div>
                  <span style={{ color: t.dim, fontSize: 12 }}>
                    Join <span style={{ color: t.muted, fontWeight: 600 }}>{stats?.total || 0}</span> others
                  </span>
                </div>
              </div>
            )}

            {/* ── SUCCESS STATE ── */}
            {step === "success" && signup && (
              <div style={{ marginTop: 32, width: "100%", maxWidth: 420, animation: "fadeUp 0.4s cubic-bezier(.16,1,.3,1) 0.1s both" }}>
                <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 18, padding: 24, textAlign: "center" }}>

                  {/* Discount badge */}
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 18px", borderRadius: 99, background: t.tealBg, border: `1px solid ${t.tealBorder}`, marginBottom: 16 }}>
                    <span style={{ color: t.teal, fontSize: 13, fontWeight: 600 }}>
                      {signup.discountPercent > 0 ? `🎉 You locked ${signup.discountPercent}% off — forever` : "You're on the waitlist!"}
                    </span>
                  </div>

                  <p style={{ color: t.muted, fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>
                    {signup.tier === 1 ? `Founding member #${signup.position}. Lock your ${signup.discountPercent}% lifetime discount now.`
                      : signup.tier === 2 ? `Early member discount: ${signup.discountPercent}% off forever.`
                      : "We'll notify you when we launch."}
                  </p>

                  {/* Progress bar */}
                  {stats && stats.spotsLeft !== null && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: t.dim }}>Founding spots</span>
                        <span style={{ fontSize: 11, color: t.teal, fontWeight: 600 }}>
                          {stats.currentTier === 1 ? `${100 - (stats.spotsLeft || 0)}/100` : "Filled"}
                        </span>
                      </div>
                      <div style={{ height: 3, background: t.border, borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${t.teal}, #3db8b0)`, width: stats.currentTier === 1 ? `${((100 - (stats.spotsLeft || 0)) / 100) * 100}%` : "100%", transition: "width 1s" }} />
                      </div>
                    </div>
                  )}

                  {/* Pricing + Pay now */}
                  {signup.discountPercent > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 8, marginBottom: 12 }}>
                        <span style={{ fontSize: 13, color: t.dim, textDecoration: "line-through" }}>$29/mo</span>
                        <span style={{ fontSize: 28, fontWeight: 800, color: t.text, fontVariantNumeric: "tabular-nums" }}>
                          ${Math.round(29 * (1 - signup.discountPercent / 100))}
                        </span>
                        <span style={{ fontSize: 13, color: t.dim }}>/mo forever</span>
                      </div>

                      <button onClick={async () => {
                        try {
                          const res = await fetch("/api/waitlist/payment/intent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, planId: "student_solo_monthly" }) });
                          const data = await res.json();
                          if (data.checkoutUrl) window.location.href = data.checkoutUrl;
                          else alert("Payment setup coming soon! Your discount is locked.");
                        } catch { alert("Payment setup coming soon! Your discount is locked."); }
                      }} style={{
                        width: "100%", padding: 14, borderRadius: 12, border: "none",
                        background: `linear-gradient(135deg, ${t.teal}, #3db8b0)`,
                        color: t.bg, fontSize: 14, fontWeight: 700, cursor: "pointer",
                        fontFamily: "'Inter',sans-serif", transition: "all 200ms",
                        boxShadow: "0 4px 20px rgba(78,205,196,0.2)",
                      }}>
                        💳 Pay now — lock ${Math.round(29 * (1 - signup.discountPercent / 100))}/mo forever
                      </button>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 10 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                        <span style={{ fontSize: 10, color: t.dim }}>100% refund if scores don&apos;t improve</span>
                      </div>

                      <button onClick={() => {}} style={{
                        width: "100%", marginTop: 8, padding: 8, borderRadius: 8,
                        border: "none", background: "transparent", color: t.dim,
                        fontSize: 11, cursor: "pointer", fontFamily: "'Inter',sans-serif",
                      }}>Maybe later — keep my spot</button>
                    </div>
                  )}

                  {/* Share */}
                  <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 16 }}>
                    <p style={{ fontSize: 10, color: t.dim, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Share to jump the line</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => {
                        if (!signup) return;
                        const msg = encodeURIComponent(`I joined the Zorvai waitlist — an AI tutor that checks real understanding.\n\n${stats?.spotsLeft ? `${stats.spotsLeft} founding spots left at ${stats?.discountPercent}% off.` : ""}\n\nJoin: https://zorvai.ca/?ref=${signup.referralCode}`);
                        window.open(`https://wa.me/9779763575615?text=${msg}`, "_blank");
                      }} style={{ flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${t.border}`, background: t.surface, color: "#25d366", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>WhatsApp</button>
                      <button onClick={handleCopy} style={{ flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${t.border}`, background: t.surface, color: copied ? t.success : t.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>{copied ? "Copied ✓" : "Copy link"}</button>
                    </div>
                    <p style={{ fontSize: 10, color: t.dim, marginTop: 8 }}>1 referral = jump 50 spots · 3 = best tier forever</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Live Activity Feed ── */}
          {activity && (
            <div style={{ maxWidth: 380, margin: "0 auto", padding: "0 20px" }}>
              <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 5, height: 5, background: t.success, borderRadius: "50%", flexShrink: 0, animation: "dotPulse 2s infinite" }} />
                <span style={{ color: t.muted, fontSize: 12, opacity: actVisible ? 1 : 0, transition: "opacity 200ms" }}>
                  {activity.firstName} from {activity.city || activity.country} joined {activity.minutesAgo}m ago
                </span>
              </div>
            </div>
          )}

          {/* ════ SECTION 2: HOW IT WORKS — 3D Cards ════ */}
          {step === "form" && (
            <div style={{ padding: "56px 20px 0", maxWidth: 520, margin: "0 auto" }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: "center", letterSpacing: "-0.02em", marginBottom: 8 }}>
                What makes Zorvai different
              </h2>
              <p style={{ color: t.muted, fontSize: 14, textAlign: "center", marginBottom: 28 }}>
                Not another chatbot. A real teaching method.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { icon: "📖", title: "Learn", desc: "AI teaches concepts step-by-step, adapted to your child's level and curriculum." },
                  { icon: "🧠", title: "Recall", desc: "Student must explain it back — no moving on until they prove they understand." },
                  { icon: "⚡", title: "Challenge", desc: "Progressively harder questions build real mastery, not just recognition." },
                ].map((f, i) => (
                  <Card3D key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{f.icon}</span>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: t.text, marginBottom: 4 }}>{f.title}</h3>
                      <p style={{ fontSize: 13, color: t.muted, lineHeight: 1.6 }}>{f.desc}</p>
                    </div>
                  </Card3D>
                ))}
              </div>
            </div>
          )}

          {/* ════ SECTION 3: FAQ ════ */}
          {step === "form" && (
            <div style={{ padding: "48px 20px", maxWidth: 480, margin: "0 auto" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Common questions</h2>
              <p style={{ color: t.dim, fontSize: 13, marginBottom: 20 }}>Everything you need to know.</p>
              {faqs.map((f, i) => (
                <FaqItem key={i} q={f.q} a={f.a} open={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? null : i)} />
              ))}
            </div>
          )}

          {/* ── Tier indicator ── */}
          {step === "form" && stats && (
            <div style={{ textAlign: "center", padding: "0 20px 16px" }}>
              <p style={{ color: t.dim, fontSize: 11 }}>
                {stats.currentTier === 1
                  ? `First 100 members get 60% off — forever · ${stats.spotsLeft} spots left`
                  : stats.currentTier === 2 ? `Early members get 40% off — forever`
                  : "Join the waitlist"}
              </p>
            </div>
          )}

          {/* ── Footer ── */}
          <footer style={{ borderTop: `1px solid ${t.border}`, padding: "16px 20px", display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: t.dim }}>© 2026 Zorvai</span>
            <a href="/privacy" style={{ fontSize: 11, color: t.dim, textDecoration: "none" }}>Privacy</a>
            <span style={{ fontSize: 11, color: t.dim }}>hello@zorvai.ca</span>
          </footer>
        </div>
      </div>
    </>
  );
}
