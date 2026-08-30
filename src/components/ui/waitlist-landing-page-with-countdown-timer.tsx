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
   Zorvai Waitlist — Same design as 21st.dev reference
   Only change: Zorvai branding + Zorvai backend form flow
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
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

/* ── Inline Button ── */
const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 ${className}`}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  },
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

  // Three.js background — EXACT same beam as original (red/orange → purple)
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

    const curve = new QuadraticBezierCurve3(
      new Vector3(-15, -4, 0),
      new Vector3(2, 3, 0),
      new Vector3(18, 0.8, 0),
    );

    const tubeGeometry = new TubeGeometry(curve, 200, 0.8, 32, false);

    const vertexShader = `
      varying vec2 vUv;
      varying vec3 vPosition;
      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float time;
      varying vec2 vUv;
      varying vec3 vPosition;
      void main() {
        vec3 color1 = vec3(1.0, 0.2, 0.1);
        vec3 color2 = vec3(0.8, 0.1, 0.6);
        vec3 color3 = vec3(0.4, 0.05, 0.8);
        vec3 finalColor = mix(color1, color2, vUv.x);
        finalColor = mix(finalColor, color3, vUv.x * 0.7);
        float glow = 1.0 - abs(vUv.y - 0.5) * 2.0;
        glow = pow(glow, 2.0);
        float fade = 1.0;
        if (vUv.x > 0.85) {
          fade = 1.0 - smoothstep(0.85, 1.0, vUv.x);
        }
        float pulse = sin(time * 2.0) * 0.1 + 0.9;
        gl_FragColor = vec4(finalColor * glow * pulse * fade, glow * fade * 0.8);
      }
    `;

    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: { time: { value: 0 } },
      transparent: true,
      blending: AdditiveBlending,
      side: DoubleSide,
    });

    const lightStreak = new Mesh(tubeGeometry, material);
    scene.add(lightStreak);

    const glowGeometry = new TubeGeometry(curve, 200, 1.5, 32, false);
    const glowMaterial = new ShaderMaterial({
      vertexShader,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
          vec3 color1 = vec3(1.0, 0.3, 0.2);
          vec3 color2 = vec3(0.6, 0.2, 0.8);
          vec3 finalColor = mix(color1, color2, vUv.x);
          float glow = 1.0 - abs(vUv.y - 0.5) * 2.0;
          glow = pow(glow, 4.0);
          float fade = 1.0;
          if (vUv.x > 0.85) {
            fade = 1.0 - smoothstep(0.85, 1.0, vUv.x);
          }
          float pulse = sin(time * 1.5) * 0.05 + 0.95;
          gl_FragColor = vec4(finalColor * glow * pulse * fade, glow * fade * 0.3);
        }
      `,
      uniforms: { time: { value: 0 } },
      transparent: true,
      blending: AdditiveBlending,
      side: DoubleSide,
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
      if (!camera || !renderer) return;
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

  const navItems = ["Features", "Pricing", "Waitlist", "Launch", "Updates"];

  return (
    <main className="relative min-h-screen overflow-hidden bg-black w-full">
      {/* Three.js Background */}
      <div ref={mountRef} className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }} />

      {/* Content Layer */}
      <div className="relative z-10 min-h-screen">

        {/* Top Navigation — Same pill nav, Zorvai branding */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-6 py-3">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                {navItems.map((feature, index) => (
                  <button
                    key={feature}
                    className={`text-sm px-3 py-1 rounded-full transition-colors ${
                      index === 2
                        ? "bg-black/60 text-white border border-white/20"
                        : "text-white/60 hover:text-white/80"
                    }`}
                  >
                    {feature}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Waitlist Card — Same glassmorphism, Zorvai form */}
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="relative">
            <div className="relative backdrop-blur-xl bg-black/60 border border-white/20 rounded-3xl p-8 w-[420px] shadow-2xl">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

              <div className="relative z-10">
                {step === "form" ? (
                  <>
                    <div className="mb-6 text-center">
                      <h1 className="text-4xl font-light text-white mb-4 tracking-wide">Join the waitlist</h1>
                      <p className="text-white/70 text-base leading-relaxed">
                        Get early access to Zorvai — the AI tutor<br />
                        that checks real understanding before moving on
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mb-5 space-y-3">
                      {/* Name */}
                      <Input
                        type="text"
                        placeholder="Your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="bg-black/40 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 h-12 rounded-xl backdrop-blur-sm"
                      />

                      {/* Email */}
                      <div className="flex gap-3">
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="flex-1 bg-black/40 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 h-12 rounded-xl backdrop-blur-sm"
                        />
                        <Button
                          type="submit"
                          disabled={formLoading}
                          className="h-12 px-6 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25 disabled:opacity-50"
                        >
                          {formLoading ? "..." : "Get Notified"}
                        </Button>
                      </div>

                      {/* Country + Role */}
                      <div className="flex gap-3">
                        <select
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="flex-1 h-10 rounded-xl border border-white/20 bg-black/40 backdrop-blur-sm px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none cursor-pointer"
                        >
                          {COUNTRIES.map(c => (
                            <option key={c.code} value={c.code} className="bg-black text-white">{c.name}</option>
                          ))}
                        </select>
                        <div className="flex rounded-xl border border-white/20 overflow-hidden">
                          {(["parent", "student"] as const).map(r => (
                            <button
                              type="button" key={r}
                              onClick={() => setRole(r)}
                              className={`px-3 text-xs font-medium transition-all ${
                                role === r
                                  ? "bg-white/10 text-white"
                                  : "text-white/40 hover:text-white/60"
                              }`}
                            >
                              {r === "parent" ? "Parent" : "Student"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </form>

                    {/* Social Proof — Same style */}
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white/20 flex items-center justify-center text-white text-xs font-medium">
                          P
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-2 border-white/20 flex items-center justify-center text-white text-xs font-medium">
                          A
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-white/20 flex items-center justify-center text-white text-xs font-medium">
                          R
                        </div>
                      </div>
                      <span className="text-white/70 text-sm">
                        {stats && stats.total > 0 ? `~${stats.total}+ families already joined` : "~2k+ families already joined"}
                      </span>
                    </div>

                    {/* Countdown — Same exact layout */}
                    <div className="flex items-center justify-center gap-6 text-center">
                      <div>
                        <div className="text-2xl font-light text-white">{timeLeft.days}</div>
                        <div className="text-xs text-white/60 uppercase tracking-wide">days</div>
                      </div>
                      <div className="text-white/40">|</div>
                      <div>
                        <div className="text-2xl font-light text-white">{timeLeft.hours}</div>
                        <div className="text-xs text-white/60 uppercase tracking-wide">hours</div>
                      </div>
                      <div className="text-white/40">|</div>
                      <div>
                        <div className="text-2xl font-light text-white">{timeLeft.minutes}</div>
                        <div className="text-xs text-white/60 uppercase tracking-wide">minutes</div>
                      </div>
                      <div className="text-white/40">|</div>
                      <div>
                        <div className="text-2xl font-light text-white">{timeLeft.seconds}</div>
                        <div className="text-xs text-white/60 uppercase tracking-wide">seconds</div>
                      </div>
                    </div>
                  </>
                ) : signup ? (
                  /* ═══ SUCCESS STATE ═══ */
                  <div className="text-center py-2">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-400/30 to-emerald-500/30 flex items-center justify-center border border-green-400/40">
                      <svg className="w-8 h-8 text-green-400 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>

                    <h3 className="text-xl font-semibold text-white mb-1 drop-shadow-lg">
                      {signup.alreadyJoined ? "Welcome back! 👋" : "You're on the list! 🎉"}
                    </h3>
                    <p className="text-white/70 text-sm mb-3">
                      Position <span className="text-white font-bold">#{signup.position}</span> · {signup.discountPercent > 0 ? `${signup.discountPercent}% off forever` : "We'll notify you at launch"}
                    </p>

                    {/* Referral Code */}
                    <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2 mb-4">
                      <span className="text-xs text-white/40">Your code:</span>
                      <span className="text-sm font-bold text-white tracking-widest font-mono">{signup.referralCode}</span>
                    </div>

                    {/* Pricing — if discount */}
                    {signup.discountPercent > 0 && (
                      <div className="mb-4">
                        <div className="flex items-baseline justify-center gap-2 mb-3">
                          <span className="text-sm text-white/30 line-through">$29/mo</span>
                          <span className="text-3xl font-bold text-white">${Math.round(29 * (1 - signup.discountPercent / 100))}</span>
                          <span className="text-sm text-white/30">/mo forever</span>
                        </div>

                        <Button
                          onClick={async () => {
                            try {
                              const res = await fetch("/api/waitlist/payment/intent", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ email, planId: "student_solo_monthly" }),
                              });
                              const data = await res.json();
                              if (data.checkoutUrl) window.location.href = data.checkoutUrl;
                              else alert("Payment setup coming soon! Your discount is locked.");
                            } catch { alert("Payment setup coming soon! Your discount is locked."); }
                          }}
                          className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25 mb-2"
                        >
                          💳 Pay now — lock ${Math.round(29 * (1 - signup.discountPercent / 100))}/mo forever
                        </Button>

                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                          <span className="text-[10px] text-white/30">100% refund if scores don&apos;t improve</span>
                        </div>
                        <button className="text-[11px] text-white/20 hover:text-white/40 transition-colors">Maybe later — keep my spot</button>
                      </div>
                    )}

                    {/* Share buttons */}
                    <div className="border-t border-white/10 pt-4 mt-2">
                      <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-3">Share to jump 50 spots</p>
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
                      <p className="text-[10px] text-white/20 mt-2">3 referrals = best tier forever</p>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Glass overlay */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-transparent via-white/[0.02] to-white/[0.05] pointer-events-none" />
            </div>

            {/* Outer glow — Same red/purple gradient */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-red-500/10 to-purple-600/10 blur-xl scale-110 -z-10" />
          </div>
        </div>
      </div>
    </main>
  );
}
