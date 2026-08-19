"use client";

import { useState } from "react";
import { ArrowRight, Share2, CheckCircle2 } from "lucide-react";
import { joinWaitlist } from "@/app/actions/waitlist";

export default function WaitlistForm({ initialCount }: { initialCount: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  const tier1Spots = Math.max(0, 100 - initialCount);
  const tier2Spots = Math.max(0, 500 - Math.max(100, initialCount));
  
  let currentOffer = "";
  let currentDiscount = "";
  
  if (initialCount < 100) {
    currentOffer = `${tier1Spots} spot${tier1Spots === 1 ? '' : 's'} left at 60% off`;
    currentDiscount = "60% off forever";
  } else if (initialCount < 500) {
    currentOffer = `${tier2Spots} spot${tier2Spots === 1 ? '' : 's'} left at 40% off`;
    currentDiscount = "40% off forever";
  } else {
    currentOffer = "Join the waitlist for updates";
    currentDiscount = "Standard pricing";
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    
    // Auto-detect referral code from URL if present
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

  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/join?ref=${referralCode}` : `zorvai.ai/join?ref=${referralCode}`;

  function copyReferral() {
    navigator.clipboard.writeText(referralLink);
    alert("Copied to clipboard!");
  }

  if (success) {
    return (
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] p-[var(--space-8)] shadow-[var(--shadow-md)] text-center max-w-[500px] w-full mx-auto">
        <div className="flex justify-center mb-[var(--space-4)]">
          <CheckCircle2 size={48} className="text-[var(--color-success)]" />
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
            <button 
              onClick={copyReferral}
              className="bg-[var(--color-primary)] text-white px-[var(--space-4)] py-[var(--space-2)] rounded-[var(--radius-sm)] font-sans text-[var(--text-body-sm)] font-semibold hover:bg-[var(--color-primary)]/90 transition-colors cursor-pointer border-none"
            >
              Copy
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-[var(--space-2)] font-sans text-[var(--text-body-sm)] text-[var(--color-text)] font-medium">
          <Share2 size={16} className="text-[var(--color-accent)]" />
          Refer 3 families → your child&apos;s first month free
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[500px] mx-auto">
      <div className="mb-[var(--space-6)] flex justify-center">
        <div className="inline-flex items-center gap-2 bg-[var(--color-accent)]/10 text-[var(--color-accent)] px-[var(--space-4)] py-[var(--space-2)] rounded-[var(--radius-full)] font-sans text-[var(--text-body-sm)] font-bold border border-[var(--color-accent)]/20 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
          {currentOffer}
        </div>
      </div>

      <form action={handleSubmit} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] p-[var(--space-6)] md:p-[var(--space-8)] shadow-[var(--shadow-md)] flex flex-col gap-[var(--space-4)]">
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
            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-[var(--space-4)] py-[var(--space-3)] font-sans text-[var(--text-body)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
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
            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-[var(--space-4)] py-[var(--space-3)] font-sans text-[var(--text-body)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-200 text-left">
            {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full mt-[var(--space-2)] inline-flex items-center justify-center gap-[var(--space-2)] font-sans text-[var(--text-body)] font-semibold text-white bg-[var(--color-primary)] px-[var(--space-8)] py-[var(--space-4)] rounded-[var(--radius-full)] border-none cursor-pointer shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-[1px] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200"
        >
          {loading ? "Joining..." : "Join the Resistance"}
          {!loading && <ArrowRight size={18} />}
        </button>
      </form>

      <div className="mt-[var(--space-6)] flex items-center justify-center gap-[var(--space-2)] font-sans text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
        <Share2 size={16} />
        Refer 3 families → your child&apos;s first month free
      </div>
    </div>
  );
}
