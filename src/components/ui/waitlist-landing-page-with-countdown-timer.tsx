"use client";

import React, { useState, useEffect, useRef, useCallback, type FormEvent } from "react";
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
  spotsLeft: number | null;
  discountPercent: number;
  recentActivity?: { firstName: string; city: string | null; country: string; minutesAgo: number }[];
  leaders?: { rank: number; firstName: string; city: string | null; country: string; referralCount: number }[];
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

const PLANS = [
  { id: "weekly", stripeId: "student_solo_monthly", name: "Weekly", original: "$12.99/week", price: "$5.19/week", priceNum: "5.19", saving: "Save 60%", description: "Try it for a week", badge: null },
  { id: "monthly", stripeId: "family_monthly", name: "Monthly", original: "$49/month", price: "$19/month", priceNum: "19", saving: "60% off forever", description: "Best for most families", badge: "Most popular" },
  { id: "annual", stripeId: "family_annual", name: "Annual", original: "$299/year", price: "$119/year", priceNum: "9.99", saving: "Under $10/month", description: "Best value — 2 months free", badge: "Best value" },
];

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

  const [step, setStep] = useState<"form" | "commitment" | "pricing" | "share">("form");
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
  const [childName, setChildName] = useState("");
  const [country, setCountry] = useState("NP");
  const [role, setRole] = useState<"parent" | "student">("parent");
  const [referredBy, setReferredBy] = useState<string | null>(null);

  // Commitment fields
  const [commitSubject, setCommitSubject] = useState("Mathematics");
  const [commitGoal, setCommitGoal] = useState("");
  const [commitLoading, setCommitLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("monthly");

  // Signature canvas
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const sigDrawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Share card state
  const [cardImageUrl, setCardImageUrl] = useState<string | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

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

  // Signature canvas drawing
  useEffect(() => {
    if (step !== "commitment") return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    function getPos(e: MouseEvent | TouchEvent) {
      const rect = canvas!.getBoundingClientRect();
      const sx = canvas!.width / rect.width, sy = canvas!.height / rect.height;
      const touch = "touches" in e ? e.touches[0] : null;
      return { x: ((touch?.clientX ?? (e as MouseEvent).clientX) - rect.left) * sx, y: ((touch?.clientY ?? (e as MouseEvent).clientY) - rect.top) * sy };
    }
    function startDraw(e: MouseEvent | TouchEvent) { e.preventDefault(); sigDrawingRef.current = true; ctx!.beginPath(); const { x, y } = getPos(e); ctx!.moveTo(x, y); }
    function draw(e: MouseEvent | TouchEvent) { e.preventDefault(); if (!sigDrawingRef.current) return; const { x, y } = getPos(e); ctx!.lineTo(x, y); ctx!.strokeStyle = "#ef4444"; ctx!.lineWidth = 2.5; ctx!.lineCap = "round"; ctx!.lineJoin = "round"; ctx!.stroke(); setHasSignature(true); }
    function stopDraw() { sigDrawingRef.current = false; }
    canvas.addEventListener("mousedown", startDraw); canvas.addEventListener("mousemove", draw); canvas.addEventListener("mouseup", stopDraw);
    canvas.addEventListener("touchstart", startDraw, { passive: false }); canvas.addEventListener("touchmove", draw, { passive: false }); canvas.addEventListener("touchend", stopDraw);
    return () => { canvas.removeEventListener("mousedown", startDraw); canvas.removeEventListener("mousemove", draw); canvas.removeEventListener("mouseup", stopDraw); canvas.removeEventListener("touchstart", startDraw); canvas.removeEventListener("touchmove", draw); canvas.removeEventListener("touchend", stopDraw); };
  }, [step]);

  const clearSignature = useCallback(() => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  }, []);

  // Handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setFormLoading(true);
    try {
      const res = await fetch("/api/waitlist/join", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, childName: childName.trim() || null, countryCode: country, role, referredBy }) });
      const data = await res.json();
      if (data.ok || data.referralCode) { setSignup(data); if (data.childName) setChildName(data.childName); setStep("commitment"); setTimeout(() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100); }
    } catch {} finally { setFormLoading(false); }
  };

  const handleCommitment = async () => {
    if (!commitGoal.trim() || !hasSignature) return;
    setCommitLoading(true);
    const canvas = sigCanvasRef.current;
    const signatureDataUrl = canvas?.toDataURL("image/png");
    const commitmentText = `I, ${signup?.name}, commit to helping ${childName || signup?.childName || "my child"} master ${commitSubject}. My goal: ${commitGoal}.`;
    try {
      await fetch("/api/waitlist/commitment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        email,
        childName: childName || signup?.childName,
        commitmentSubject: commitSubject,
        commitmentGoal: commitGoal,
        commitmentText,
        signatureDataUrl,
      }) });
    } catch {} finally { setCommitLoading(false); setStep("pricing"); setTimeout(() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100); }
  };

  const handleStripeCheckout = async () => {
    const plan = PLANS.find(p => p.id === selectedPlan);
    if (!plan) return;
    setPaymentLoading(true);
    try {
      // Save chosen plan
      await fetch("/api/waitlist/commitment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, chosenPlan: plan.id, planPriceUsd: plan.priceNum, planOriginalPrice: plan.original }) });
      // Create Stripe checkout session
      const res = await fetch("/api/waitlist/payment/intent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, planId: plan.stripeId }) });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
    } catch {}
    setPaymentLoading(false);
    // If Stripe fails, fall through to share step
    goToShareStep(PLANS.find(p => p.id === selectedPlan) || null);
  };

  const goToShareStep = async (plan: typeof PLANS[number] | null) => {
    setStep("share");
    setCardLoading(true);
    setTimeout(() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    // Generate Gemini image
    try {
      const res = await fetch("/api/waitlist/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ referralCode: signup?.referralCode, childName: childName || signup?.childName, subject: commitSubject, goal: commitGoal, plan: plan ? `${plan.name} — ${plan.price} · 60% off forever` : "Founding Member" }) });
      const data = await res.json();
      if (data.imageBase64) setCardImageUrl(data.imageBase64);
      else if (data.imageUrl) setCardImageUrl(data.imageUrl);
    } catch {}
    setCardLoading(false);
  };

  const handleSkipPayment = () => {
    goToShareStep(null);
  };

  const handleCopy = () => { if (!signup) return; navigator.clipboard.writeText(`https://zorvai.ca/waitlist?ref=${signup.referralCode}`); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const handleWhatsAppShare = () => {
    if (!signup) return;
    const plan = PLANS.find(p => p.id === selectedPlan);
    const cn = childName || signup.childName || "my child";
    const url = `https://zorvai.ca/waitlist?ref=${signup.referralCode}`;
    const message = `I just made a commitment to help ${cn} master ${commitSubject} this year.\n\nZorvai is an AI tutor that teaches like a real one-to-one tutor — checking real understanding before moving on.\n\nAnd if your child's score doesn't improve — full refund.\n\nRight now: ${plan?.price} (${plan?.saving}).\n\nOnly ${stats?.spotsLeft ?? "limited"} founding spots left.\n\nJoin here: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleTwitterShare = () => {
    if (!signup) return;
    const cn = childName || signup.childName || "my child";
    const url = `https://zorvai.ca/waitlist?ref=${signup.referralCode}`;
    const msg = `I just committed to helping ${cn} master ${commitSubject} with @zorvai — an AI tutor that gives you a full refund if scores don't improve. Founding members get 60% off forever. ${url}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleFacebookShare = () => {
    if (!signup) return;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://zorvai.ca/waitlist?ref=${signup.referralCode}`)}`, "_blank");
  };

  const downloadCard = () => {
    if (!cardImageUrl) return;
    const a = document.createElement("a"); a.href = cardImageUrl; a.download = `zorvai-commitment-${signup?.referralCode}.png`; a.click();
  };

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
      <div className="fixed top-3 sm:top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-24px)] sm:w-auto max-w-[95vw]">
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-full px-2 sm:px-3 py-1.5 sm:py-2">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none">
            <button onClick={() => scrollTo("waitlist")} className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 py-1 rounded-full hover:bg-white/5 transition-all group flex-shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 border-white/20 group-hover:border-white/40 transition-all shadow-[0_0_10px_rgba(78,205,196,0.2)]">
                <img src="/zorvai-logo.png" alt="Zorvai" className="w-full h-full object-cover" />
              </div>
              <span className="text-white font-semibold text-xs sm:text-sm tracking-tight hidden sm:block">Zorvai</span>
            </button>
            <div className="w-px h-4 sm:h-5 bg-white/10 mx-0.5 sm:mx-1 flex-shrink-0" />
            {navItems.map((item) => {
              const isWaitlist = item.id === "waitlist";
              const isActive = activeNav === item.id;
              return (
                <button key={item.id} onClick={() => scrollTo(item.id)} className={`text-[11px] sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all duration-200 flex-shrink-0 whitespace-nowrap ${isWaitlist ? isActive ? "bg-red-600 text-white border border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.4)]" : "bg-red-600/80 text-white border border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.25)] hover:shadow-[0_0_14px_rgba(239,68,68,0.4)] animate-pulse" : isActive ? "bg-white/10 text-white border border-white/20" : "text-white/50 hover:text-white/80"}`}>
                  {isWaitlist ? "⚡ Waitlist" : item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ LIVE ACTIVITY TOAST ═══ */}
      {activity && (
        <div className={`fixed bottom-3 sm:bottom-6 left-3 sm:left-6 z-40 transition-all duration-300 max-w-[280px] sm:max-w-[320px] ${activityVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
          <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 shadow-2xl">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
            <span className="text-white/60 text-[10px] sm:text-xs">
              <span className="text-white/90 font-medium">{activity.firstName}</span> from {activity.city || activity.country} joined {activity.minutesAgo}m ago
            </span>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
           SECTION 1: FEATURES
           ═══════════════════════════════════════════════════════ */}
      <Section id="features" className="pt-20 sm:pt-28">
        <div className="text-center mb-8 sm:mb-12">
          <p className="text-red-400 text-xs font-semibold uppercase tracking-[0.2em] mb-3 animate-pulse">Core Principles</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-white tracking-wide mb-3 sm:mb-4">How Zorvai actually teaches</h2>
          <p className="text-white/50 text-sm sm:text-base max-w-md mx-auto leading-relaxed">Not a chatbot. Not a video library. A tutor that checks real understanding — or gives your money back.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
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
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-white tracking-wide mb-3 sm:mb-4">Can you invest $19/month in your child&apos;s future?</h2>
          <p className="text-white/50 text-sm sm:text-base max-w-lg mx-auto">Regular price is $49/month. Founding members lock in 60% off forever. That&apos;s less than one hour of a private tutor — with a money-back guarantee.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {PLANS.map((plan) => (
            <div key={plan.id} className={`relative backdrop-blur-lg rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
              plan.id === "monthly"
                ? "bg-white/[0.04] border-2 border-red-500/30 hover:border-red-500/50 hover:shadow-[0_0_40px_rgba(239,68,68,0.1)]"
                : "bg-white/[0.03] border border-white/10 hover:border-white/20"
            }`}>
              {plan.badge && (
                <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl">{plan.badge}</div>
              )}
              <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${plan.id === "monthly" ? "text-red-400/70" : "text-white/60"}`}>{plan.name}</p>
              <p className="text-white/40 text-xs mb-4">{plan.description}</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-white/30 text-sm line-through">{plan.original}</span>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className={`text-3xl font-bold ${plan.id === "monthly" ? "text-white" : "text-white/90"}`}>{plan.price.split("/")[0]}</span>
                <span className="text-white/40 text-sm">/{plan.price.split("/")[1]}</span>
              </div>
              <p className={`text-xs font-semibold mb-4 ${plan.id === "monthly" ? "text-red-400" : "text-white/50"}`}>{plan.saving}</p>
              <ul className="space-y-2 text-sm text-white/50">
                {["Unlimited AI tutoring", "Voice + text", "All subjects", "Money-back guarantee", ...(plan.id !== "weekly" ? ["Founding badge forever"] : [])].map(f => <li key={f} className="flex items-center gap-2"><span className="text-green-400">✓</span>{f}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-6 backdrop-blur-lg bg-white/[0.02] border border-white/10 rounded-xl p-4 text-center">
          <p className="text-white/40 text-sm">💳 Payment collected at launch — not now. Lock in your price today.</p>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════
           SECTION 3: WAITLIST — Main Card
           ═══════════════════════════════════════════════════════ */}
      <Section id="waitlist">
        <div className="flex items-center justify-center px-2">
          <div className="relative w-full max-w-[420px]">
            <div className="relative backdrop-blur-xl bg-black/60 border border-white/20 rounded-2xl sm:rounded-3xl p-5 sm:p-8 w-full shadow-2xl">
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              <div className="relative z-10">

                {/* ─── FORM STEP ─── */}
                {step === "form" && (
                  <>
                    <div className="mb-4 sm:mb-6 text-center">
                      <h2 className="text-2xl sm:text-4xl font-light text-white mb-3 sm:mb-4 tracking-wide">Join the waitlist</h2>
                      <p className="text-white/70 text-sm sm:text-base leading-relaxed">Get early access to Zorvai — the AI tutor that checks real understanding before moving on</p>
                    </div>
                    <form onSubmit={handleSubmit} className="mb-5 space-y-3">
                      <Input type="text" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} required className="bg-black/40 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 h-12 rounded-xl backdrop-blur-sm" />
                      <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-black/40 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 h-12 rounded-xl backdrop-blur-sm" />
                      <Input type="text" placeholder="Child's first name (optional)" value={childName} onChange={(e) => setChildName(e.target.value)} className="bg-black/40 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 h-12 rounded-xl backdrop-blur-sm" />
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <select value={country} onChange={(e) => setCountry(e.target.value)} className="flex-1 h-10 rounded-xl border border-white/20 bg-black/40 backdrop-blur-sm px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none cursor-pointer">
                          {COUNTRIES.map(c => <option key={c.code} value={c.code} className="bg-black text-white">{c.name}</option>)}
                        </select>
                        <div className="flex rounded-xl border border-white/20 overflow-hidden self-start">
                          {(["parent", "student"] as const).map(r => (
                            <button type="button" key={r} onClick={() => setRole(r)} className={`px-4 sm:px-3 py-2 sm:py-0 text-xs font-medium transition-all ${role === r ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}>{r === "parent" ? "Parent" : "Student"}</button>
                          ))}
                        </div>
                      </div>
                      <Button type="submit" disabled={formLoading} className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25 disabled:opacity-50">
                        {formLoading ? "Processing..." : "Continue →"}
                      </Button>
                    </form>
                    <div className="flex items-center justify-center gap-3 mb-5">
                      <div className="flex -space-x-2">
                        {[{ bg: "from-blue-400 to-blue-600", l: "P" }, { bg: "from-green-400 to-green-600", l: "A" }, { bg: "from-purple-400 to-purple-600", l: "R" }].map((a, i) => (
                          <div key={i} className={`w-8 h-8 rounded-full bg-gradient-to-br ${a.bg} border-2 border-white/20 flex items-center justify-center text-white text-xs font-medium`}>{a.l}</div>
                        ))}
                      </div>
                      <span className="text-white/70 text-sm">{stats && stats.total > 0 ? `~${stats.total}+ families joined` : "~2k+ families joined"}</span>
                    </div>
                    <div className="text-center mb-5 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3" id="spots-badge">
                      <p className="text-white/50 text-xs">🎉 <span className="text-red-400 font-semibold">Founding members</span> get <span className="text-white font-bold">60% off forever</span> — only <span className="text-white font-bold">$19/mo</span> (was $49)</p>
                    </div>
                    <div className="flex items-center justify-center gap-4 sm:gap-6 text-center">
                      {[{ v: timeLeft.days, l: "days" }, { v: timeLeft.hours, l: "hours" }, { v: timeLeft.minutes, l: "min" }, { v: timeLeft.seconds, l: "sec" }].map((t, i) => (
                        <React.Fragment key={t.l}>{i > 0 && <div className="text-white/20">|</div>}<div><div className="text-2xl font-light text-white tabular-nums">{String(t.v).padStart(2, "0")}</div><div className="text-[10px] text-white/40 uppercase tracking-widest">{t.l}</div></div></React.Fragment>
                      ))}
                    </div>
                  </>
                )}

                {/* ─── COMMITMENT STEP (with signature canvas) ─── */}
                {step === "commitment" && signup && (
                  <div>
                    <div className="text-center mb-4">
                      <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-r from-red-500/20 to-purple-500/20 flex items-center justify-center border border-white/20">
                        <span className="text-2xl">📝</span>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">Commitment Letter</h3>
                      <p className="text-white/50 text-sm">Families who write a specific promise see better outcomes.</p>
                    </div>

                    {/* Commitment paper */}
                    <div className="backdrop-blur-lg bg-white/[0.03] border border-white/10 rounded-xl p-5 mb-4">
                      <p className="text-sm text-white/80 leading-[2.2]">
                        I, <span className="text-red-400 font-semibold">{signup.name}</span>, as the parent of{" "}
                        <input value={childName || signup.childName || ""} onChange={(e) => setChildName(e.target.value)} placeholder="child's name" className="bg-transparent border-b border-white/20 text-red-400 text-sm outline-none px-1 pb-0.5 min-w-[90px] focus:border-red-400/50" />
                        , commit to investing in my child&apos;s education.
                      </p>

                      <div className="mt-4 space-y-3 text-left">
                        <div>
                          <label className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-1 block">Subject they struggle with</label>
                          <select value={commitSubject} onChange={(e) => setCommitSubject(e.target.value)} className="w-full h-10 rounded-xl border border-white/20 bg-black/40 backdrop-blur-sm px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none cursor-pointer">
                            {SUBJECTS.map(s => <option key={s} value={s} className="bg-black text-white">{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-1 block">Specific goal</label>
                          <Input type="text" placeholder="Pass board exam / Score above 80% / Improve from C to A" value={commitGoal} onChange={(e) => setCommitGoal(e.target.value)} className="bg-black/40 border-white/20 text-white placeholder:text-white/30 focus:border-white/40 focus:ring-white/20 h-12 rounded-xl backdrop-blur-sm" />
                        </div>
                      </div>

                      <p className="text-white/40 text-xs italic leading-relaxed mt-4 mb-4">&ldquo;I believe my child is capable of more. I am making this commitment today because their future matters more than the cost of one month of private tutoring.&rdquo;</p>

                      <div className="border-t border-white/10 pt-4">
                        <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-2">Your signature</p>
                        <canvas ref={sigCanvasRef} width={600} height={120} className="w-full h-[80px] bg-black/30 rounded-lg border border-white/10 cursor-crosshair" style={{ touchAction: "none" }} />
                        <button onClick={clearSignature} className="text-[10px] text-white/20 hover:text-white/40 transition-colors mt-1">Clear signature</button>
                        <p className="text-[10px] text-white/20 mt-2">Date: {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</p>
                      </div>
                    </div>

                    <button onClick={handleCommitment} disabled={commitLoading || !commitGoal.trim() || !hasSignature} className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25 disabled:opacity-50 text-sm">
                      {commitLoading ? "Saving..." : "I commit to my child's future →"}
                    </button>
                    {(!hasSignature || !commitGoal.trim()) && (
                      <p className="text-[10px] text-white/20 text-center mt-2">{!hasSignature ? "Add your signature above to continue" : "Fill in subject and goal to continue"}</p>
                    )}
                    <button onClick={() => { setStep("pricing"); setTimeout(() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100); }} className="text-[11px] text-white/20 hover:text-white/40 transition-colors mt-2 block mx-auto">Skip for now</button>
                  </div>
                )}

                {/* ─── PRICING STEP ─── */}
                {step === "pricing" && signup && (
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-white mb-2">Can you invest in {childName || signup.childName || "your child"}&apos;s future?</h3>
                    <p className="text-white/50 text-sm mb-5">One month of private tutoring costs $200–400. Zorvai costs less than a family dinner out. And if their scores don&apos;t improve — full refund.</p>

                    <div className="space-y-2 mb-4">
                      {PLANS.map(plan => (
                        <div key={plan.id} onClick={() => setSelectedPlan(plan.id)} className={`relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 ${selectedPlan === plan.id ? "bg-white/[0.06] border border-red-500/30" : "bg-white/[0.02] border border-white/10 hover:border-white/20"}`}>
                          {plan.badge && <span className="absolute -top-2 right-3 bg-red-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">{plan.badge}</span>}
                          <div className="flex items-center gap-2">
                            <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedPlan === plan.id ? "border-red-400" : "border-white/20"}`}>
                              {selectedPlan === plan.id && <span className="w-2 h-2 rounded-full bg-red-400" />}
                            </span>
                            <div className="text-left">
                              <span className="text-sm font-medium text-white">{plan.name}</span>
                              <span className="text-[10px] text-white/40 block">{plan.description}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-sm font-bold ${selectedPlan === plan.id ? "text-red-400" : "text-white/80"}`}>{plan.price}</span>
                            <span className="text-[10px] text-white/30 line-through block">{plan.original}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="text-[10px] text-white/20 mb-4">🔒 60% off is locked in forever for founding members. Regular price returns after 500 signups.</p>

                    <button onClick={handleStripeCheckout} disabled={paymentLoading} className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25 text-sm disabled:opacity-50">
                      {paymentLoading ? "Redirecting to payment..." : `Lock in ${PLANS.find(p => p.id === selectedPlan)?.price} — Pay now →`}
                    </button>
                    <p className="text-[10px] text-white/20 mt-2 mb-2">💳 Secure checkout by Stripe. Cancel anytime before launch for full refund.</p>
                    <button onClick={handleSkipPayment} className="text-[11px] text-white/20 hover:text-white/40 transition-colors block mx-auto">Not ready to pay — stay on free waitlist</button>
                  </div>
                )}

                {/* ─── SHARE STEP (Gemini card) ─── */}
                {step === "share" && signup && (
                  <div className="text-center py-2">
                    <h3 className="text-xl font-semibold text-white mb-1">Your commitment card is ready.</h3>
                    <p className="text-white/40 text-xs mb-4">Share it. Every 3 families you refer keeps your price locked forever.</p>

                    {/* Card or loading */}
                    {cardLoading ? (
                      <div className="py-8">
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-4">
                          <div className="h-full bg-red-500 rounded-full" style={{ animation: "loadBar 12s linear forwards" }} />
                        </div>
                        <p className="text-white/50 text-sm">Creating your commitment card...</p>
                        <p className="text-white/30 text-[10px]">Our AI is designing a card from your commitment</p>
                      </div>
                    ) : cardImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cardImageUrl} alt="Your commitment card" className="w-full max-w-[260px] mx-auto rounded-2xl shadow-2xl mb-4" style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(239,68,68,0.15)" }} />
                    ) : (
                      <div className="w-full h-[200px] bg-white/[0.02] border border-white/10 rounded-2xl flex items-center justify-center text-white/30 text-sm mb-4">Card unavailable — share the link below</div>
                    )}

                    {cardImageUrl && (
                      <button onClick={downloadCard} className="w-full h-10 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-semibold hover:bg-white/10 transition-colors mb-3">↓ Download card</button>
                    )}

                    <div className="space-y-2 mb-4">
                      <button onClick={handleWhatsAppShare} className="w-full h-10 rounded-xl bg-[#25D366]/20 border border-[#25D366]/30 text-[#25d366] text-xs font-semibold hover:bg-[#25D366]/30 transition-colors">📱 Share on WhatsApp</button>
                      <div className="flex gap-2">
                        <button onClick={handleTwitterShare} className="flex-1 h-9 rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs font-semibold hover:bg-white/10 transition-colors">𝕏 Twitter</button>
                        <button onClick={handleFacebookShare} className="flex-1 h-9 rounded-xl bg-[#1877F2]/10 border border-[#1877F2]/20 text-[#1877F2] text-xs font-semibold hover:bg-[#1877F2]/20 transition-colors">Facebook</button>
                        <button onClick={handleCopy} className={`flex-1 h-9 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold transition-colors ${copied ? "text-green-400" : "text-white/50 hover:bg-white/10"}`}>{copied ? "Copied ✓" : "Copy link"}</button>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2 mb-4">
                      <span className="text-xs text-white/40">Your code:</span>
                      <span className="text-sm font-bold text-white tracking-widest font-mono">{signup.referralCode}</span>
                    </div>

                    <div className="border-t border-white/10 pt-4">
                      <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-3">Referral milestones</p>
                      <div className="space-y-1.5 text-left">
                        {[{ n: 1, t: "referral → jump 50 spots" }, { n: 3, t: "referrals → 60% off stays locked even if tier closes" }, { n: 5, t: "referrals → first month completely free" }, { n: 10, t: "referrals → Founding Resistance Member forever" }].map(m => (
                          <div key={m.n} className="flex items-center gap-2 text-xs"><span className="text-white/20">🔒</span><span className="text-white/30"><strong className="text-white/40">{m.n}</strong> {m.t}</span></div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-t from-transparent via-white/[0.02] to-white/[0.05] pointer-events-none" />
            </div>
            <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-red-500/10 to-purple-600/10 blur-xl scale-110 -z-10 animate-pulse" />
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════
           SECTION 4: LAUNCH
           ═══════════════════════════════════════════════════════ */}
      <Section id="launch">
        <div className="text-center mb-12">
          <p className="text-red-400 text-xs font-semibold uppercase tracking-[0.2em] mb-3">Launch Day</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-white tracking-wide mb-3 sm:mb-4">Launching in {timeLeft.days} days</h2>
          <p className="text-white/50 text-sm sm:text-base max-w-md mx-auto">September 19, 2026 — here&apos;s the plan.</p>
        </div>
        <div className="space-y-3 sm:space-y-4">
          {[
            { day: "Now", title: "Join the Waitlist", desc: "Reserve your spot. First 100 get founding member pricing (60% off forever).", active: true },
            { day: "Day 1–10", title: "Early Access Invites", desc: "Top waitlist members get beta access. Test the tutor, give feedback, shape the product." },
            { day: "Day 10–18", title: "Onboarding & Baseline", desc: "Your child takes a baseline quiz — the benchmark for the money-back guarantee." },
            { day: "Day 19", title: "Final Pre-Launch Check", desc: "All founding members confirmed. Discounts locked. Payment links sent." },
            { day: "Sept 19", title: "🚀 Public Launch", desc: "Zorvai goes live. Regular pricing ($29/mo) starts. Your founding discount is permanent." },
          ].map((item, i) => (
            <div key={i} className={`flex gap-3 sm:gap-4 backdrop-blur-lg border rounded-xl sm:rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:scale-[1.01] ${item.active ? "bg-red-500/[0.06] border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.05)]" : "bg-white/[0.02] border-white/10 hover:border-white/20"}`}>
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
           SECTION: PROBLEM STATEMENT (from master prompt)
           ═══════════════════════════════════════════════════════ */}
      <Section id="problem">
        <h2 className="text-2xl sm:text-3xl font-light text-white tracking-wide mb-5">Here&apos;s what&apos;s actually happening.</h2>
        <div className="w-10 h-0.5 bg-red-500 mb-6" />
        <p className="text-base sm:text-lg text-white leading-relaxed mb-4">Your child re-reads their notes. It feels productive.</p>
        <p className="text-sm sm:text-base text-white/50 leading-relaxed mb-5">
          Research consistently shows students forget the vast majority of re-read material within 24 hours. They&apos;re not lazy — nobody taught them how to actually retain what they study.
        </p>
        <div className="backdrop-blur-lg bg-white/[0.03] border border-white/10 rounded-xl p-5">
          <p className="text-base text-white/80 leading-relaxed italic">
            &ldquo;The students who consistently do better have one thing: someone who checks real understanding — not just whether they read.&rdquo;
          </p>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════
           SECTION: GUARANTEE (from master prompt)
           ═══════════════════════════════════════════════════════ */}
      <Section id="guarantee-section">
        <div className="backdrop-blur-lg bg-white/[0.02] border border-white/10 rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-white mb-1">Real improvement.</h2>
          <h2 className="text-xl sm:text-2xl font-semibold text-red-400 mb-6">Or your money back.</h2>
          <div className="h-px bg-white/10 mb-5" />
          <p className="text-white/50 text-sm sm:text-base leading-relaxed mb-5">
            We track your child&apos;s score before they start and after they complete their sessions. If it doesn&apos;t go up — full refund. No arguments. No &ldquo;they didn&apos;t try hard enough.&rdquo; Just two numbers: before and after.
          </p>
          <div className="h-px bg-white/10 mb-5" />
          <div className="space-y-3">
            {[
              "Take a short quiz when they start — 5 minutes, 10 questions.",
              "Complete at least 12 study sessions in 30 days.",
              "If the score doesn't improve — full refund, processed in 5 days.",
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-red-400 font-bold text-base min-w-[20px] pt-0.5">{i + 1}</span>
                <span className="text-white/50 text-sm leading-relaxed">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════
           SECTION: JEALOUSY / COMMITMENT FEED (from master prompt)
           ═══════════════════════════════════════════════════════ */}
      <Section id="social-proof">
        <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">While you&apos;re reading this.</h2>
        <p className="text-white/50 text-sm mb-6">Other parents already committed.</p>
        <div className="space-y-3">
          {[
            { quote: "I committed to helping Aanya master Mathematics before her board exam.", city: "Mumbai", min: 4 },
            { quote: "My son struggled with Science for 2 years. This year is different.", city: "Dhaka", min: 11 },
            { quote: "Saanvi is going to pass her SEE exam. I made the commitment today.", city: "Kathmandu", min: 18 },
          ].map((item, i) => (
            <div key={i} className="backdrop-blur-lg bg-white/[0.03] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all duration-300">
              <p className="text-white/70 text-sm italic leading-relaxed mb-2">&ldquo;{item.quote}&rdquo;</p>
              <p className="text-white/30 text-xs">A parent from {item.city} · {item.min} minutes ago</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════
           SECTION: LEADERBOARD (from master prompt)
           ═══════════════════════════════════════════════════════ */}
      {stats?.leaders && stats.leaders.length > 0 && (
        <Section id="leaderboard">
          <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">Top Resistance</h2>
          <p className="text-white/50 text-sm mb-6">Parents who brought the most families in.</p>
          <div className="space-y-2">
            {stats.leaders.map((leader, i) => (
              <div key={i} className={`backdrop-blur-lg border rounded-xl p-3 sm:p-4 flex items-center gap-3 transition-all duration-300 hover:scale-[1.01] ${i === 0 ? "bg-red-500/[0.06] border-red-500/20" : "bg-white/[0.02] border-white/10"}`}>
                <span className="text-lg font-bold text-red-400 min-w-[28px]">#{leader.rank}</span>
                <span className="flex-1 text-sm text-white">{leader.firstName}{leader.city ? ` · ${leader.city}` : ""}</span>
                <span className="text-xs text-white/40">{leader.referralCount} families</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════════
           SECTION: FOUNDER STORY (from master prompt)
           ═══════════════════════════════════════════════════════ */}
      <Section id="founder-story">
        <p className="text-base sm:text-lg font-medium text-white leading-relaxed mb-4">
          Prince, Rabindra, and Aditya grew up in Nepal without private tutors.
        </p>
        <p className="text-sm sm:text-base text-white/50 leading-relaxed mb-4">
          They watched classmates with tutors consistently pass exams they failed — not because those classmates were smarter, but because someone was checking whether they actually understood the material, not just whether they&apos;d read it.
        </p>
        <p className="text-sm sm:text-base text-white/70 leading-relaxed mb-6">
          They searched for an AI that could teach the way a real one-to-one tutor would. They couldn&apos;t find one. So they built it.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { name: "Prince", role: "Co-founder", flag: "🇳🇵" },
            { name: "Rabindra", role: "Co-founder", flag: "🇳🇵" },
            { name: "Aditya", role: "Co-founder", flag: "🇳🇵" },
          ].map(founder => (
            <div key={founder.name} className="backdrop-blur-lg bg-white/[0.03] border border-white/10 rounded-xl p-3 sm:p-4 flex items-center gap-3 hover:border-white/20 transition-all">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500/20 to-purple-500/20 border border-white/20 flex items-center justify-center text-sm font-bold text-red-400 flex-shrink-0">{founder.name[0]}</div>
              <div>
                <p className="text-sm font-medium text-white">{founder.name}</p>
                <p className="text-[10px] text-white/40">{founder.role} {founder.flag}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════
           SECTION: BOTTOM CTA (from master prompt)
           ═══════════════════════════════════════════════════════ */}
      <Section id="bottom-cta">
        {step === "form" ? (
          <div className="backdrop-blur-xl bg-black/60 border border-white/20 rounded-2xl p-6 sm:p-8 text-center">
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">Secure your spot.</h2>
            <div className="inline-flex items-center gap-2 bg-red-500/[0.08] border border-red-500/20 rounded-lg px-4 py-2 mb-5">
              <span className="text-red-400 text-sm font-medium">⚡ {stats?.spotsLeft ?? "~"} founding spots left — 60% off forever</span>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 max-w-sm mx-auto">
              <Input type="text" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} required className="bg-black/40 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 h-12 rounded-xl backdrop-blur-sm" />
              <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-black/40 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 h-12 rounded-xl backdrop-blur-sm" />
              <Button type="submit" disabled={formLoading} className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all">Join the Resistance →</Button>
            </form>
          </div>
        ) : (
          <div className="text-center backdrop-blur-xl bg-black/60 border border-white/20 rounded-2xl p-6">
            <p className="text-white/50 text-sm mb-4">You&apos;re already in — Position #{signup?.position}</p>
            <Button onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })} className="h-12 px-8 bg-red-600 hover:bg-red-700 text-white rounded-xl">Refer families to move up →</Button>
          </div>
        )}
      </Section>

      {/* ═══════════════════════════════════════════════════════
           SECTION 5: FAQ
           ═══════════════════════════════════════════════════════ */}
      <Section id="faq">
        <div className="text-center mb-10">
          <p className="text-red-400 text-xs font-semibold uppercase tracking-[0.2em] mb-3">Questions & Answers</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-white tracking-wide mb-3 sm:mb-4">Frequently asked</h2>
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
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-white tracking-wide mb-3 sm:mb-4">Building in public</h2>
          <p className="text-white/50 text-sm sm:text-base max-w-md mx-auto">We update this page as we ship. Your feedback shapes what we build next.</p>
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

      {/* ═══ FOOTER — Trust & Contact ═══ */}
      <footer className="relative z-10 border-t border-white/5 py-10 sm:py-14 px-6">
        <div className="max-w-xl mx-auto">
          {/* Founder trust block */}
          <div className="backdrop-blur-lg bg-white/[0.02] border border-white/10 rounded-2xl p-5 sm:p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-white/15 flex-shrink-0 shadow-[0_0_15px_rgba(78,205,196,0.1)]">
                <img src="/zorvai-logo.png" alt="Zorvai" className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="text-white text-sm font-semibold mb-1">Built by Rabindra, Prince & Aditya</h4>
                <p className="text-white/40 text-xs leading-relaxed mb-3">We&apos;re building Zorvai because we believe every student deserves a tutor that actually checks understanding — not just gives answers. Reach out anytime. We respond personally.</p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <a href="https://www.linkedin.com/in/rabindra-shrestha-5079b03b5/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-[#0A66C2]/10 border border-[#0A66C2]/20 text-[#0A66C2] hover:bg-[#0A66C2]/20 hover:border-[#0A66C2]/30 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    LinkedIn
                  </a>
                  <a href="mailto:zorvai246@gmail.com" className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/50 hover:text-white/70 hover:bg-white/10 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    zorvai246@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom links */}
          <div className="text-center">
            <p className="text-white/20 text-xs mb-1">© 2026 Zorvai</p>
            <p className="text-white/15 text-[10px]">
              <a href="/privacy" className="hover:text-white/30 transition-colors">Privacy</a>{" · "}
              <a href="mailto:zorvai246@gmail.com" className="hover:text-white/30 transition-colors">Email</a>{" · "}
              <a href="https://www.linkedin.com/in/rabindra-shrestha-5079b03b5/" target="_blank" rel="noopener noreferrer" className="hover:text-white/30 transition-colors">LinkedIn</a>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
