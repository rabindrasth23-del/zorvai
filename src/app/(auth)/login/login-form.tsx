"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { loginAction } from "@/app/actions/auth";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { GlassInputWrapper, GoogleIcon } from "@/components/ui/auth-components";

// --- SCHEMA ---
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"), 
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const supabase = createClient();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    shouldFocusError: true, 
  });

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);
    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("password", data.password);
    
    const result = await loginAction(formData);
    
    if (result?.error) {
      setServerError(result.error);
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

        <div className="animate-element animate-delay-400 space-y-1.5">
          <label htmlFor="password" className="text-[var(--text-body-sm)] font-medium text-[var(--color-text-muted)]">
            Password
          </label>
          <GlassInputWrapper hasError={!!errors.password}>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                {...register("password")}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
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
          {errors.password && (
            <span id="password-error" className="text-[var(--text-caption)] font-sans text-[var(--color-destructive)] block ml-1">
              {errors.password.message}
            </span>
          )}
        </div>

        <div className="animate-element animate-delay-500 flex items-center justify-end text-sm mt-2">
          <Link 
            href="/reset-password" 
            className="text-[var(--color-primary)] hover:underline transition-colors font-medium"
          >
            Forgot password?
          </Link>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="animate-element animate-delay-600 w-full rounded-2xl bg-[var(--color-primary)] py-4 font-medium text-[var(--color-on-primary)] hover:opacity-90 transition-opacity flex justify-center items-center"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
              <span className="sr-only" aria-live="polite">Signing in...</span>
              <span aria-hidden="true">Signing in...</span>
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <div className="animate-element animate-delay-700 relative flex items-center justify-center my-6">
        <span className="w-full border-t border-border"></span>
        <span className="px-4 text-[var(--text-caption)] text-[var(--color-text-muted)] bg-[var(--color-bg)] absolute">
          Or continue with
        </span>
      </div>

      <button 
        onClick={handleGoogleSignIn} 
        type="button"
        className="animate-element animate-delay-800 w-full flex items-center justify-center gap-3 border border-border rounded-2xl py-4 hover:bg-[var(--color-surface)] text-[var(--color-text)] font-medium transition-colors"
      >
          <GoogleIcon />
          Continue with Google
      </button>

      <p className="animate-element animate-delay-900 mt-6 text-center text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
        New to Zorvai? <Link href="/signup" className="text-[var(--color-primary)] font-medium hover:underline transition-colors">Create Account</Link>
      </p>
    </div>
  );
}
