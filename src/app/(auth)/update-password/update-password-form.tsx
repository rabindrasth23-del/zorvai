"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { updatePasswordAction } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import { GlassInputWrapper } from "@/components/ui/auth-components";

const updatePasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>;

export function UpdatePasswordForm() {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    shouldFocusError: true, 
  });

  const onSubmit = async (data: UpdatePasswordFormValues) => {
    setServerError(null);
    const formData = new FormData();
    formData.append("password", data.password);
    
    const result = await updatePasswordAction(formData);
    
    if (result?.error) {
      setServerError(result.error);
    } else if (result?.redirectTo) {
      router.push(result.redirectTo);
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
          <label htmlFor="password" className="text-[var(--text-body-sm)] font-medium text-[var(--color-text-muted)]">
            New Password
          </label>
          <GlassInputWrapper hasError={!!errors.password}>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your new password"
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

        <div className="animate-element animate-delay-400 space-y-1.5">
          <label htmlFor="confirmPassword" className="text-[var(--text-body-sm)] font-medium text-[var(--color-text-muted)]">
            Confirm New Password
          </label>
          <GlassInputWrapper hasError={!!errors.confirmPassword}>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter your new password"
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
          className="animate-element animate-delay-500 w-full rounded-2xl bg-[var(--color-primary)] py-4 font-medium text-[var(--color-on-primary)] hover:opacity-90 transition-opacity flex justify-center items-center mt-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
              <span className="sr-only" aria-live="polite">Updating password...</span>
              <span aria-hidden="true">Updating password...</span>
            </>
          ) : (
            "Update Password"
          )}
        </button>
      </form>
    </div>
  );
}
