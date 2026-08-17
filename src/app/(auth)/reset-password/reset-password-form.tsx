"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { resetPasswordAction } from "@/app/actions/auth";
import Link from "next/link";
import { GlassInputWrapper } from "@/components/ui/auth-components";

const resetRequestSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ResetRequestFormValues = z.infer<typeof resetRequestSchema>;

export function ResetPasswordForm() {
  const [success, setSuccess] = React.useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetRequestFormValues>({
    resolver: zodResolver(resetRequestSchema),
    shouldFocusError: true, 
  });

  const onSubmit = async (data: ResetRequestFormValues) => {
    const formData = new FormData();
    formData.append("email", data.email);
    
    // Always returns success: true, as enforced in auth.ts
    await resetPasswordAction(formData);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[var(--color-surface)]/40 backdrop-blur-xl border border-border rounded-[var(--radius-xl)] shadow-lg max-w-md mx-auto text-center gap-4 animate-element">
        <h3 className="font-display font-semibold text-[var(--text-h3)] text-[var(--color-text)]">
          Check your email
        </h3>
        <p className="font-sans text-[var(--text-body)] text-[var(--color-text-muted)]">
          If an account exists for that email, we&apos;ve sent password reset instructions.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="animate-element animate-delay-300 space-y-1.5">
          <label htmlFor="email" className="text-[var(--text-body-sm)] font-medium text-[var(--color-text-muted)]">
            Email Address
          </label>
          <GlassInputWrapper hasError={!!errors.email}>
            <input
              id="email"
              type="email"
              placeholder="Enter your email address"
              {...register("email")}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              className="w-full bg-transparent text-[var(--text-body)] text-[var(--color-text)] p-4 rounded-2xl focus:outline-none"
            />
          </GlassInputWrapper>
          {errors.email && (
            <span id="email-error" className="text-[var(--text-caption)] font-sans text-[var(--color-destructive)] block ml-1">
              {errors.email.message}
            </span>
          )}
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="animate-element animate-delay-400 w-full rounded-2xl bg-[var(--color-primary)] py-4 font-medium text-[var(--color-on-primary)] hover:opacity-90 transition-opacity flex justify-center items-center mt-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
              <span className="sr-only" aria-live="polite">Sending instructions...</span>
              <span aria-hidden="true">Sending instructions...</span>
            </>
          ) : (
            "Send Reset Link"
          )}
        </button>
      </form>

      <p className="animate-element animate-delay-500 mt-6 text-center text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
        Remembered your password? <Link href="/login" className="text-[var(--color-primary)] font-medium hover:underline transition-colors">Sign In</Link>
      </p>
    </div>
  );
}
