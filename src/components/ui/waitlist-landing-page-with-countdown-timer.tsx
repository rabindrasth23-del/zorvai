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
   Zorvai Waitlist — Three.js Beam + Glassmorphism Card
   Adapted from 21st.dev component for Zorvai's backend
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
  { code: "NP", name: "🇳🇵 Nepal" }, { code: "IN", name: "🇮🇳 India" },
  { code: "BD", name: "🇧🇩 Bangladesh" }, { code: "GB", name: "🇬🇧 UK" },
  { code: "US", name: "🇺🇸 US" }, { code: "CA", name: "🇨🇦 Canada" },
  { code: "AU", name: "🇦🇺 Australia" }, { code: "AE", name: "🇦🇪 UAE" },
  { code: "SG", name: "🇸🇬 Singapore" }, { code: "XX", name: "Other" },
];

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

export function WaitlistExperience() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const animationIdRef = useRef<number | null>(null);

  const [step, setStep] = useState<"form" | "success">("form");
  const [signup, setSignup] = useState<SignupData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("NP");
  const [role, setRole] = useState<"parent" | "student">("parent");
  const [referredBy, setReferredBy] = useState<string | null>(null);

  const timeLeft = useCountdown(LAUNCH_DATE);

  // Get referral from URL
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("ref")) setReferredBy(p.get("ref"));
  }, []);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try { setStats(await (await fetch("/api/waitlist/stats")).json()); } catch {}
    };
    fetchStats();
    const id = setInterval(fetchStats, 30000);
    return () => clearInterval(id);
  }, []);

  // Three.js beam effect
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new Scene();
    const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // Curved beam — teal/cyan to deep blue (Zorvai palette)
    const curve = new QuadraticBezierCurve3(
      new Vector3(-15, -4, 0),
      new Vector3(2, 3, 0),
      new Vector3(18, 0.8, 0),
    );

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    // Main beam — teal gradient
    const fragmentShader = `
      uniform float time;
      varying vec2 vUv;
      void main() {
        vec3 color1 = vec3(0.306, 0.804, 0.769); // #4ecdc4 teal
        vec3 color2 = vec3(0.106, 0.310, 0.361); // #1B4F5C deep indigo-teal
        vec3 color3 = vec3(0.2, 0.6, 0.55);      // mid teal
        vec3 finalColor = mix(color1, color3, vUv.x);
        finalColor = mix(finalColor, color2, vUv.x * 0.7);
        float glow = 1.0 - abs(vUv.y - 0.5) * 2.0;
        glow = pow(glow, 2.0);
        float fade = 1.0;
        if (vUv.x > 0.85) fade = 1.0 - smoothstep(0.85, 1.0, vUv.x);
        float pulse = sin(time * 2.0) * 0.1 + 0.9;
        gl_FragColor = vec4(finalColor * glow * pulse * fade, glow * fade * 0.8);
      }
    `;

    const material = new ShaderMaterial({
      vertexShader, fragmentShader,
      uniforms: { time: { value: 0 } },
      transparent: true, blending: AdditiveBlending, side: DoubleSide,
    });

    const tubeGeometry = new TubeGeometry(curve, 200, 0.8, 32, false);
    const lightStreak = new Mesh(tubeGeometry, material);
    scene.add(lightStreak);

    // Glow layer
    const glowGeometry = new TubeGeometry(curve, 200, 1.5, 32, false);
    const glowMaterial = new ShaderMaterial({
      vertexShader,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        void main() {
          vec3 color1 = vec3(0.306, 0.804, 0.769);
          vec3 color2 = vec3(0.2, 0.5, 0.6);
          vec3 finalColor = mix(color1, color2, vUv.x);
          float glow = 1.0 - abs(vUv.y - 0.5) * 2.0;
          glow = pow(glow, 4.0);
          float fade = 1.0;
          if (vUv.x > 0.85) fade = 1.0 - smoothstep(0.85, 1.0, vUv.x);
          float pulse = sin(time * 1.5) * 0.05 + 0.95;
          gl_FragColor = vec4(finalColor * glow * pulse * fade, glow * fade * 0.3);
        }
      `,
      uniforms: { time: { value: 0 } },
      transparent: true, blending: AdditiveBlending, side: DoubleSide,
    });
    const glowLayer = new Mesh(glowGeometry, glowMaterial);
    scene.add(glowLayer);

    camera.position.z = 7;
    camera.position.y = -0.8;

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      const time = Date.now() * 0.001;
      material.uniforms.time.value = time;
      glowMaterial.uniforms.time.value = time;
      lightStreak.rotation.z = Math.sin(time * 0.2) * 0.05;
      glowLayer.rotation.z = Math.sin(time * 0.2) * 0.05;
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
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      tubeGeometry.dispose();
      glowGeometry.dispose();
      material.dispose();
      glowMaterial.dispose();
    };
  }, []);

  // Join handler
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

  const inputCls = "flex h-11 w-full rounded-xl border border-white/15 bg-black/40 backdrop-blur-sm px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#4ecdc4]/30 focus:border-[#4ecdc4]/50 transition-all";

  const selectCls = "flex h-11 w-full rounded-xl border border-white/15 bg-black/40 backdrop-blur-sm px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#4ecdc4]/30 appearance-none cursor-pointer";

  return (
    <main className="relative min-h-screen overflow-hidden bg-black w-full">
      {/* Three.js Background */}
      <div ref={mountRef} className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }} />

      {/* Content Layer */}
      <div className="relative z-10 min-h-screen">

        {/* Top Nav — Zorvai branding */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-5 py-2.5 flex items-center gap-3">
            <span className="text-white font-bold text-sm tracking-tight">Zorvai</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ecdc4]" />
            <span className="text-white/40 text-xs">AI Tutor for Students</span>
          </div>
        </div>

        {/* Card Container */}
        <div className="flex items-center justify-center min-h-screen px-4 py-20">
          <div className="relative w-full max-w-[460px]">

            {/* Glass Card */}
            <div className="relative backdrop-blur-xl bg-black/60 border border-white/20 rounded-3xl p-8 shadow-2xl">
              {/* Glass overlay */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

              <div className="relative z-10">

                {step === "form" ? (
                  <>
                    {/* Header */}
                    <div className="mb-6 text-center">
                      <h1 className="text-3xl font-light text-white mb-3 tracking-wide">
                        Join the waitlist
                      </h1>
                      <p className="text-white/60 text-sm leading-relaxed max-w-xs mx-auto">
                        Your child is studying — but probably not learning.
                        Zorvai teaches like a real tutor, or your money back.
                      </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-3 mb-6">
                      <input
                        type="text"
                        placeholder="Your full name"
                        className={inputCls}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                      />
                      <input
                        type="email"
                        placeholder="you@example.com"
                        className={inputCls}
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <select
                          className={selectCls}
                          value={country}
                          onChange={e => setCountry(e.target.value)}
                        >
                          {COUNTRIES.map(c => (
                            <option key={c.code} value={c.code} className="bg-black text-white">{c.name}</option>
                          ))}
                        </select>

                        {/* Parent / Student Toggle */}
                        <div className="flex rounded-xl border border-white/15 overflow-hidden">
                          {(["parent", "student"] as const).map(r => (
                            <button
                              type="button" key={r}
                              onClick={() => setRole(r)}
                              className={`flex-1 text-xs font-medium py-2.5 transition-all ${
                                role === r
                                  ? "bg-[#4ecdc4]/15 text-[#4ecdc4] border-[#4ecdc4]/30"
                                  : "text-white/40 hover:text-white/60"
                              }`}
                            >
                              {r === "parent" ? "👨‍👩‍👧 Parent" : "🎓 Student"}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={formLoading}
                        className="w-full h-12 rounded-xl bg-[#4ecdc4] hover:bg-[#3db8b0] text-black font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-[#4ecdc4]/25 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                      >
                        {formLoading ? "Joining..." : "Join the waitlist →"}
                      </button>
                    </form>

                    {/* Social Proof */}
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <div className="flex -space-x-2">
                        {[
                          { bg: "from-[#4ecdc4] to-[#3db8b0]", letter: "P" },
                          { bg: "from-amber-400 to-amber-600", letter: "A" },
                          { bg: "from-purple-400 to-purple-600", letter: "R" },
                          { bg: "from-rose-400 to-rose-600", letter: "S" },
                        ].map((a, i) => (
                          <div key={i} className={`w-7 h-7 rounded-full bg-gradient-to-br ${a.bg} border-2 border-black/40 flex items-center justify-center text-white text-[10px] font-bold`}>
                            {a.letter}
                          </div>
                        ))}
                      </div>
                      <span className="text-white/50 text-sm">
                        {stats && stats.total > 0 ? `${stats.total}+ already joined` : "Be the first to join"}
                      </span>
                    </div>

                    {/* Countdown */}
                    <div className="flex items-center justify-center gap-5 text-center">
                      {[
                        { val: timeLeft.days, label: "days" },
                        { val: timeLeft.hours, label: "hours" },
                        { val: timeLeft.minutes, label: "min" },
                        { val: timeLeft.seconds, label: "sec" },
                      ].map((t, i) => (
                        <React.Fragment key={t.label}>
                          {i > 0 && <div className="text-white/20 text-lg">|</div>}
                          <div>
                            <div className="text-2xl font-light text-white tabular-nums">{String(t.val).padStart(2, "0")}</div>
                            <div className="text-[10px] text-white/40 uppercase tracking-widest">{t.label}</div>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Guarantee */}
                    <div className="mt-5 flex items-center justify-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ecdc4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      <span className="text-[11px] text-white/40">Scores improve — or full refund. No questions.</span>
                    </div>
                  </>
                ) : signup ? (
                  <>
                    {/* SUCCESS STATE */}
                    <div className="text-center">
                      {/* Badge */}
                      <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-r from-[#4ecdc4]/20 to-[#3db8b0]/20 flex items-center justify-center border border-[#4ecdc4]/30">
                        <svg className="w-7 h-7 text-[#4ecdc4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>

                      <h3 className="text-xl font-semibold text-white mb-1">
                        {signup.alreadyJoined ? "Welcome back! 👋" : "You're in! 🎉"}
                      </h3>
                      <p className="text-white/60 text-sm mb-1">
                        {signup.alreadyJoined
                          ? `Already on the waitlist · Position #${signup.position}`
                          : `Position #${signup.position} on the waitlist`}
                      </p>

                      {/* Referral code */}
                      <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 mb-4">
                        <span className="text-[10px] text-white/40">Code:</span>
                        <span className="text-sm font-bold text-white tracking-wide font-mono">{signup.referralCode}</span>
                      </div>

                      {/* Pricing */}
                      {signup.discountPercent > 0 && (
                        <div className="mb-4">
                          <div className="flex items-baseline justify-center gap-2 mb-3">
                            <span className="text-sm text-white/30 line-through">$29/mo</span>
                            <span className="text-3xl font-bold text-white">${Math.round(29 * (1 - signup.discountPercent / 100))}</span>
                            <span className="text-sm text-white/30">/mo forever</span>
                          </div>

                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch("/api/waitlist/payment/intent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, planId: "student_solo_monthly" }) });
                                const data = await res.json();
                                if (data.checkoutUrl) window.location.href = data.checkoutUrl;
                                else alert("Payment setup coming soon! Your discount is locked.");
                              } catch { alert("Payment setup coming soon! Your discount is locked."); }
                            }}
                            className="w-full h-11 rounded-xl bg-[#4ecdc4] hover:bg-[#3db8b0] text-black font-semibold text-sm transition-all hover:shadow-lg hover:shadow-[#4ecdc4]/25"
                          >
                            💳 Pay now — lock ${Math.round(29 * (1 - signup.discountPercent / 100))}/mo forever
                          </button>

                          <div className="flex items-center justify-center gap-1.5 mt-2">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ecdc4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                            <span className="text-[10px] text-white/30">100% refund if scores don&apos;t improve</span>
                          </div>

                          <button className="text-[11px] text-white/20 hover:text-white/40 mt-2 transition-colors">
                            Maybe later — keep my spot
                          </button>
                        </div>
                      )}

                      {/* Share */}
                      <div className="border-t border-white/10 pt-4">
                        <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-3">Share to jump the line</p>
                        <div className="flex gap-2">
                          <button onClick={() => {
                            const msg = encodeURIComponent(`I joined the Zorvai waitlist — an AI tutor that checks real understanding.\n\nJoin: https://zorvai.ca/?ref=${signup.referralCode}`);
                            window.open(`https://wa.me/9779763575615?text=${msg}`, "_blank");
                          }} className="flex-1 h-10 rounded-xl bg-white/5 border border-white/10 text-[#25d366] text-xs font-semibold hover:bg-white/10 transition-colors">
                            WhatsApp
                          </button>
                          <button onClick={handleCopy} className={`flex-1 h-10 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold transition-colors ${copied ? "text-green-400 border-green-400/30" : "text-white/50 hover:bg-white/10"}`}>
                            {copied ? "Copied ✓" : "Copy link"}
                          </button>
                        </div>
                        <p className="text-[10px] text-white/20 mt-2">1 referral = jump 50 spots · 3 = best tier forever</p>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>

              {/* Top glass shine */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-transparent via-white/[0.02] to-white/[0.05] pointer-events-none" />
            </div>

            {/* Outer glow */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#4ecdc4]/10 to-[#1B4F5C]/10 blur-xl scale-110 -z-10" />
          </div>
        </div>
      </div>
    </main>
  );
}
