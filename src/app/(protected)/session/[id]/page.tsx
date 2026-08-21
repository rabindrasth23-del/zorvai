import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export default async function SessionRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const sessionId = resolvedParams.id;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: session, error } = await admin
    .from("sessions")
    .select("id, student_id, phase, status")
    .eq("id", sessionId)
    .single();

  if (error || !session) {
    throw new Error("Session not found or database error.");
  }

  // Ownership Check
  if (session.student_id !== user.id) {
    redirect("/dashboard");
  }

  // Redirect to the current phase of the session
  if (session.status !== "active") {
    redirect(`/dashboard`); // Replace with history later if implemented
  }

  // Validate that the phase is a known phase
  const validPhases = ["learn", "recall", "challenge", "feedback"];
  if (!validPhases.includes(session.phase)) {
    throw new Error(`Invalid session phase: ${session.phase}`);
  }

  redirect(`/session/${sessionId}/${session.phase}`);
}
