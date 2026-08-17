"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function signupAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  const cookieStore = await cookies();

  const supabase = createServerClient(
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
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
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

  // Redirect to onboarding on success if no confirmation needed
  redirect("/onboarding");
}

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const cookieStore = await cookies();

  const supabase = createServerClient(
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
          } catch (error) {
            // Ignored if called from a Server Component
          }
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.includes("Email not confirmed")) {
      return { error: "Please verify your email address to sign in." };
    }
    // Verified: Brief §1.2 strictly demands a generic error for security
    return { error: "Invalid email or password" };
  }

  // Redirect to dashboard on successful login
  redirect("/dashboard");
}

export async function resetPasswordAction(formData: FormData) {
  const email = formData.get("email") as string;
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // not required for this action
        }
      }
    }
  );

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/api/auth/callback?next=/update-password`,
  });

  // Brief §1.3: "Request-reset screen must show the same confirmation message 
  // whether or not the account exists, for security."
  // 
  // Supabase's PKCE resetPasswordForEmail does NOT leak user existence by default. 
  // It returns success even if the email is unregistered.
  // Additionally, if any internal service error occurs (like rate limiting), 
  // we catch it here and still return true (or a generic rate-limit message) 
  // to avoid exposing any logic. 
  
  if (error) {
    // We intentionally swallow generic errors to prevent enumeration, 
    // but log them server-side for debugging.
    console.error("Password reset error:", error);
  }

  // ALWAYS return success to the client
  return { success: true };
}

export async function updatePasswordAction(formData: FormData) {
  const password = formData.get("password") as string;
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {}
        }
      }
    }
  );

  const { error } = await supabase.auth.updateUser({
    password: password
  });

  if (error) {
    return { error: error.message };
  }

  // Clear the recovery lock cookie
  cookieStore.delete("requires_password_reset");

  redirect("/dashboard");
}

export async function logoutAction() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {}
        }
      }
    }
  );

  await supabase.auth.signOut();
  redirect("/login");
}
