import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { FeedbackPhaseClient } from "@/components/session/feedback-phase-client";

export default async function FeedbackPhasePage({
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
  
  // 1. Fetch Session
  const { data: session, error: sessionError } = await admin
    .from("sessions")
    .select("id, student_id, phase, status, topic")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    throw new Error("Session not found or database error.");
  }

  // 2. Ownership / Security Check
  if (session.student_id !== user.id) {
    redirect("/dashboard");
  }

  // 3. Phase Enforcement
  // Feedback is only accessible when the session is completely 'done'
  if (session.phase !== "done") {
    // If they aren't done, redirect them to whatever phase they are actually in
    redirect(`/session/${sessionId}/${session.phase}`);
  }

  // 4. Fetch the Feedback data from session_results
  const { data: result, error: resultError } = await admin
    .from("session_results")
    .select("understood, missed, review_next, passed")
    .eq("session_id", sessionId)
    .single();

  if (resultError) {
    throw new Error("Failed to load session evaluation results.");
  }

  // Fail-safe default arrays in case of partial/malformed DB rows
  const feedbackData = {
    understood: Array.isArray(result?.understood) ? result.understood : [],
    missed: Array.isArray(result?.missed) ? result.missed : [],
    review_next: Array.isArray(result?.review_next) ? result.review_next : [],
    passed: typeof result?.passed === "boolean" ? result.passed : false,
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[var(--color-bg)]">
      <FeedbackPhaseClient 
        topic={session.topic} 
        feedback={feedbackData} 
      />
    </div>
  );
}
