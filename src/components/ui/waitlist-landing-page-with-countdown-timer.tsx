"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  QuadraticBezierCurve3,
  Vector3,
  TubeGeometry,
  ShaderMaterial,
  Mesh,
  AdditiveBlending,
  DoubleSide,
} from "three";

/* ═══════════════════════════════════════════════════════════════
   Zorvai Waitlist — Full Page
   Three.js beam + glassmorphism + FAQ + Live Feed + Commitment
   ═══════════════════════════════════════════════════════════════ */

const LAUNCH_DATE = new Date("2026-09-19T00:00:00+05:45");

interface Stats {
  total: number;
  lastHour: number;
  currentTier: number;
  spotsLeft: number | null;
  discountPercent: number;
  recentActivity?: { firstName: string; city: string | null; country: string; minutesAgo: number }[];
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

const SUBJECTS = ["Mathematics", "Science", "English", "Biology", "Chemistry", "Physics", "History", "Geography", "All subjects"];

const FAQS = [
  { q: "What age is Zorvai designed for?", a: "Zorvai works best for students in grades 6–12 (ages 11–18). It adapts to the student's curriculum, language, and exam board — whether that's CBSE, SSC, NEB, GCSE, or others." },
  { q: "How does the money-back guarantee work?", a: "Before your child starts, they take a short baseline quiz. After completing 12+ sessions in 30 days, they retake it. If scores haven't improved — full refund, no questions asked." },
  { q: "Is this just another chatbot?", a: "No. Chatbots answer questions. Zorvai teaches. It follows a Learn → Recall → Challenge loop — the student must explain concepts back before moving on." },
  { q: "What subjects does Zorvai cover?", a: "Mathematics, Science, English, Biology, Chemistry, Physics, History, and Geography. More subjects are being added based on waitlist feedback." },
  { q: "What languages does Zorvai support?", a: "Currently English, Hindi, Nepali, and Bengali. The tutor adapts to the student's preferred language." },
  { q: "When does Zorvai launch?", a: "We're targeting September 19, 2026. Founding members (first 100) get access first, 60% off for life, and help shape the product." },
  { q: "What is the referral program?", a: "Every referral moves you 50 spots up. Refer 3 families = guaranteed best tier. Refer 10 = Founding Member with special perks." },
  { q: "Can I get a refund before launch?", a: "If you pre-pay to lock your discount, you get a full refund anytime before launch — zero risk." },
];

/* ── Inline Input ── */
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input type={type} className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} ref={ref} {...props} />
  ),
);
Input.displayName = "Input";

/* ── Inline Button ── */
const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => (
    <button className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 ${className}`} ref={ref} {...props}>{children}</button>
  ),
);
Button.displayName = "Button";

/* ── Countdown hook ── */
function useCountdown(target: Date) {
  const calc = useCallback(() => {
    const diff = Math.max(0, target.getTime() - Date.now());
    return { days: Math.floor(diff / 86400000), hours: Math.floor((diff % 86400000) / 3600000), minutes: Math.floor((diff % 3600000) / 60000), seconds: Math.floor((diff % 60000) / 1000) };
  }, [target]);
  const [time, setTime] = useState(calc);
  useEffect(() => { const id = setInterval(() => setTime(calc()), 1000); return () => clearInterval(id); }, [calc]);
  return time;
}

/* ── Section wrapper with entrance animation ── */
function Section({ id, children, className = "" }: { id: string; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.unobserve(el); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <section id={id} ref={ref} className={`relative z-10 max-w-3xl mx-auto px-6 py-20 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}>
      {children}
    </section>
  );
}

/* ── FAQ Item ── */
function FaqItem({ q, a, open, onClick }: { q: string; a: string; open: boolean; onClick: () => void }) {
  return (
    <div className="backdrop-blur-lg bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden transition-all hover:border-white/20">
      <button onClick={onClick} className="w-full flex items-center justify-between p-4 text-left">
        <span className="text-sm font-medium text-white/80 pr-4">{q}</span>
        <span className={`text-white/40 text-lg transition-transform duration-300 flex-shrink-0 ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-48 opacity-100" : "max-h-0 opacity-0"}`}>
        <p className="px-4 pb-4 text-sm text-white/40 leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

export function WaitlistExperience() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const animationIdRef = useRef<number | null>(null);

  const [step, setStep] = useState<"form" | "commitment" | "success">("form");
  const [signup, setSignup] = useState<SignupData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeNav, setActiveNav] = useState("waitlist");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Live activity feed
  const [activityIndex, setActivityIndex] = useState(0);
  const [activityVisible, setActivityVisible] = useState(true);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("NP");
  const [role, setRole] = useState<"parent" | "student">("parent");
  const [referredBy, setReferredBy] = useState<string | null>(null);

  // Commitment fields
  const [commitSubject, setCommitSubject] = useState("Mathematics");
  const [commitGoal, setCommitGoal] = useState("");
  const [commitLoading, setCommitLoading] = useState(false);

  const timeLeft = useCountdown(LAUNCH_DATE);

  useEffect(() => { const p = new URLSearchParams(window.location.search); if (p.get("ref")) setReferredBy(p.get("ref")); }, []);

  useEffect(() => {
    const fetchStats = async () => { try { setStats(await (await fetch("/api/waitlist/stats")).json()); } catch {} };
    fetchStats(); const id = setInterval(fetchStats, 30000); return () => clearInterval(id);
  }, []);

  // Live activity rotation
  useEffect(() => {
    if (!stats?.recentActivity?.length) return;
    const id = setInterval(() => {
      setActivityVisible(false);
      setTimeout(() => { setActivityIndex(i => (i + 1) % (stats.recentActivity?.length || 1)); setActivityVisible(true); }, 300);
    }, 5000);
    return () => clearInterval(id);
  }, [stats?.recentActivity]);

  // Scroll spy
  useEffect(() => {
    const sections = ["features", "pricing", "waitlist", "launch", "faq", "updates"];
    const observer = new IntersectionObserver((entries) => { entries.forEach((entry) => { if (entry.isIntersecting) setActiveNav(entry.target.id); }); }, { threshold: 0.3 });
    sections.forEach((id) => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  // Three.js beam
  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new Scene(); sceneRef.current = scene;
    const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new WebGLRenderer({ antialias: true, alpha: true }); rendererRef.current = renderer;
    renderer.setSize(window.innerWidth, window.innerHeight); renderer.setClearColor(0x000000, 1);
    mountRef.current.appendChild(renderer.domElement);

    const curve = new QuadraticBezierCurve3(new Vector3(-15, -4, 0), new Vector3(2, 3, 0), new Vector3(18, 0.8, 0));
    const tubeGeometry = new TubeGeometry(curve, 200, 0.8, 32, false);
    const vertexShader = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
    const fragmentShader = `uniform float time; varying vec2 vUv; void main() { vec3 c1=vec3(1.0,0.2,0.1); vec3 c2=vec3(0.8,0.1,0.6); vec3 c3=vec3(0.4,0.05,0.8); vec3 fc=mix(c1,c2,vUv.x); fc=mix(fc,c3,vUv.x*0.7); float g=pow(1.0-abs(vUv.y-0.5)*2.0,2.0); float f=vUv.x>0.85?1.0-smoothstep(0.85,1.0,vUv.x):1.0; float p=sin(time*2.0)*0.1+0.9; gl_FragColor=vec4(fc*g*p*f,g*f*0.8); }`;
    const material = new ShaderMaterial({ vertexShader, fragmentShader, uniforms: { time: { value: 0 } }, transparent: true, blending: AdditiveBlending, side: DoubleSide });
    const lightStreak = new Mesh(tubeGeometry, material); scene.add(lightStreak);

    const glowGeometry = new TubeGeometry(curve, 200, 1.5, 32, false);
    const glowMaterial = new ShaderMaterial({ vertexShader, fragmentShader: `uniform float time; varying vec2 vUv; void main() { vec3 fc=mix(vec3(1.0,0.3,0.2),vec3(0.6,0.2,0.8),vUv.x); float g=pow(1.0-abs(vUv.y-0.5)*2.0,4.0); float f=vUv.x>0.85?1.0-smoothstep(0.85,1.0,vUv.x):1.0; gl_FragColor=vec4(fc*g*(sin(time*1.5)*0.05+0.95)*f,g*f*0.3); }`, uniforms: { time: { value: 0 } }, transparent: true, blending: AdditiveBlending, side: DoubleSide });
    const glowLayer = new Mesh(glowGeometry, glowMaterial); scene.add(glowLayer);

    camera.position.z = 7; camera.position.y = -0.8;
    const animate = () => { animationIdRef.current = requestAnimationFrame(animate); const t = Date.now() * 0.001; material.uniforms.time.value = t; glowMaterial.uniforms.time.value = t; lightStreak.rotation.z = Math.sin(t * 0.2) * 0.05; glowLayer.rotation.z = Math.sin(t * 0.2) * 0.05; renderer.render(scene, camera); };
    animate();
    const handleResize = () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); };
    window.addEventListener("resize", handleResize);
    return () => { window.removeEventListener("resize", handleResize); if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current); if (mountRef.current && renderer.domElement) mountRef.current.removeChild(renderer.domElement); renderer.dispose(); tubeGeometry.dispose(); glowGeometry.dispose(); material.dispose(); glowMaterial.dispose(); };
  }, []);

  // Handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setFormLoading(true);
    try {
      const res = await fetch("/api/waitlist/join", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, countryCode: country, role, referredBy }) });
      const data = await res.json();
      if (data.ok) { setSignup(data); setStep("commitment"); }
    } catch {} finally { setFormLoading(false); }
  };

  const handleCommitment = async () => {
    if (!commitGoal.trim()) return;
    setCommitLoading(true);
    try {
      await fetch("/api/waitlist/commitment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, commitmentText: `I commit to helping ${signup?.childName || "my child"} master ${commitSubject}`, commitmentGoal: commitGoal }) });
    } catch {} finally { setCommitLoading(false); setStep("success"); }
  };

  const handleCopy = () => { if (!signup) return; navigator.clipboard.writeText(`https://zorvai.ca/?ref=${signup.referralCode}`); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const navItems = [
    { id: "features", label: "Features" }, { id: "pricing", label: "Pricing" },
    { id: "waitlist", label: "Waitlist" }, { id: "launch", label: "Launch" },
    { id: "faq", label: "FAQ" }, { id: "updates", label: "Updates" },
  ];
  const scrollTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); };

  const activity = stats?.recentActivity?.[activityIndex];

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black w-full">
      {/* Three.js Background */}
      <div ref={mountRef} className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }} />

      {/* ═══ STICKY NAV ═══ */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-full px-3 py-2">
          <div className="flex items-center gap-2">
            <button onClick={() => scrollTo("waitlist")} className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-white/5 transition-all group">
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/20 group-hover:border-white/40 transition-all shadow-[0_0_10px_rgba(78,205,196,0.2)]">
                <img src="/zorvai-logo.png" alt="Zorvai" className="w-full h-full object-cover" />
              </div>
              <span className="text-white font-semibold text-sm tracking-tight hidden sm:block">Zorvai</span>
            </button>
            <div className="w-px h-5 bg-white/10 mx-1" />
            {navItems.map((item) => {
              const isWaitlist = item.id === "waitlist";
              const isActive = activeNav === item.id;
              return (
                <button key={item.id} onClick={() => scrollTo(item.id)} className={`text-sm px-3 py-1.5 rounded-full transition-all duration-200 ${isWaitlist ? isActive ? "bg-red-600 text-white border border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.4)]" : "bg-red-600/80 text-white border border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.25)] hover:shadow-[0_0_14px_rgba(239,68,68,0.4)] animate-pulse" : isActive ? "bg-white/10 text-white border border-white/20" : "text-white/50 hover:text-white/80"}`}>
                  {isWaitlist ? "⚡ Waitlist" : item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ LIVE ACTIVITY TOAST ═══ */}
      {activity && (
        <div className={`fixed bottom-6 left-6 z-40 transition-all duration-300 ${activityVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
          <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 shadow-2xl max-w-[320px]">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
            <span className="text-white/60 text-xs">
              <span className="text-white/90 font-medium">{activity.firstName}</span> from {activity.city || activity.country} joined {activity.minutesAgo}m ago
            </span>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
           SECTION 1: FEATURES
           ═══════════════════════════════════════════════════════ */}
      <Section id="features" className="pt-28">
        <div className="text-center mb-12">
          <p className="text-red-400 text-xs font-semibold uppercase tracking-[0.2em] mb-3 animate-pulse">Core Principles</p>
          <h2 className="text-3xl md:text-4xl font-light text-white tracking-wide mb-4">How Zorvai actually teaches</h2>
          <p className="text-white/50 text-base max-w-md mx-auto leading-relaxed">Not a chatbot. Not a video library. A tutor that checks real understanding — or gives your money back.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: "📖", title: "Learn", desc: "AI teaches concepts step-by-step, adapted to your child's grade, curriculum (CBSE, NEB, SSC, GCSE), and language.", tag: "Step 1" },
            { icon: "🧠", title: "Recall", desc: "The student must explain it back in their own words. No moving on until they prove they understand — not just read.", tag: "Step 2" },
            { icon: "⚡", title: "Challenge", desc: "Progressively harder questions build real mastery. Scores go up because understanding went up first.", tag: "Step 3" },
          ].map((f, i) => (
            <div key={i} className="backdrop-blur-lg bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:border-white/20 hover:bg-white/[0.05] transition-all duration-300 group hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(239,68,68,0.05)]">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{f.icon}</span>
                <span className="text-[10px] text-red-400/70 font-semibold uppercase tracking-widest">{f.tag}</span>
              </div>
              <h3 className="text-lg font-medium text-white mb-2 group-hover:text-red-300 transition-colors">{f.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {[
            { icon: "🎙️", title: "Voice-First Tutoring", desc: "Students speak their answers. The AI listens, evaluates, and responds like a real tutor — in English, Hindi, Nepali, or Bengali." },
            { icon: "🛡️", title: "Money-Back Guarantee", desc: "Take a baseline quiz before starting. After 12+ sessions in 30 days, retake it. If scores haven't improved — full refund." },
          ].map((f, i) => (
            <div key={i} className="backdrop-blur-lg bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:border-white/20 hover:bg-white/[0.05] transition-all duration-300 hover:scale-[1.02]">
              <span className="text-2xl mb-3 block">{f.icon}</span>
              <h3 className="text-base font-medium text-white mb-2">{f.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════
           SECTION 2: PRICING
           ═══════════════════════════════════════════════════════ */}
      <Section id="pricing">
        <div className="text-center mb-12">
          <p className="text-red-400 text-xs font-semibold uppercase tracking-[0.2em] mb-3">Early Access Pricing</p>
          <h2 className="text-3xl md:text-4xl font-light text-white tracking-wide mb-4">The earlier you join, the more you save</h2>
          <p className="text-white/50 text-base max-w-lg mx-auto">Locked forever. No price increases. Your tier is permanent.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="relative backdrop-blur-lg bg-white/[0.04] border-2 border-red-500/30 rounded-2xl p-6 overflow-hidden hover:border-red-500/50 transition-all hover:shadow-[0_0_40px_rgba(239,68,68,0.1)]">
            <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl">Best Deal</div>
            <p className="text-red-400/70 text-xs font-semibold uppercase tracking-widest mb-1">Founding Member</p>
            <p className="text-white/40 text-xs mb-4">First 100 members</p>
            <div className="flex items-baseline gap-1 mb-1"><span className="text-white/30 text-lg line-through">$29</span><span className="text-4xl font-bold text-white">$12</span><span className="text-white/40 text-sm">/mo</span></div>
            <p className="text-red-400 text-xs font-semibold mb-4">60% off — forever</p>
            <ul className="space-y-2 text-sm text-white/50 mb-5">
              {["Unlimited AI tutoring", "Voice + text", "All subjects", "Money-back guarantee", "Founding badge forever"].map(f => <li key={f} className="flex items-center gap-2"><span className="text-green-400">✓</span>{f}</li>)}
            </ul>
            <p className="text-[10px] text-white/20">{stats?.spotsLeft ?? "~"} spots remaining</p>
          </div>
          <div className="backdrop-blur-lg bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">Early Member</p>
            <p className="text-white/40 text-xs mb-4">Members 101–500</p>
            <div className="flex items-baseline gap-1 mb-1"><span className="text-white/30 text-lg line-through">$29</span><span className="text-4xl font-bold text-white">$17</span><span className="text-white/40 text-sm">/mo</span></div>
            <p className="text-white/50 text-xs font-semibold mb-4">40% off — forever</p>
            <ul className="space-y-2 text-sm text-white/50 mb-5">
              {["Unlimited AI tutoring", "Voice + text", "All subjects", "Money-back guarantee"].map(f => <li key={f} className="flex items-center gap-2"><span className="text-green-400">✓</span>{f}</li>)}
            </ul>
          </div>
          <div className="backdrop-blur-lg bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">Regular</p>
            <p className="text-white/40 text-xs mb-4">After launch</p>
            <div className="flex items-baseline gap-1 mb-1"><span className="text-4xl font-bold text-white">$29</span><span className="text-white/40 text-sm">/mo</span></div>
            <p className="text-white/30 text-xs font-semibold mb-4">Full price</p>
            <ul className="space-y-2 text-sm text-white/50 mb-5">
              {["Unlimited AI tutoring", "Voice + text", "All subjects", "Money-back guarantee"].map(f => <li key={f} className="flex items-center gap-2"><span className="text-green-400">✓</span>{f}</li>)}
            </ul>
          </div>
        </div>
        <div className="mt-6 backdrop-blur-lg bg-white/[0.02] border border-white/10 rounded-xl p-4 text-center">
          <p className="text-white/40 text-sm"><span className="text-white/60 font-medium">Family plans at launch:</span> $49/mo for up to 3 children · $399/year family annual (save 32%)</p>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════
           SECTION 3: WAITLIST — Main Card
           ═══════════════════════════════════════════════════════ */}
      <Section id="waitlist">
        <div className="flex items-center justify-center">
          <div className="relative">
            <div className="relative backdrop-blur-xl bg-black/60 border border-white/20 rounded-3xl p-8 w-full max-w-[420px] shadow-2xl">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              <div className="relative z-10">

                {/* ─── FORM STEP ─── */}
                {step === "form" && (
                  <>
                    <div className="mb-6 text-center">
                      <h2 className="text-4xl font-light text-white mb-4 tracking-wide">Join the waitlist</h2>
                      <p className="text-white/70 text-base leading-relaxed">Get early access to Zorvai — the AI tutor<br />that checks real understanding before moving on</p>
                    </div>
                    <form onSubmit={handleSubmit} className="mb-5 space-y-3">
                      <Input type="text" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} required className="bg-black/40 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 h-12 rounded-xl backdrop-blur-sm" />
                      <div className="flex gap-3">
                        <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="flex-1 bg-black/40 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 h-12 rounded-xl backdrop-blur-sm" />
                        <Button type="submit" disabled={formLoading} className="h-12 px-6 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25 disabled:opacity-50">
                          {formLoading ? "..." : "Join Waitlist"}
                        </Button>
                      </div>
                      <div className="flex gap-3">
                        <select value={country} onChange={(e) => setCountry(e.target.value)} className="flex-1 h-10 rounded-xl border border-white/20 bg-black/40 backdrop-blur-sm px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none cursor-pointer">
                          {COUNTRIES.map(c => <option key={c.code} value={c.code} className="bg-black text-white">{c.name}</option>)}
                        </select>
                        <div className="flex rounded-xl border border-white/20 overflow-hidden">
                          {(["parent", "student"] as const).map(r => (
                            <button type="button" key={r} onClick={() => setRole(r)} className={`px-3 text-xs font-medium transition-all ${role === r ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}>{r === "parent" ? "Parent" : "Student"}</button>
                          ))}
                        </div>
                      </div>
                    </form>
                    <div className="flex items-center justify-center gap-3 mb-5">
                      <div className="flex -space-x-2">
                        {[{ bg: "from-blue-400 to-blue-600", l: "P" }, { bg: "from-green-400 to-green-600", l: "A" }, { bg: "from-purple-400 to-purple-600", l: "R" }].map((a, i) => (
                          <div key={i} className={`w-8 h-8 rounded-full bg-gradient-to-br ${a.bg} border-2 border-white/20 flex items-center justify-center text-white text-xs font-medium`}>{a.l}</div>
                        ))}
                      </div>
                      <span className="text-white/70 text-sm">{stats && stats.total > 0 ? `~${stats.total}+ families joined` : "~2k+ families joined"}</span>
                    </div>
                    <div className="text-center mb-5 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
                      <p className="text-white/50 text-xs">🎉 <span className="text-red-400 font-semibold">First 100 members</span> get <span className="text-white font-bold">60% off forever</span> — only <span className="text-white font-bold">$12/mo</span></p>
                    </div>
                    <div className="flex items-center justify-center gap-6 text-center">
                      {[{ v: timeLeft.days, l: "days" }, { v: timeLeft.hours, l: "hours" }, { v: timeLeft.minutes, l: "min" }, { v: timeLeft.seconds, l: "sec" }].map((t, i) => (
                        <React.Fragment key={t.l}>{i > 0 && <div className="text-white/20">|</div>}<div><div className="text-2xl font-light text-white tabular-nums">{String(t.v).padStart(2, "0")}</div><div className="text-[10px] text-white/40 uppercase tracking-widest">{t.l}</div></div></React.Fragment>
                      ))}
                    </div>
                  </>
                )}

                {/* ─── COMMITMENT STEP ─── */}
                {step === "commitment" && signup && (
                  <div className="text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-r from-red-500/20 to-purple-500/20 flex items-center justify-center border border-white/20">
                      <span className="text-2xl">🎯</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Make your commitment real</h3>
                    <p className="text-white/50 text-sm mb-5">Parents who set a specific goal see better outcomes. Write yours.</p>

                    <div className="space-y-3 text-left">
                      <div>
                        <label className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-1 block">Subject they struggle with</label>
                        <select value={commitSubject} onChange={(e) => setCommitSubject(e.target.value)} className="w-full h-10 rounded-xl border border-white/20 bg-black/40 backdrop-blur-sm px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none cursor-pointer">
                          {SUBJECTS.map(s => <option key={s} value={s} className="bg-black text-white">{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-1 block">Specific goal</label>
                        <Input type="text" placeholder="Pass SEE exam / Score above 80% / Improve from C to A" value={commitGoal} onChange={(e) => setCommitGoal(e.target.value)} className="bg-black/40 border-white/20 text-white placeholder:text-white/30 focus:border-white/40 focus:ring-white/20 h-12 rounded-xl backdrop-blur-sm" />
                      </div>
                    </div>

                    {/* Live preview */}
                    {commitGoal && (
                      <div className="mt-4 bg-white/[0.03] border border-white/10 rounded-xl p-4">
                        <p className="text-white/70 text-sm italic leading-relaxed">&ldquo;I commit to helping {signup.childName || "my child"} master {commitSubject} — {commitGoal}&rdquo;</p>
                      </div>
                    )}

                    <button onClick={handleCommitment} disabled={commitLoading || !commitGoal.trim()} className="w-full mt-4 h-12 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25 disabled:opacity-50 text-sm">
                      {commitLoading ? "Saving..." : "Save & continue →"}
                    </button>
                    <button onClick={() => setStep("success")} className="text-[11px] text-white/20 hover:text-white/40 transition-colors mt-2 block mx-auto">Skip for now</button>
                  </div>
                )}

                {/* ─── SUCCESS STEP ─── */}
                {step === "success" && signup && (
                  <div className="text-center py-2">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-400/30 to-emerald-500/30 flex items-center justify-center border border-green-400/40 animate-pulse">
                      <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-1">{signup.alreadyJoined ? "Welcome back! 👋" : "You're on the list! 🎉"}</h3>
                    <p className="text-white/70 text-sm mb-3">Position <span className="text-white font-bold">#{signup.position}</span> · {signup.discountPercent > 0 ? `${signup.discountPercent}% off forever` : "We'll notify you at launch"}</p>
                    <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2 mb-4">
                      <span className="text-xs text-white/40">Code:</span>
                      <span className="text-sm font-bold text-white tracking-widest font-mono">{signup.referralCode}</span>
                    </div>
                    {signup.discountPercent > 0 && (
                      <div className="mb-4">
                        <div className="flex items-baseline justify-center gap-2 mb-3"><span className="text-sm text-white/30 line-through">$29/mo</span><span className="text-3xl font-bold text-white">${Math.round(29 * (1 - signup.discountPercent / 100))}</span><span className="text-sm text-white/30">/mo forever</span></div>
                        <Button onClick={async () => { try { const r = await fetch("/api/waitlist/payment/intent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, planId: "student_solo_monthly" }) }); const d = await r.json(); if (d.checkoutUrl) window.location.href = d.checkoutUrl; else alert("Payment setup coming soon!"); } catch { alert("Payment setup coming soon!"); } }} className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl mb-2">💳 Lock ${Math.round(29 * (1 - signup.discountPercent / 100))}/mo forever</Button>
                        <button className="text-[11px] text-white/20 hover:text-white/40 transition-colors">Maybe later</button>
                      </div>
                    )}
                    {/* Referral milestones */}
                    <div className="border-t border-white/10 pt-4">
                      <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-3">Share = jump 50 spots</p>
                      <div className="flex gap-2 mb-3">
                        <button onClick={() => { const m = encodeURIComponent(`I joined the Zorvai waitlist!\nJoin: https://zorvai.ca/?ref=${signup.referralCode}`); window.open(`https://wa.me/?text=${m}`, "_blank"); }} className="flex-1 h-10 rounded-xl bg-white/5 border border-white/10 text-[#25d366] text-xs font-semibold hover:bg-white/10 transition-colors">WhatsApp</button>
                        <button onClick={handleCopy} className={`flex-1 h-10 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold transition-colors ${copied ? "text-green-400" : "text-white/50 hover:bg-white/10"}`}>{copied ? "Copied ✓" : "Copy link"}</button>
                      </div>
                      <div className="space-y-1.5 text-left">
                        {[{ n: 1, t: "referral → jump 50 spots" }, { n: 3, t: "referrals → best tier guaranteed" }, { n: 10, t: "referrals → Founding Member" }].map(m => (
                          <div key={m.n} className="flex items-center gap-2 text-xs"><span className="text-white/20">🔒</span><span className="text-white/30"><strong className="text-white/40">{m.n}</strong> {m.t}</span></div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-transparent via-white/[0.02] to-white/[0.05] pointer-events-none" />
            </div>
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-red-500/10 to-purple-600/10 blur-xl scale-110 -z-10 animate-pulse" />
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════
           SECTION 4: LAUNCH
           ═══════════════════════════════════════════════════════ */}
      <Section id="launch">
        <div className="text-center mb-12">
          <p className="text-red-400 text-xs font-semibold uppercase tracking-[0.2em] mb-3">Launch Day</p>
          <h2 className="text-3xl md:text-4xl font-light text-white tracking-wide mb-4">Launching in {timeLeft.days} days</h2>
          <p className="text-white/50 text-base max-w-md mx-auto">September 19, 2026 — here&apos;s the plan.</p>
        </div>
        <div className="space-y-4">
          {[
            { day: "Now", title: "Join the Waitlist", desc: "Reserve your spot. First 100 get founding member pricing (60% off forever).", active: true },
            { day: "Day 1–10", title: "Early Access Invites", desc: "Top waitlist members get beta access. Test the tutor, give feedback, shape the product." },
            { day: "Day 10–18", title: "Onboarding & Baseline", desc: "Your child takes a baseline quiz — the benchmark for the money-back guarantee." },
            { day: "Day 19", title: "Final Pre-Launch Check", desc: "All founding members confirmed. Discounts locked. Payment links sent." },
            { day: "Sept 19", title: "🚀 Public Launch", desc: "Zorvai goes live. Regular pricing ($29/mo) starts. Your founding discount is permanent." },
          ].map((item, i) => (
            <div key={i} className={`flex gap-4 backdrop-blur-lg border rounded-2xl p-5 transition-all duration-300 hover:scale-[1.01] ${item.active ? "bg-red-500/[0.06] border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.05)]" : "bg-white/[0.02] border-white/10 hover:border-white/20"}`}>
              <div className={`text-xs font-bold uppercase tracking-widest whitespace-nowrap pt-0.5 ${item.active ? "text-red-400" : "text-white/30"}`}>{item.day}</div>
              <div>
                <h3 className={`text-sm font-medium mb-1 ${item.active ? "text-white" : "text-white/70"}`}>{item.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════
           SECTION 5: FAQ
           ═══════════════════════════════════════════════════════ */}
      <Section id="faq">
        <div className="text-center mb-10">
          <p className="text-red-400 text-xs font-semibold uppercase tracking-[0.2em] mb-3">Questions & Answers</p>
          <h2 className="text-3xl md:text-4xl font-light text-white tracking-wide mb-4">Frequently asked</h2>
        </div>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <FaqItem key={i} q={faq.q} a={faq.a} open={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? null : i)} />
          ))}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════
           SECTION 6: UPDATES
           ═══════════════════════════════════════════════════════ */}
      <Section id="updates">
        <div className="text-center mb-12">
          <p className="text-red-400 text-xs font-semibold uppercase tracking-[0.2em] mb-3">Updates & Feedback</p>
          <h2 className="text-3xl md:text-4xl font-light text-white tracking-wide mb-4">Building in public</h2>
          <p className="text-white/50 text-base max-w-md mx-auto">We update this page as we ship. Your feedback shapes what we build next.</p>
        </div>
        <div className="space-y-3 mb-10">
          {[
            { date: "Aug 30", title: "Waitlist page v5 — FAQ, commitment, live feed", tag: "shipped" },
            { date: "Aug 28", title: "Voice tutoring engine v2 — improved recall detection", tag: "shipped" },
            { date: "Aug 25", title: "Multi-language support — EN, HI, NE, BN", tag: "shipped" },
            { date: "Coming", title: "Parent dashboard — progress, mastery, summaries", tag: "next" },
            { date: "Coming", title: "Study plan generator — weekly AI plans", tag: "next" },
          ].map((u, i) => (
            <div key={i} className="flex gap-4 backdrop-blur-lg bg-white/[0.02] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all duration-300 hover:scale-[1.01]">
              <div className="text-xs text-white/30 font-medium whitespace-nowrap pt-0.5 min-w-[55px]">{u.date}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-medium text-white/80">{u.title}</h3>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${u.tag === "shipped" ? "bg-green-500/10 text-green-400/80" : "bg-white/5 text-white/30"}`}>{u.tag}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Feedback */}
        <div className="backdrop-blur-lg bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-center">
          <h3 className="text-lg font-medium text-white mb-2">Have feedback or ideas?</h3>
          <p className="text-white/40 text-sm mb-4">We read every message. Tell us what you want Zorvai to do.</p>
          {!feedbackOpen ? (
            <button onClick={() => setFeedbackOpen(true)} className="h-11 px-8 bg-white/5 border border-white/15 text-white/70 hover:text-white hover:bg-white/10 rounded-xl text-sm font-medium transition-all">💬 Give Feedback</button>
          ) : feedbackSent ? (
            <div className="text-green-400 text-sm py-2">✓ Sent! We&apos;ll read it today.</div>
          ) : (
            <div className="space-y-3 max-w-sm mx-auto">
              <textarea value={feedbackMsg} onChange={(e) => setFeedbackMsg(e.target.value)} placeholder="What would make Zorvai perfect for your child?" rows={3} className="w-full rounded-xl border border-white/20 bg-black/40 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none" />
              <div className="flex gap-2">
                <button onClick={() => { if (feedbackMsg.trim()) { window.open(`mailto:zorvai246@gmail.com?subject=Waitlist Feedback&body=${encodeURIComponent(feedbackMsg)}`, "_blank"); setFeedbackSent(true); } }} className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-all">Send</button>
                <button onClick={() => setFeedbackOpen(false)} className="h-10 px-4 bg-white/5 border border-white/10 text-white/40 rounded-xl text-sm hover:text-white/60 transition-colors">Cancel</button>
              </div>
            </div>
          )}
          <p className="text-white/20 text-[10px] mt-4">Or email: <a href="mailto:zorvai246@gmail.com" className="text-white/40 hover:text-white/60 underline">zorvai246@gmail.com</a></p>
        </div>
      </Section>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-6 text-center">
        <p className="text-white/20 text-xs mb-1">© 2026 Zorvai</p>
        <p className="text-white/15 text-[10px]">
          <a href="/privacy" className="hover:text-white/30 transition-colors">Privacy</a>{" · "}<a href="mailto:zorvai246@gmail.com" className="hover:text-white/30 transition-colors">zorvai246@gmail.com</a>
        </p>
      </footer>
    </main>
  );
}
