import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { LearnPhaseClient } from "@/components/session/learn-phase-client";

export default async function LearnPhasePage({
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
    .select(`
      id, 
      student_id, 
      phase, 
      status, 
      topic_id,
      plan_topics (title)
    `)
    .eq("id", sessionId)
    .single();

  if (error || !session) {
    throw new Error("Session not found or database error.");
  }

  // 1. Ownership / Security Check
  if (session.student_id !== user.id) {
    redirect("/dashboard");
  }

  // 2. Phase Enforcement (Prevents replaying a past phase)
  if (session.status !== "active") {
    redirect(`/dashboard/history`);
  }

  if (session.phase !== "learn") {
    redirect(`/session/${sessionId}/${session.phase}`);
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[var(--color-bg)]">
      <LearnPhaseClient 
        sessionId={session.id} 
        topicId={session.topic_id} 
        topicTitle={Array.isArray(session.plan_topics) ? (session.plan_topics[0] as any)?.title : (session.plan_topics as any)?.title || "Unknown Topic"}
      />
    </div>
  );
}
