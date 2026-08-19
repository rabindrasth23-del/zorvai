import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const cookieStore = await cookies();

  // Redundant check: ensures the server strictly bounces unauthenticated users
  // even if the middleware fails or is bypassed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Redundant Recovery Lock Check
  if (cookieStore.get("requires_password_reset")?.value === "true") {
    redirect("/update-password");
  }

  // Onboarding Guard — handles both student and parent roles
  // 1. Fetch current path injected by middleware
  const headersList = await headers();
  const currentPath = headersList.get("x-pathname") || "";
  console.log("[Layout Guard] Current path from x-pathname header:", currentPath);

  // 2. Check if the user exists in students table
  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("id", user.id)
    .single();

  // 3. Check if the user exists in parents table
  const { data: parent } = await supabase
    .from("parents")
    .select("id")
    .eq("id", user.id)
    .single();

  const isStudentOnboarding = currentPath.startsWith("/onboarding");
  const isParentOnboarding = currentPath.startsWith("/parent/onboarding");
  const isParentRoute = currentPath.startsWith("/parent");

  // --- STUDENT PATH ---
  if (student) {
    // Student exists. Don't let them back into onboarding.
    if (isStudentOnboarding) {
      redirect("/dashboard");
    }
    // Students shouldn't access parent routes
    if (isParentRoute) {
      redirect("/dashboard");
    }
    // Otherwise: allow through (dashboard, checkin, etc.)
  }
  // --- PARENT PATH ---
  else if (parent) {
    // Parent row exists (linking is done). Don't let them into parent onboarding again.
    if (isParentOnboarding) {
      redirect("/parent/dashboard");
    }
    // Parents shouldn't access student-only routes like /onboarding or /dashboard (student)
    if (isStudentOnboarding || (!isParentRoute && currentPath === "/dashboard")) {
      redirect("/parent/dashboard");
    }
    // Otherwise: allow through to parent routes
  }
  // --- NEW USER (no student or parent row yet) ---
  else {
    const role = user.user_metadata?.role as string | undefined;

    if (role === "parent") {
      // Parent who hasn't completed parent onboarding yet
      if (!isParentOnboarding) {
        redirect("/parent/onboarding");
      }
    } else {
      // Student who hasn't completed student onboarding yet
      if (!isStudentOnboarding) {
        redirect("/onboarding");
      }
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      <main className="flex-1 flex flex-col w-full">
        {children}
      </main>
    </div>
  );
}
