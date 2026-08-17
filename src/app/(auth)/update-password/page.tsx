import { UpdatePasswordForm } from "./update-password-form";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/ui/auth-layout";

export const metadata = {
  title: "Update Password | Zorvai",
  description: "Set a new password for your Zorvai account.",
};

export default async function UpdatePasswordPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  // Server-side guard: if they navigate here manually without a session, boot them.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <AuthLayout 
      title="Update Password"
      description="Please enter your new password below."
      heroImageSrc="/auth-bg.png"
    >
      <UpdatePasswordForm />
    </AuthLayout>
  );
}
