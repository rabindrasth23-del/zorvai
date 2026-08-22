"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const checkinSchema = z.object({
  moodText: z.string().min(1, "Please tell us how you're feeling before starting."),
});

export async function submitCheckinAction(payload: z.infer<typeof checkinSchema>) {
  const supabase = await createClient();

  // Validate the payload
  const validatedFields = checkinSchema.safeParse(payload);
  if (!validatedFields.success) {
    return {
      status: "error",
      error: validatedFields.error.issues[0]?.message || "Validation failed",
    };
  }

  const { moodText } = validatedFields.data;

  // 1. Authenticate user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { status: "error", error: "Not authenticated" };
  }

  // 2. Check for active session today (Resume-session guard)
  // We look for a session that is 'active' and was started today.
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: activeSession, error: activeSessionError } = await supabase
    .from("sessions")
    .select("id")
    .eq("student_id", user.id)
    .eq("status", "active")
    .gte("started_at", todayStart.toISOString())
    .maybeSingle();

  if (activeSession) {
    // If there's an active session, we don't log a new check-in or create a new session.
    // We just route them back into it.
    return {
      status: "success",
      session_id: activeSession.id,
      resumed: true,
    };
  }

  // 3. Find active plan for the student
  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("id")
    .eq("student_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  // 4. No active plan → user needs to complete onboarding or generate a plan
  if (!plan?.id) {
    return {
      status: "needs_plan",
      error: "You don't have a study plan yet. Complete your onboarding to get a personalized plan.",
    };
  }

  // 5. Fetch next pending topic
  // Note: For absolute concurrency safety, a Postgres function (RPC) using SELECT FOR UPDATE would be better.
  // For v1, we select the lowest sort_order pending topic.
  const { data: topic, error: topicError } = await supabase
    .from("plan_topics")
    .select("id")
    .eq("plan_id", plan.id)
    .eq("status", "pending")
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (topicError) {
    return { status: "error", error: "Error retrieving topics." };
  }

  if (!topic) {
    // All topics in the current plan are completed — the student genuinely finished.
    return {
      status: "plan_complete",
      error: "You've completed all topics in your current plan! Generate a new plan to keep studying.",
    };
  }

  // 6. Create Check-in and Session
  // We create the session first to get its ID.
  const { data: session, error: sessionInsertError } = await supabase
    .from("sessions")
    .insert({
      student_id: user.id,
      topic_id: topic.id,
      phase: "learn",
      status: "active"
    })
    .select("id")
    .single();

  if (sessionInsertError || !session) {
    return { status: "error", error: "Failed to initialize session." };
  }

  // Insert the checkin linked to the new session
  // We mock the escalation logic to Tier 0 per instructions, but loudly flag it.
  const { error: checkinInsertError } = await supabase
    .from("checkins")
    .insert({
      student_id: user.id,
      session_id: session.id,
      mood_text: moodText,
      escalation_tier: 0,
      escalation_tier_is_mocked: true,
      notification_status: "not_applicable"
    });

  if (checkinInsertError) {
    // We swallow the error for now, but ideally we'd log it.
    console.error("Checkin insert failed:", checkinInsertError);
  }

  return {
    status: "success",
    session_id: session.id,
    resumed: false,
  };
}
