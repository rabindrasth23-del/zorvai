"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

/* ─────────────────────────────────────────────────────────────────
   Zorvai Waitlist — Premium Single-Screen Design
   Reference: Countdown + Form + Social proof — all above fold
   ───────────────────────────────────────────────────────────────── */

// Launch date: 20 days from deployment (September 19, 2026)
const LAUNCH_DATE = new Date("2026-09-19T00:00:00+05:45");

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

/* ── Animated number component ── */
function AnimatedNumber({ value, label }: { value: number; label: string }) {
  const str = String(value).padStart(2, "0");
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
        {str.split("").map((digit, i) => (
          <span key={`${label}-${i}`} style={{
            display: "inline-block", fontSize: "clamp(48px,10vw,72px)", fontWeight: 700,
            lineHeight: 1, color: "#f0ede8", letterSpacing: "-0.02em",
            fontVariantNumeric: "tabular-nums",
            transition: "transform 0.4s cubic-bezier(.16,1,.3,1), opacity 0.3s",
          }}>{digit}</span>
        ))}
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4a4844", marginTop: 8, display: "block" }}>{label}</span>
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

  // Form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("NP");
  const [role, setRole] = useState<"parent" | "student">("parent");

  // Stats
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

  // Submit
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
      if (data.ok) { setSignup(data); setStep("success"); }
    } catch {} finally { setFormLoading(false); }
  };

  const handleCopy = () => {
    if (!signup) return;
    navigator.clipboard.writeText(`https://zorvai.ca/?ref=${signup.referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tierLabel = stats?.currentTier === 1
    ? `First ${100} members get 60% off — forever`
    : stats?.currentTier === 2 ? `Early members get 40% off — forever`
    : "Join the waitlist";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #0a0a09; overflow-x: hidden; }
        ::placeholder { color: #3a3835; }
        ::selection { background: rgba(78,205,196,0.2); }

        input:focus, select:focus {
          border-color: rgba(78,205,196,0.4) !important;
          box-shadow: 0 0 0 3px rgba(78,205,196,0.08) !important;
          outline: none;
        }

        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulseGlow { 0%,100% { box-shadow:0 0 0 0 rgba(78,205,196,0.3); } 50% { box-shadow:0 0 0 8px rgba(78,205,196,0); } }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes tickFlip {
          0% { transform: rotateX(0); }
          50% { transform: rotateX(-10deg); }
          100% { transform: rotateX(0); }
        }
        @keyframes dotPulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.3;transform:scale(0.7);} }
        @keyframes gradMove { 0%,100%{opacity:0.5;transform:translate(0,0)} 50%{opacity:0.8;transform:translate(30px,-20px)} }
        @keyframes scaleIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
        @keyframes confetti { 0%{opacity:1;transform:translateY(0) rotate(0)} 100%{opacity:0;transform:translateY(-60px) rotate(180deg)} }

        .btn-primary {
          width: 100%; padding: 16px; border-radius: 12px; border: none;
          background: #f0ede8; color: #0a0a09; font-weight: 600; font-size: 15px;
          cursor: pointer; font-family: 'Inter', sans-serif;
          position: relative; overflow: hidden;
          transition: all 200ms cubic-bezier(.4,0,.2,1);
        }
        .btn-primary:hover { background: #fff; transform: translateY(-1px); box-shadow: 0 4px 24px rgba(240,237,232,0.15); }
        .btn-primary:active { transform: translateY(0); }
        .btn-primary::after {
          content:''; position:absolute; inset:0;
          background: linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%);
          background-size: 200% 100%; animation: shimmer 2.5s infinite;
        }
        .btn-primary:disabled { opacity:0.5; cursor:not-allowed; transform:none; }

        .input-dark {
          width: 100%; background: #141312; border: 1px solid #1f1e1c;
          border-radius: 12px; padding: 14px 16px; color: #f0ede8;
          font-size: 15px; font-family: 'Inter', sans-serif;
          transition: all 200ms;
        }
        .input-dark:hover { border-color: #2a2826; }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
        @media (max-width: 480px) {
          .countdown-grid { gap: 12px !important; }
          .form-card { margin: 0 12px !important; padding: 24px 20px !important; }
        }
      `}</style>

      <div style={{
        minHeight: "100vh", background: "#0a0a09",
        fontFamily: "'Inter', system-ui, sans-serif", color: "#f0ede8",
        display: "flex", flexDirection: "column", position: "relative",
      }}>

        {/* ── Ambient glow ── */}
        <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
          <div style={{
            position:"absolute", width:700, height:700, borderRadius:"50%",
            background:"radial-gradient(circle, rgba(78,205,196,0.04) 0%, transparent 70%)",
            top:"-20%", right:"-15%", animation:"gradMove 8s ease-in-out infinite",
          }} />
          <div style={{
            position:"absolute", width:500, height:500, borderRadius:"50%",
            background:"radial-gradient(circle, rgba(251,191,36,0.02) 0%, transparent 70%)",
            bottom:"-10%", left:"-10%", animation:"gradMove 10s ease-in-out infinite reverse",
          }} />
        </div>

        {/* ── Grain ── */}
        <div style={{
          position:"fixed", inset:0, pointerEvents:"none", zIndex:1, opacity:0.025,
          backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }} />

        <div style={{ position:"relative", zIndex:2, flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 20px" }}>

          {/* ── Logo ── */}
          <div style={{ animation:"fadeUp 0.5s cubic-bezier(.16,1,.3,1) both", marginBottom: 32 }}>
            <Image src="/logo.png" alt="Zorvai" width={48} height={48} style={{ borderRadius: 12 }} />
          </div>

          {/* ── Pill ── */}
          <div style={{
            display:"inline-flex", alignItems:"center", gap:8,
            padding:"6px 18px", borderRadius:99, border:"1px solid #1f1e1c",
            background:"#141312", animation:"fadeUp 0.5s cubic-bezier(.16,1,.3,1) 0.05s both",
            marginBottom: 28,
          }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"#4ecdc4", animation:"pulseGlow 2s infinite" }} />
            <span style={{ fontSize:13, color:"#7a7672", fontWeight:500 }}>Get early access</span>
          </div>

          {/* ── Heading ── */}
          {step === "form" ? (
            <>
              <h1 style={{
                fontSize:"clamp(36px,7vw,60px)", fontWeight:800, textAlign:"center",
                lineHeight:1.05, letterSpacing:"-0.03em",
                animation:"fadeUp 0.6s cubic-bezier(.16,1,.3,1) 0.1s both",
                maxWidth: 600,
              }}>
                Your child deserves<br />
                <span style={{ color:"#4ecdc4" }}>a real tutor.</span>
              </h1>

              <p style={{
                marginTop:20, color:"#7a7672", fontSize:16, lineHeight:1.7,
                textAlign:"center", maxWidth:440, fontWeight:400,
                animation:"fadeUp 0.6s cubic-bezier(.16,1,.3,1) 0.15s both",
              }}>
                Zorvai is an AI that teaches like a one-to-one tutor — it checks
                real understanding before moving on. Not a chatbot. A real tutor.
              </p>

              {/* ── Money-back guarantee badge ── */}
              <div style={{
                marginTop:20, display:"inline-flex", alignItems:"center", gap:10,
                padding:"10px 22px", borderRadius:14,
                background:"rgba(78,205,196,0.06)", border:"1px solid rgba(78,205,196,0.15)",
                animation:"fadeUp 0.6s cubic-bezier(.16,1,.3,1) 0.18s both",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ecdc4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span style={{ fontSize:14, fontWeight:600, color:"#4ecdc4" }}>
                  Scores go up — or full refund. No questions.
                </span>
              </div>
            </>
          ) : (
            <>
              <h1 style={{
                fontSize:"clamp(32px,6vw,48px)", fontWeight:800, textAlign:"center",
                lineHeight:1.1, letterSpacing:"-0.03em",
                animation:"scaleIn 0.4s cubic-bezier(.16,1,.3,1) both",
              }}>
                You&apos;re in! 🎉
              </h1>
              <p style={{
                marginTop:16, color:"#7a7672", fontSize:16, textAlign:"center",
                animation:"fadeUp 0.4s cubic-bezier(.16,1,.3,1) 0.1s both",
              }}>
                Position <span style={{ color:"#4ecdc4", fontWeight:700 }}>#{signup?.position}</span> on the waitlist
              </p>
            </>
          )}

          {/* ── Countdown ── */}
          <div className="countdown-grid" style={{
            display:"flex", alignItems:"center", gap:20, marginTop:40,
            animation:"fadeUp 0.6s cubic-bezier(.16,1,.3,1) 0.2s both",
          }}>
            <AnimatedNumber value={countdown.days} label="Days" />
            <span style={{ fontSize:40, fontWeight:300, color:"#2a2826", marginTop:-20 }}>:</span>
            <AnimatedNumber value={countdown.hours} label="Hours" />
            <span style={{ fontSize:40, fontWeight:300, color:"#2a2826", marginTop:-20 }}>:</span>
            <AnimatedNumber value={countdown.mins} label="Min" />
            <span style={{ fontSize:40, fontWeight:300, color:"#2a2826", marginTop:-20 }}>:</span>
            <AnimatedNumber value={countdown.secs} label="Sec" />
          </div>

          {/* ── FORM ── */}
          {step === "form" && (
            <div className="form-card" style={{
              marginTop:44, width:"100%", maxWidth:440,
              animation:"fadeUp 0.6s cubic-bezier(.16,1,.3,1) 0.25s both",
            }}>
              <form onSubmit={handleJoin} style={{
                background:"#111110", border:"1px solid #1a1918", borderRadius:20,
                padding:"28px 28px 24px", display:"flex", flexDirection:"column", gap:12,
              }}>
                <input className="input-dark" type="text" placeholder="Your full name" required value={name} onChange={(e)=>setName(e.target.value)} />
                <input className="input-dark" type="email" placeholder="you@example.com" required value={email} onChange={(e)=>setEmail(e.target.value)} />

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <select className="input-dark" value={country} onChange={(e)=>setCountry(e.target.value)} style={{ appearance:"none" as const }}>
                    {COUNTRIES.map(c=><option key={c.code} value={c.code} style={{background:"#141312"}}>{c.name}</option>)}
                  </select>

                  {/* Parent / Student toggle */}
                  <div style={{ display:"flex", background:"#141312", borderRadius:12, border:"1px solid #1f1e1c", overflow:"hidden" }}>
                    {(["parent","student"] as const).map(r=>(
                      <button type="button" key={r} onClick={()=>setRole(r)} style={{
                        flex:1, padding:"12px 0", border:"none", cursor:"pointer",
                        fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:500,
                        transition:"all 200ms",
                        background: role===r ? "rgba(78,205,196,0.1)" : "transparent",
                        color: role===r ? "#4ecdc4" : "#4a4844",
                      }}>
                        {r === "parent" ? "👨‍👩‍👧 Parent" : "🎓 Student"}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn-primary" disabled={formLoading} style={{ marginTop:4 }}>
                  {formLoading ? "Joining..." : "Join the waitlist"}
                </button>
              </form>

              {/* Social proof */}
              <div style={{
                display:"flex", alignItems:"center", justifyContent:"center",
                gap:8, marginTop:16,
              }}>
                {/* Avatars */}
                <div style={{ display:"flex" }}>
                  {["#4ecdc4","#fbbf24","#a78bfa","#f87171"].map((c,i)=>(
                    <div key={i} style={{
                      width:24, height:24, borderRadius:"50%", background:c,
                      border:"2px solid #0a0a09", marginLeft: i>0 ? -8 : 0,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:10, fontWeight:700, color:"#0a0a09",
                    }}>
                      {["P","A","R","S"][i]}
                    </div>
                  ))}
                </div>
                <span style={{ color:"#4a4844", fontSize:13 }}>
                  Join <span style={{ color:"#7a7672", fontWeight:600 }}>{stats?.total || 0}</span> others
                </span>
              </div>
            </div>
          )}

          {/* ── SUCCESS STATE ── */}
          {step === "success" && signup && (
            <div style={{
              marginTop:40, width:"100%", maxWidth:440,
              animation:"scaleIn 0.5s cubic-bezier(.16,1,.3,1) 0.1s both",
            }}>
              {/* Tier reward card */}
              <div style={{
                background:"#111110", border:"1px solid #1a1918", borderRadius:20,
                padding:28, textAlign:"center",
              }}>
                {/* Discount badge */}
                <div style={{
                  display:"inline-flex", alignItems:"center", gap:8,
                  padding:"8px 20px", borderRadius:99,
                  background:"rgba(78,205,196,0.08)", border:"1px solid rgba(78,205,196,0.2)",
                  marginBottom:20,
                }}>
                  <span style={{ color:"#4ecdc4", fontSize:14, fontWeight:600 }}>
                    {signup.discountPercent > 0
                      ? `🎉 You locked ${signup.discountPercent}% off — forever`
                      : "You're on the waitlist!"}
                  </span>
                </div>

                <p style={{ color:"#7a7672", fontSize:14, lineHeight:1.7, marginBottom:20 }}>
                  {signup.tier === 1
                    ? `You're one of the first ${100} founding members. Pay now to lock your ${signup.discountPercent}% lifetime discount before it's gone.`
                    : signup.tier === 2
                    ? `Early member discount: ${signup.discountPercent}% off forever. Lock it in before spots fill.`
                    : "We'll notify you when we launch."}
                </p>

                {/* Tier progress */}
                {stats && stats.spotsLeft !== null && (
                  <div style={{ marginBottom:24 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ fontSize:12, color:"#4a4844" }}>Founding spots taken</span>
                      <span style={{ fontSize:12, color:"#4ecdc4", fontWeight:600 }}>
                        {stats.currentTier === 1 ? `${100 - (stats.spotsLeft || 0)}/100` : "Filled"}
                      </span>
                    </div>
                    <div style={{ height:4, background:"#1a1918", borderRadius:99, overflow:"hidden" }}>
                      <div style={{
                        height:"100%", borderRadius:99,
                        background:"linear-gradient(90deg, #4ecdc4, #3db8b0)",
                        width: stats.currentTier === 1 ? `${((100-(stats.spotsLeft||0))/100)*100}%` : "100%",
                        transition:"width 1s cubic-bezier(.16,1,.3,1)",
                      }} />
                    </div>
                  </div>
                )}

                {/* Share section */}
                <div style={{ borderTop:"1px solid #1a1918", paddingTop:20 }}>
                  <p style={{ fontSize:12, color:"#4a4844", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:12 }}>Share to jump the line</p>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>{
                      if(!signup) return;
                      const msg = encodeURIComponent(`I just joined the Zorvai waitlist — an AI tutor that actually checks understanding.\n\n${stats?.spotsLeft ? `${stats.spotsLeft} founding spots left at ${stats?.discountPercent}% off.` : ""}\n\nJoin: https://zorvai.ca/?ref=${signup.referralCode}`);
                      window.open(`https://wa.me/?text=${msg}`, "_blank");
                    }} style={{
                      flex:1, padding:"12px 0", borderRadius:12, border:"1px solid #1a1918",
                      background:"#141312", color:"#25d366", fontSize:13, fontWeight:600,
                      cursor:"pointer", fontFamily:"'Inter',sans-serif", transition:"all 200ms",
                    }}>WhatsApp</button>
                    <button onClick={handleCopy} style={{
                      flex:1, padding:"12px 0", borderRadius:12, border:"1px solid #1a1918",
                      background:"#141312", color: copied ? "#4ade80" : "#7a7672",
                      fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif",
                      transition:"all 200ms",
                    }}>{copied ? "Copied ✓" : "Copy link"}</button>
                  </div>
                  <p style={{ fontSize:11, color:"#3a3835", marginTop:10 }}>
                    1 referral = jump 50 spots · 3 = best tier forever
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Tier indicator (form state only) ── */}
          {step === "form" && tierLabel && (
            <p style={{
              marginTop:20, color:"#4a4844", fontSize:12, textAlign:"center",
              animation:"fadeUp 0.6s cubic-bezier(.16,1,.3,1) 0.35s both",
            }}>
              {tierLabel}
            </p>
          )}
        </div>

        {/* ── Footer ── */}
        <footer style={{
          position:"relative", zIndex:2,
          borderTop:"1px solid #141312", padding:"20px",
          display:"flex", justifyContent:"center", gap:20, flexWrap:"wrap",
        }}>
          <span style={{ fontSize:12, color:"#3a3835" }}>© 2026 Zorvai</span>
          <a href="/privacy" style={{ fontSize:12, color:"#3a3835", textDecoration:"none" }}>Privacy</a>
          <span style={{ fontSize:12, color:"#3a3835" }}>hello@zorvai.ca</span>
        </footer>
      </div>
    </>
  );
}
