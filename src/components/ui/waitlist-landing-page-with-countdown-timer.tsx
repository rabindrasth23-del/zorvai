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
   Zorvai Waitlist — Full Page with Sections
   Same 21st.dev beam + glassmorphism aesthetic
   Sections: Features | Pricing | Waitlist | Launch | Updates
   ═══════════════════════════════════════════════════════════════ */

const LAUNCH_DATE = new Date("2026-09-19T00:00:00+05:45");

interface Stats {
  total: number;
  lastHour: number;
  currentTier: number;
  spotsLeft: number | null;
  discountPercent: number;
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

/* ── Inline Input ── */
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";

/* ── Inline Button ── */
const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 ${className}`}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  ),
);
Button.displayName = "Button";

/* ── Countdown hook ── */
function useCountdown(target: Date) {
  const calc = useCallback(() => {
    const diff = Math.max(0, target.getTime() - Date.now());
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  }, [target]);
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);
  return time;
}

/* ── Section wrapper ── */
function Section({ id, children, className = "" }: { id: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={`relative z-10 max-w-3xl mx-auto px-6 py-20 ${className}`}>
      {children}
    </section>
  );
}

export function WaitlistExperience() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const animationIdRef = useRef<number | null>(null);

  const [step, setStep] = useState<"form" | "success">("form");
  const [signup, setSignup] = useState<SignupData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeNav, setActiveNav] = useState("waitlist");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("NP");
  const [role, setRole] = useState<"parent" | "student">("parent");
  const [referredBy, setReferredBy] = useState<string | null>(null);

  const timeLeft = useCountdown(LAUNCH_DATE);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("ref")) setReferredBy(p.get("ref"));
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try { setStats(await (await fetch("/api/waitlist/stats")).json()); } catch {}
    };
    fetchStats();
    const id = setInterval(fetchStats, 30000);
    return () => clearInterval(id);
  }, []);

  // Scroll spy for nav highlight
  useEffect(() => {
    const sections = ["features", "pricing", "waitlist", "launch", "updates"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveNav(entry.target.id);
        });
      },
      { threshold: 0.4 },
    );
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Three.js beam — EXACT original colors (red/orange → purple)
  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new Scene();
    sceneRef.current = scene;
    const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);
    mountRef.current.appendChild(renderer.domElement);

    const curve = new QuadraticBezierCurve3(new Vector3(-15, -4, 0), new Vector3(2, 3, 0), new Vector3(18, 0.8, 0));
    const tubeGeometry = new TubeGeometry(curve, 200, 0.8, 32, false);

    const vertexShader = `
      varying vec2 vUv;
      varying vec3 vPosition;
      void main() { vUv = uv; vPosition = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `;
    const fragmentShader = `
      uniform float time;
      varying vec2 vUv;
      void main() {
        vec3 c1 = vec3(1.0, 0.2, 0.1); vec3 c2 = vec3(0.8, 0.1, 0.6); vec3 c3 = vec3(0.4, 0.05, 0.8);
        vec3 fc = mix(c1, c2, vUv.x); fc = mix(fc, c3, vUv.x * 0.7);
        float g = pow(1.0 - abs(vUv.y - 0.5) * 2.0, 2.0);
        float f = vUv.x > 0.85 ? 1.0 - smoothstep(0.85, 1.0, vUv.x) : 1.0;
        float p = sin(time * 2.0) * 0.1 + 0.9;
        gl_FragColor = vec4(fc * g * p * f, g * f * 0.8);
      }
    `;
    const material = new ShaderMaterial({ vertexShader, fragmentShader, uniforms: { time: { value: 0 } }, transparent: true, blending: AdditiveBlending, side: DoubleSide });
    const lightStreak = new Mesh(tubeGeometry, material);
    scene.add(lightStreak);

    const glowGeometry = new TubeGeometry(curve, 200, 1.5, 32, false);
    const glowMaterial = new ShaderMaterial({
      vertexShader,
      fragmentShader: `
        uniform float time; varying vec2 vUv;
        void main() {
          vec3 fc = mix(vec3(1.0,0.3,0.2), vec3(0.6,0.2,0.8), vUv.x);
          float g = pow(1.0 - abs(vUv.y - 0.5) * 2.0, 4.0);
          float f = vUv.x > 0.85 ? 1.0 - smoothstep(0.85, 1.0, vUv.x) : 1.0;
          gl_FragColor = vec4(fc * g * (sin(time*1.5)*0.05+0.95) * f, g * f * 0.3);
        }
      `,
      uniforms: { time: { value: 0 } }, transparent: true, blending: AdditiveBlending, side: DoubleSide,
    });
    const glowLayer = new Mesh(glowGeometry, glowMaterial);
    scene.add(glowLayer);

    camera.position.z = 7;
    camera.position.y = -0.8;

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      const t = Date.now() * 0.001;
      material.uniforms.time.value = t;
      glowMaterial.uniforms.time.value = t;
      lightStreak.rotation.z = Math.sin(t * 0.2) * 0.05;
      glowLayer.rotation.z = Math.sin(t * 0.2) * 0.05;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      if (mountRef.current && renderer.domElement) mountRef.current.removeChild(renderer.domElement);
      renderer.dispose(); tubeGeometry.dispose(); glowGeometry.dispose(); material.dispose(); glowMaterial.dispose();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
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

  const navItems = [
    { id: "features", label: "Features" },
    { id: "pricing", label: "Pricing" },
    { id: "waitlist", label: "Waitlist" },
    { id: "launch", label: "Launch" },
    { id: "updates", label: "Updates" },
  ];

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black w-full">
      {/* Three.js Background */}
      <div ref={mountRef} className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }} />

      {/* ════ STICKY NAV ════ */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-full px-5 py-2.5">
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`text-sm px-3 py-1.5 rounded-full transition-all duration-200 ${
                  activeNav === item.id
                    ? "bg-white/10 text-white border border-white/20"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
           SECTION 1: FEATURES — Core Principles
           ════════════════════════════════════════════════════════════ */}
      <Section id="features" className="pt-28">
        <div className="text-center mb-12">
          <p className="text-red-400 text-xs font-semibold uppercase tracking-[0.2em] mb-3">Core Principles</p>
          <h2 className="text-3xl md:text-4xl font-light text-white tracking-wide mb-4">
            How Zorvai actually teaches
          </h2>
          <p className="text-white/50 text-base max-w-md mx-auto leading-relaxed">
            Not a chatbot. Not a video library. A tutor that checks real understanding — or gives your money back.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              icon: "📖", title: "Learn",
              desc: "AI teaches concepts step-by-step, adapted to your child's grade, curriculum (CBSE, NEB, SSC, GCSE), and language.",
              tag: "Step 1",
            },
            {
              icon: "🧠", title: "Recall",
              desc: "The student must explain it back in their own words. No moving on until they prove they understand — not just read.",
              tag: "Step 2",
            },
            {
              icon: "⚡", title: "Challenge",
              desc: "Progressively harder questions build real mastery. Scores go up because understanding went up first.",
              tag: "Step 3",
            },
          ].map((f, i) => (
            <div key={i} className="backdrop-blur-lg bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all group">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{f.icon}</span>
                <span className="text-[10px] text-red-400/70 font-semibold uppercase tracking-widest">{f.tag}</span>
              </div>
              <h3 className="text-lg font-medium text-white mb-2 group-hover:text-red-300 transition-colors">{f.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Extra features row */}
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {[
            { icon: "🎙️", title: "Voice-First Tutoring", desc: "Students speak their answers. The AI listens, evaluates, and responds like a real tutor — in English, Hindi, Nepali, or Bengali." },
            { icon: "🛡️", title: "Money-Back Guarantee", desc: "Take a baseline quiz before starting. After 12+ sessions in 30 days, retake it. If scores haven't improved — full refund, no questions." },
          ].map((f, i) => (
            <div key={i} className="backdrop-blur-lg bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
              <span className="text-2xl mb-3 block">{f.icon}</span>
              <h3 className="text-base font-medium text-white mb-2">{f.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ════════════════════════════════════════════════════════════
           SECTION 2: PRICING — Tiered Model
           ════════════════════════════════════════════════════════════ */}
      <Section id="pricing">
        <div className="text-center mb-12">
          <p className="text-red-400 text-xs font-semibold uppercase tracking-[0.2em] mb-3">Early Access Pricing</p>
          <h2 className="text-3xl md:text-4xl font-light text-white tracking-wide mb-4">
            The earlier you join, the more you save
          </h2>
          <p className="text-white/50 text-base max-w-lg mx-auto">
            Locked forever. No price increases. No bait-and-switch. Your tier is permanent.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Tier 1 — Founding */}
          <div className="relative backdrop-blur-lg bg-white/[0.04] border-2 border-red-500/30 rounded-2xl p-6 overflow-hidden">
            <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl">
              Best Deal
            </div>
            <p className="text-red-400/70 text-xs font-semibold uppercase tracking-widest mb-1">Founding Member</p>
            <p className="text-white/40 text-xs mb-4">First 100 members</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-white/30 text-lg line-through">$29</span>
              <span className="text-4xl font-bold text-white">$12</span>
              <span className="text-white/40 text-sm">/mo</span>
            </div>
            <p className="text-red-400 text-xs font-semibold mb-4">60% off — forever</p>
            <ul className="space-y-2 text-sm text-white/50 mb-5">
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Unlimited AI tutoring sessions</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Voice + text interactions</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> All subjects, all curriculums</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Money-back guarantee</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Founding Member badge forever</li>
            </ul>
            <p className="text-[10px] text-white/20">{stats?.spotsLeft ?? "~"} spots remaining</p>
          </div>

          {/* Tier 2 — Early */}
          <div className="backdrop-blur-lg bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">Early Member</p>
            <p className="text-white/40 text-xs mb-4">Members 101–500</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-white/30 text-lg line-through">$29</span>
              <span className="text-4xl font-bold text-white">$17</span>
              <span className="text-white/40 text-sm">/mo</span>
            </div>
            <p className="text-white/50 text-xs font-semibold mb-4">40% off — forever</p>
            <ul className="space-y-2 text-sm text-white/50 mb-5">
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Unlimited AI tutoring sessions</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Voice + text interactions</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> All subjects, all curriculums</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Money-back guarantee</li>
            </ul>
          </div>

          {/* Regular */}
          <div className="backdrop-blur-lg bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">Regular</p>
            <p className="text-white/40 text-xs mb-4">After launch</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-bold text-white">$29</span>
              <span className="text-white/40 text-sm">/mo</span>
            </div>
            <p className="text-white/30 text-xs font-semibold mb-4">Full price</p>
            <ul className="space-y-2 text-sm text-white/50 mb-5">
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Unlimited AI tutoring sessions</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Voice + text interactions</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> All subjects, all curriculums</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Money-back guarantee</li>
            </ul>
          </div>
        </div>

        {/* Family plans note */}
        <div className="mt-6 backdrop-blur-lg bg-white/[0.02] border border-white/10 rounded-xl p-4 text-center">
          <p className="text-white/40 text-sm">
            <span className="text-white/60 font-medium">Family plans available at launch:</span> $49/mo for up to 3 children (Solo plan × 1.7x) · $399/year family annual (save 32%)
          </p>
        </div>
      </Section>

      {/* ════════════════════════════════════════════════════════════
           SECTION 3: WAITLIST — Main Card (same design)
           ════════════════════════════════════════════════════════════ */}
      <Section id="waitlist">
        <div className="flex items-center justify-center">
          <div className="relative">
            <div className="relative backdrop-blur-xl bg-black/60 border border-white/20 rounded-3xl p-8 w-full max-w-[420px] shadow-2xl">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

              <div className="relative z-10">
                {step === "form" ? (
                  <>
                    <div className="mb-6 text-center">
                      <h2 className="text-4xl font-light text-white mb-4 tracking-wide">Join the waitlist</h2>
                      <p className="text-white/70 text-base leading-relaxed">
                        Get early access to Zorvai — the AI tutor<br />
                        that checks real understanding before moving on
                      </p>
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
                            <button type="button" key={r} onClick={() => setRole(r)} className={`px-3 text-xs font-medium transition-all ${role === r ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}>
                              {r === "parent" ? "Parent" : "Student"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </form>

                    {/* Social proof */}
                    <div className="flex items-center justify-center gap-3 mb-5">
                      <div className="flex -space-x-2">
                        {[{ bg: "from-blue-400 to-blue-600", l: "P" }, { bg: "from-green-400 to-green-600", l: "A" }, { bg: "from-purple-400 to-purple-600", l: "R" }].map((a, i) => (
                          <div key={i} className={`w-8 h-8 rounded-full bg-gradient-to-br ${a.bg} border-2 border-white/20 flex items-center justify-center text-white text-xs font-medium`}>{a.l}</div>
                        ))}
                      </div>
                      <span className="text-white/70 text-sm">
                        {stats && stats.total > 0 ? `~${stats.total}+ families joined` : "~2k+ families joined"}
                      </span>
                    </div>

                    {/* Discount reminder */}
                    <div className="text-center mb-5 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
                      <p className="text-white/50 text-xs">
                        🎉 <span className="text-red-400 font-semibold">First 100 members</span> get <span className="text-white font-bold">60% off forever</span> — only <span className="text-white font-bold">${12}/mo</span> instead of $29
                      </p>
                      {stats?.spotsLeft != null && stats.currentTier === 1 && (
                        <p className="text-red-400/60 text-[10px] mt-1 font-medium">{stats.spotsLeft} founding spots remaining</p>
                      )}
                    </div>

                    {/* Countdown */}
                    <div className="flex items-center justify-center gap-6 text-center">
                      {[
                        { v: timeLeft.days, l: "days" }, { v: timeLeft.hours, l: "hours" },
                        { v: timeLeft.minutes, l: "min" }, { v: timeLeft.seconds, l: "sec" },
                      ].map((t, i) => (
                        <React.Fragment key={t.l}>
                          {i > 0 && <div className="text-white/20">|</div>}
                          <div>
                            <div className="text-2xl font-light text-white tabular-nums">{String(t.v).padStart(2, "0")}</div>
                            <div className="text-[10px] text-white/40 uppercase tracking-widest">{t.l}</div>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </>
                ) : signup ? (
                  /* ═══ SUCCESS ═══ */
                  <div className="text-center py-2">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-400/30 to-emerald-500/30 flex items-center justify-center border border-green-400/40">
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
                        <div className="flex items-baseline justify-center gap-2 mb-3">
                          <span className="text-sm text-white/30 line-through">$29/mo</span>
                          <span className="text-3xl font-bold text-white">${Math.round(29 * (1 - signup.discountPercent / 100))}</span>
                          <span className="text-sm text-white/30">/mo forever</span>
                        </div>
                        <Button onClick={async () => { try { const r = await fetch("/api/waitlist/payment/intent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, planId: "student_solo_monthly" }) }); const d = await r.json(); if (d.checkoutUrl) window.location.href = d.checkoutUrl; else alert("Payment setup coming soon!"); } catch { alert("Payment setup coming soon!"); } }} className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl mb-2">
                          💳 Lock ${Math.round(29 * (1 - signup.discountPercent / 100))}/mo forever
                        </Button>
                        <button className="text-[11px] text-white/20 hover:text-white/40 transition-colors">Maybe later</button>
                      </div>
                    )}
                    <div className="border-t border-white/10 pt-4">
                      <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-3">Share = jump 50 spots</p>
                      <div className="flex gap-2">
                        <button onClick={() => { const m = encodeURIComponent(`I joined the Zorvai waitlist!\nJoin: https://zorvai.ca/?ref=${signup.referralCode}`); window.open(`https://wa.me/9779763575615?text=${m}`, "_blank"); }} className="flex-1 h-10 rounded-xl bg-white/5 border border-white/10 text-[#25d366] text-xs font-semibold hover:bg-white/10 transition-colors">WhatsApp</button>
                        <button onClick={handleCopy} className={`flex-1 h-10 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold transition-colors ${copied ? "text-green-400" : "text-white/50 hover:bg-white/10"}`}>{copied ? "Copied ✓" : "Copy link"}</button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-transparent via-white/[0.02] to-white/[0.05] pointer-events-none" />
            </div>
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-red-500/10 to-purple-600/10 blur-xl scale-110 -z-10" />
          </div>
        </div>
      </Section>

      {/* ════════════════════════════════════════════════════════════
           SECTION 4: LAUNCH — What happens in 20 days
           ════════════════════════════════════════════════════════════ */}
      <Section id="launch">
        <div className="text-center mb-12">
          <p className="text-red-400 text-xs font-semibold uppercase tracking-[0.2em] mb-3">Launch Day</p>
          <h2 className="text-3xl md:text-4xl font-light text-white tracking-wide mb-4">
            Launching in {timeLeft.days} days
          </h2>
          <p className="text-white/50 text-base max-w-md mx-auto">September 19, 2026 — here&apos;s the plan.</p>
        </div>

        <div className="space-y-4">
          {[
            { day: "Now", title: "Join the Waitlist", desc: "Reserve your spot. First 100 get founding member pricing (60% off forever).", active: true },
            { day: "Day 1–10", title: "Early Access Invites", desc: "Top waitlist members get access to the beta. Test the tutor, give feedback, shape the product." },
            { day: "Day 10–18", title: "Onboarding & Baseline", desc: "Your child takes a short baseline quiz. This becomes the benchmark for the money-back guarantee." },
            { day: "Day 19", title: "Final Pre-Launch Check", desc: "All founding members confirmed. Discounts locked. Payment links sent to confirmed members." },
            { day: "Sept 19", title: "🚀 Public Launch", desc: "Zorvai goes live. Regular pricing ($29/mo) starts. Your founding discount is permanent." },
          ].map((item, i) => (
            <div key={i} className={`flex gap-4 backdrop-blur-lg border rounded-2xl p-5 transition-all ${item.active ? "bg-red-500/[0.06] border-red-500/20" : "bg-white/[0.02] border-white/10 hover:border-white/20"}`}>
              <div className={`text-xs font-bold uppercase tracking-widest whitespace-nowrap pt-0.5 ${item.active ? "text-red-400" : "text-white/30"}`}>{item.day}</div>
              <div>
                <h3 className={`text-sm font-medium mb-1 ${item.active ? "text-white" : "text-white/70"}`}>{item.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ════════════════════════════════════════════════════════════
           SECTION 5: UPDATES — Changelog + Feedback
           ════════════════════════════════════════════════════════════ */}
      <Section id="updates">
        <div className="text-center mb-12">
          <p className="text-red-400 text-xs font-semibold uppercase tracking-[0.2em] mb-3">Updates & Feedback</p>
          <h2 className="text-3xl md:text-4xl font-light text-white tracking-wide mb-4">
            Building in public
          </h2>
          <p className="text-white/50 text-base max-w-md mx-auto">
            We update this page as we ship. Your feedback shapes what we build next.
          </p>
        </div>

        {/* Updates timeline */}
        <div className="space-y-3 mb-10">
          {[
            { date: "Aug 30", title: "Waitlist page goes live", desc: "Three.js beam design, Stripe payments, referral system, tiered pricing.", tag: "shipped" },
            { date: "Aug 28", title: "Voice tutoring engine v2", desc: "Improved recall detection. Student must explain concepts back before moving on.", tag: "shipped" },
            { date: "Aug 25", title: "Multi-language support", desc: "English, Hindi, Nepali, Bengali — the tutor adapts to the student's preferred language.", tag: "shipped" },
            { date: "Coming", title: "Parent dashboard", desc: "See your child's progress, mastery levels, and session summaries.", tag: "next" },
            { date: "Coming", title: "Study plan generator", desc: "AI builds a weekly study plan based on your child's curriculum and weak areas.", tag: "next" },
          ].map((u, i) => (
            <div key={i} className="flex gap-4 backdrop-blur-lg bg-white/[0.02] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all">
              <div className="text-xs text-white/30 font-medium whitespace-nowrap pt-0.5 min-w-[55px]">{u.date}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-medium text-white/80">{u.title}</h3>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${u.tag === "shipped" ? "bg-green-500/10 text-green-400/80" : "bg-white/5 text-white/30"}`}>{u.tag}</span>
                </div>
                <p className="text-white/40 text-xs leading-relaxed">{u.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Feedback Section */}
        <div className="backdrop-blur-lg bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-center">
          <h3 className="text-lg font-medium text-white mb-2">Have feedback or ideas?</h3>
          <p className="text-white/40 text-sm mb-4">We read every message. Tell us what you want Zorvai to do.</p>

          {!feedbackOpen ? (
            <button
              onClick={() => setFeedbackOpen(true)}
              className="h-11 px-8 bg-white/5 border border-white/15 text-white/70 hover:text-white hover:bg-white/10 rounded-xl text-sm font-medium transition-all"
            >
              💬 Give Feedback
            </button>
          ) : feedbackSent ? (
            <div className="text-green-400 text-sm py-2">
              ✓ Sent! We&apos;ll read it today. Thank you.
            </div>
          ) : (
            <div className="space-y-3 max-w-sm mx-auto">
              <textarea
                value={feedbackMsg}
                onChange={(e) => setFeedbackMsg(e.target.value)}
                placeholder="What would make Zorvai perfect for your child?"
                rows={3}
                className="w-full rounded-xl border border-white/20 bg-black/40 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (feedbackMsg.trim()) {
                      // Send feedback via mailto
                      window.open(`mailto:zorvai246@gmail.com?subject=Waitlist Feedback&body=${encodeURIComponent(feedbackMsg)}`, "_blank");
                      setFeedbackSent(true);
                    }
                  }}
                  className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-all"
                >
                  Send Feedback
                </button>
                <button onClick={() => setFeedbackOpen(false)} className="h-10 px-4 bg-white/5 border border-white/10 text-white/40 rounded-xl text-sm hover:text-white/60 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          <p className="text-white/20 text-[10px] mt-4">
            Or email us directly: <a href="mailto:zorvai246@gmail.com" className="text-white/40 hover:text-white/60 underline transition-colors">zorvai246@gmail.com</a>
          </p>
        </div>
      </Section>

      {/* ════ FOOTER ════ */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-6 text-center">
        <p className="text-white/20 text-xs mb-1">© 2026 Zorvai · Built in Nepal 🇳🇵</p>
        <p className="text-white/15 text-[10px]">
          <a href="/privacy" className="hover:text-white/30 transition-colors">Privacy</a>
          {" · "}
          <a href="mailto:zorvai246@gmail.com" className="hover:text-white/30 transition-colors">zorvai246@gmail.com</a>
        </p>
      </footer>
    </main>
  );
}
