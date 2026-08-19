"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function createSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored if called from a Server Component
          }
        },
      },
    }
  );
}

export async function signupAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const role = (formData.get("role") as string) || "student";
  const inviteCode = formData.get("invite_code") as string | null;

  // If signing up as a parent, validate the invite code exists BEFORE creating the auth user
  if (role === "parent") {
    if (!inviteCode || inviteCode.trim().length === 0) {
      return { error: "Invite code is required for parent accounts." };
    }

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const { data: studentRow } = await admin
      .from("students")
      .select("id")
      .eq("invite_code", inviteCode.trim().toLowerCase())
      .single();

    if (!studentRow) {
      return { error: "Invalid invite code. Ask your student to share their code from their dashboard." };
    }
  }

  const supabase = await createSupabaseServer();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        role: role,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If a session isn't returned, Supabase requires email confirmation
  if (!data.session) {
    return { success: true, requireEmailConfirmation: true };
  }

  // Session exists — auto-confirmed, redirect based on role
  if (role === "parent") {
    return { success: true, redirectTo: "/parent/onboarding" };
  }
  return { success: true, redirectTo: "/onboarding" };
}

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createSupabaseServer();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.includes("Email not confirmed")) {
      return { error: "Please check your email and click the confirmation link before signing in." };
    }
    return { error: "Invalid email or password." };
  }

  // Success — tell client to redirect
  return { success: true, redirectTo: "/dashboard" };
}

export async function resetPasswordAction(formData: FormData) {
  const email = formData.get("email") as string;

  const supabase = await createSupabaseServer();

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/api/auth/callback?next=/update-password`,
  });

  if (error) {
    console.error("Password reset error:", error);
  }

  // ALWAYS return success to the client (prevents email enumeration)
  return { success: true };
}

export async function updatePasswordAction(formData: FormData) {
  const password = formData.get("password") as string;

  const supabase = await createSupabaseServer();
  const cookieStore = await cookies();

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return { error: error.message };
  }

  // Clear the recovery lock cookie
  cookieStore.delete("requires_password_reset");

  return { success: true, redirectTo: "/dashboard" };
}

export async function logoutAction() {
  const supabase = await createSupabaseServer();

  await supabase.auth.signOut();

  return { success: true, redirectTo: "/login" };
}
