"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { signupAction } from "@/app/actions/auth";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { GlassInputWrapper, GoogleIcon } from "@/components/ui/auth-components";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm() {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const supabase = createClient();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    shouldFocusError: true, 
  });

  const onSubmit = async (data: SignupFormValues) => {
    setServerError(null);
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("password", data.password);
    
    const result = await signupAction(formData);
    
    if (result?.error) {
      setServerError(result.error);
    } else if (result?.requireEmailConfirmation) {
      setNeedsConfirmation(true);
    }
  };

  const handleGoogleSignIn = async () => {
    setServerError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      }
    });
    if (error) {
      setServerError(error.message);
    }
  };

  if (needsConfirmation) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[var(--color-surface)]/40 backdrop-blur-xl border border-border rounded-[var(--radius-xl)] shadow-lg max-w-md mx-auto text-center gap-4 animate-element">
        <h3 className="font-display font-semibold text-[var(--text-h3)] text-[var(--color-text)]">
          Check your email
        </h3>
        <p className="font-sans text-[var(--text-body)] text-[var(--color-text-muted)]">
          We&apos;ve sent a confirmation link to your email. Please verify your account to continue.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        
        {serverError && (
          <div 
            role="alert"
            className="animate-element animate-delay-200 p-3 bg-[var(--color-destructive)]/10 border border-[var(--color-destructive)]/20 text-[var(--color-destructive)] rounded-2xl text-[var(--text-body-sm)] font-sans"
          >
            {serverError}
          </div>
        )}

        <div className="animate-element animate-delay-300 space-y-1.5">
          <label htmlFor="name" className="text-[var(--text-body-sm)] font-medium text-[var(--color-text-muted)]">
            Full Name
          </label>
          <GlassInputWrapper hasError={!!errors.name}>
            <input
              id="name"
              type="text"
              placeholder="Enter your full name"
              {...register("name")}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
              className="w-full bg-transparent text-[var(--text-body)] text-[var(--color-text)] p-4 rounded-2xl focus:outline-none"
            />
          </GlassInputWrapper>
          {errors.name && (
            <span id="name-error" className="text-[var(--text-caption)] font-sans text-[var(--color-destructive)] block ml-1">
              {errors.name.message}
            </span>
          )}
        </div>

        <div className="animate-element animate-delay-400 space-y-1.5">
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

        <div className="animate-element animate-delay-500 space-y-1.5">
          <label htmlFor="password" className="text-[var(--text-body-sm)] font-medium text-[var(--color-text-muted)]">
            Password
          </label>
          <GlassInputWrapper hasError={!!errors.password}>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                {...register("password")}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : "password-hint"}
                className="w-full bg-transparent text-[var(--text-body)] text-[var(--color-text)] p-4 pr-12 rounded-2xl focus:outline-none"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute inset-y-0 right-3 flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </GlassInputWrapper>
          {errors.password ? (
            <span id="password-error" className="text-[var(--text-caption)] font-sans text-[var(--color-destructive)] block ml-1">
              {errors.password.message}
            </span>
          ) : (
            <span id="password-hint" className="text-[var(--text-caption)] font-sans text-[var(--color-text-muted)] block ml-1">
              Must be at least 6 characters
            </span>
          )}
        </div>

        <div className="animate-element animate-delay-600 space-y-1.5">
          <label htmlFor="confirmPassword" className="text-[var(--text-body-sm)] font-medium text-[var(--color-text-muted)]">
            Confirm Password
          </label>
          <GlassInputWrapper hasError={!!errors.confirmPassword}>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                {...register("confirmPassword")}
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                className="w-full bg-transparent text-[var(--text-body)] text-[var(--color-text)] p-4 pr-12 rounded-2xl focus:outline-none"
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                className="absolute inset-y-0 right-3 flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </GlassInputWrapper>
          {errors.confirmPassword && (
            <span id="confirmPassword-error" className="text-[var(--text-caption)] font-sans text-[var(--color-destructive)] block ml-1">
              {errors.confirmPassword.message}
            </span>
          )}
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="animate-element animate-delay-700 w-full rounded-2xl bg-[var(--color-primary)] py-4 font-medium text-[var(--color-on-primary)] hover:opacity-90 transition-opacity flex justify-center items-center mt-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
              <span className="sr-only" aria-live="polite">Creating account...</span>
              <span aria-hidden="true">Creating account...</span>
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <div className="animate-element animate-delay-[800ms] relative flex items-center justify-center my-6">
        <span className="w-full border-t border-border"></span>
        <span className="px-4 text-[var(--text-caption)] text-[var(--color-text-muted)] bg-[var(--color-bg)] absolute">
          Or continue with
        </span>
      </div>

      <button 
        onClick={handleGoogleSignIn} 
        type="button"
        className="animate-element animate-delay-[900ms] w-full flex items-center justify-center gap-3 border border-border rounded-2xl py-4 hover:bg-[var(--color-surface)] text-[var(--color-text)] font-medium transition-colors"
      >
          <GoogleIcon />
          Continue with Google
      </button>

      <p className="animate-element animate-delay-[1000ms] mt-6 text-center text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
        Already have an account? <Link href="/login" className="text-[var(--color-primary)] font-medium hover:underline transition-colors">Sign In</Link>
      </p>
    </div>
  );
}
