"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ArrowRight, Share2, CheckCircle2, Loader2 } from "lucide-react";
import { joinWaitlist } from "@/app/actions/waitlist";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://zorvai.ca";

export default function WaitlistForm({ initialCount }: { initialCount: number }) {
  const shouldReduceMotion = useReducedMotion();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  const tier1Spots = Math.max(0, 100 - initialCount);
  const tier2Spots = Math.max(0, 500 - Math.max(100, initialCount));
  
  let currentOffer = "";
  
  if (initialCount < 100) {
    currentOffer = `${tier1Spots} spot${tier1Spots === 1 ? '' : 's'} left at 60% off`;
  } else if (initialCount < 500) {
    currentOffer = `${tier2Spots} spot${tier2Spots === 1 ? '' : 's'} left at 40% off`;
  } else {
    currentOffer = "Join the waitlist for updates";
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get("ref");
    if (ref) {
      formData.append("referred_by", ref);
    }

    const result = await joinWaitlist(formData);
    
    setLoading(false);
    
    if (result.error) {
      setError(result.error);
    } else if (result.success) {
      setSuccess(true);
      setReferralCode(result.referralCode || "");
    }
  }

  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/join?ref=${referralCode}`
    : `${SITE_URL}/join?ref=${referralCode}`;

  function copyReferral() {
    navigator.clipboard.writeText(referralLink);
    alert("Copied to clipboard!");
  }

  // Animation variants
  const fadeOut = shouldReduceMotion ? undefined : { opacity: 0, y: -12, transition: { duration: 0.25 } };
  const fadeIn = shouldReduceMotion ? undefined : { opacity: 0, y: 12 };
  const fadeVisible = shouldReduceMotion
    ? undefined
    : { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const } };

  return (
    <div className="w-full max-w-[500px] mx-auto">
      <div className="mb-[var(--space-6)] flex justify-center">
        <div className="inline-flex items-center gap-2 bg-[var(--color-accent)]/10 text-[var(--color-accent)] px-[var(--space-4)] py-[var(--space-2)] rounded-[var(--radius-full)] font-sans text-[var(--text-body-sm)] font-bold border border-[var(--color-accent)]/20 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
          {currentOffer}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {success ? (
          /* ═══ Success State ═══ */
          <motion.div
            key="success"
            initial={fadeIn}
            animate={fadeVisible}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] p-[var(--space-8)] shadow-[var(--shadow-md)] text-center"
          >
            <div className="flex justify-center mb-[var(--space-4)]">
              <motion.div
                initial={shouldReduceMotion ? false : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.15 }}
              >
                <CheckCircle2 size={48} className="text-[var(--color-success)]" />
              </motion.div>
            </div>
            <h3 className="font-sans text-[var(--text-h3)] font-bold text-[var(--color-text)] mb-[var(--space-2)]">
              You&apos;re on the list!
            </h3>
            <p className="font-sans text-[var(--text-body)] text-[var(--color-text-muted)] mb-[var(--space-6)]">
              You&apos;ve secured your spot. Want to move up and get your first month free?
            </p>
            
            <div className="bg-[var(--color-muted)] p-[var(--space-4)] rounded-[var(--radius-md)] mb-[var(--space-6)] text-left">
              <div className="font-sans text-[var(--text-caption)] font-bold text-[var(--color-text-muted)] uppercase tracking-wide mb-[var(--space-2)]">
                Your unique referral link
              </div>
              <div className="flex items-center gap-[var(--space-2)]">
                <code className="flex-1 bg-[var(--color-surface)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-sm)] border border-[var(--color-border)] font-mono text-[var(--text-body-sm)] text-[var(--color-text)] truncate">
                  {referralLink}
                </code>
                <motion.button 
                  onClick={copyReferral}
                  whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                  className="bg-[var(--color-primary)] text-white px-[var(--space-4)] py-[var(--space-2)] rounded-[var(--radius-sm)] font-sans text-[var(--text-body-sm)] font-semibold hover:bg-[var(--color-primary)]/90 transition-colors cursor-pointer border-none"
                >
                  Copy
                </motion.button>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-[var(--space-2)] font-sans text-[var(--text-body-sm)] text-[var(--color-text)] font-medium">
              <Share2 size={16} className="text-[var(--color-accent)]" />
              Refer 3 families → your child&apos;s first month free
            </div>
          </motion.div>
        ) : (
          /* ═══ Form State ═══ */
          <motion.div
            key="form"
            exit={fadeOut}
          >
            <form action={handleSubmit} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] p-[var(--space-6)] md:p-[var(--space-8)] shadow-[var(--shadow-md)] flex flex-col gap-[var(--space-4)] hover:shadow-[var(--shadow-lg)] transition-shadow duration-300">
              <div>
                <label htmlFor="email" className="block text-left font-sans text-[var(--text-body-sm)] font-semibold text-[var(--color-text)] mb-[var(--space-2)]">
                  Email address <span className="text-[var(--color-accent)]">*</span>
                </label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  required 
                  placeholder="parent@example.com"
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-[var(--space-4)] py-[var(--space-3)] font-sans text-[var(--text-body)] text-[var(--color-text)] outline-none transition-all duration-200 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:shadow-[0_0_0_3px_rgba(27,79,92,0.08)]"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-left font-sans text-[var(--text-body-sm)] font-semibold text-[var(--color-text)] mb-[var(--space-2)]">
                  Phone number (WhatsApp)
                </label>
                <input 
                  type="tel" 
                  id="phone" 
                  name="phone" 
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-[var(--space-4)] py-[var(--space-3)] font-sans text-[var(--text-body)] text-[var(--color-text)] outline-none transition-all duration-200 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:shadow-[0_0_0_3px_rgba(27,79,92,0.08)]"
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={shouldReduceMotion ? false : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-200 text-left overflow-hidden"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button 
                type="submit" 
                disabled={loading}
                whileHover={shouldReduceMotion || loading ? {} : { scale: 1.02 }}
                whileTap={shouldReduceMotion || loading ? {} : { scale: 0.98 }}
                className="w-full mt-[var(--space-2)] inline-flex items-center justify-center gap-[var(--space-2)] font-sans text-[var(--text-body)] font-semibold text-white bg-[var(--color-primary)] px-[var(--space-8)] py-[var(--space-4)] rounded-[var(--radius-full)] border-none cursor-pointer shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] disabled:opacity-70 disabled:cursor-not-allowed transition-shadow duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    Join the Resistance
                    <ArrowRight size={18} />
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-[var(--space-6)] flex items-center justify-center gap-[var(--space-2)] font-sans text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
        <Share2 size={16} />
        Refer 3 families → your child&apos;s first month free
      </div>
    </div>
  );
}
