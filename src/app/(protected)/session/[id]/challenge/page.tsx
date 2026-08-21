import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { ChallengePhaseClient } from "@/components/session/challenge-phase-client";

export default async function ChallengePhasePage({
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
    .select("id, student_id, phase, status, topic")
    .eq("id", sessionId)
    .single();

  if (error || !session) {
    throw new Error("Session not found or database error.");
  }

  // 1. Ownership / Security Check
  if (session.student_id !== user.id) {
    redirect("/dashboard");
  }

  // 2. Phase Enforcement (Prevents replaying past phases)
  if (session.status !== "active") {
    // If completed/done, redirect to feedback or history
    redirect(`/dashboard/history`);
  }

  if (session.phase !== "challenge") {
    // Forward or backward redirect to the actual phase
    redirect(`/session/${sessionId}/${session.phase}`);
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[var(--color-bg)]">
      <ChallengePhaseClient 
        sessionId={session.id} 
        topic={session.topic} 
      />
    </div>
  );
}
