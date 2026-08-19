"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GlassInputWrapper } from "@/components/ui/auth-components";

export function ParentOnboardingFlow() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = inviteCode.trim().toLowerCase();
    if (!trimmed) {
      setError("Please enter your student's invite code.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Get the current user
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You need to be signed in. Please go back and sign up.");
        setIsSubmitting(false);
        return;
      }

      const userName =
        (user.user_metadata?.full_name as string) || "Parent";

      // 2. Call the server action to create parent row + link
      const res = await fetch("/api/auth/link-parent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_code: trimmed, name: userName }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(
          result.error ||
            "Something went wrong. Please check the invite code and try again."
        );
        setIsSubmitting(false);
        return;
      }

      // 3. Success — redirect to parent dashboard
      router.push("/parent/dashboard");
    } catch {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full">
      {error && (
        <div
          role="alert"
          className="p-3 bg-[var(--color-destructive)]/10 border border-[var(--color-destructive)]/20 text-[var(--color-destructive)] rounded-2xl text-[var(--text-body-sm)] font-sans"
        >
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="inviteCode"
          className="text-[var(--text-body-sm)] font-medium text-[var(--color-text-muted)]"
        >
          Student Invite Code
        </label>
        <GlassInputWrapper hasError={!!error}>
          <input
            id="inviteCode"
            type="text"
            placeholder="Enter the code your student shared with you"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className="w-full bg-transparent text-[var(--text-body)] text-[var(--color-text)] p-4 rounded-2xl focus:outline-none"
            disabled={isSubmitting}
          />
        </GlassInputWrapper>
        <span className="text-[var(--text-caption)] font-sans text-[var(--color-text-muted)] block ml-1">
          Your student can find this code on their dashboard
        </span>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-2xl bg-[var(--color-primary)] py-4 font-medium text-[var(--color-on-primary)] hover:opacity-90 transition-opacity flex justify-center items-center"
      >
        {isSubmitting ? (
          <>
            <Loader2
              className="mr-2 h-5 w-5 animate-spin"
              aria-hidden="true"
            />
            Linking account...
          </>
        ) : (
          "Link to Student"
        )}
      </button>
    </form>
  );
}
