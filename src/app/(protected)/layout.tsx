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

  // Onboarding Guard
  // 1. Fetch current path injected by middleware
  const headersList = await headers();
  const currentPath = headersList.get("x-pathname") || "";
  console.log("[Layout Guard] Current path from x-pathname header:", currentPath);

  // 2. Check if the user has completed onboarding (exists in students table)
  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("id", user.id)
    .single();

  const isOnboardingRoute = currentPath.startsWith("/onboarding");

  if (!student && !isOnboardingRoute) {
    redirect("/onboarding");
  }

  if (student && isOnboardingRoute) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      <main className="flex-1 flex flex-col w-full">
        {children}
      </main>
    </div>
  );
}
