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

  let activePlanId = plan?.id;

  // 4. Stub Plan Maker if no plan exists
  if (!activePlanId) {
    // TODO(PLAN-MAKER-STUB): Remove this when the real Plan Maker is built!
    // We are injecting a dummy plan and dummy topics so Check-in has something to pull from.
    const { data: dummyPlan, error: dummyPlanError } = await supabase
      .from("plans")
      .insert({
        student_id: user.id,
        is_active: true,
        raw_response: { note: "DUMMY PLAN FROM CHECKIN STUB" }
      })
      .select("id")
      .single();
    
    if (dummyPlanError || !dummyPlan) {
      return { status: "error", error: "Failed to create dummy plan." };
    }

    activePlanId = dummyPlan.id;

    // Insert dummy topics
    await supabase.from("plan_topics").insert([
      { plan_id: activePlanId, title: "Basics of Algebra", day: 1, sort_order: 1, status: "pending" },
      { plan_id: activePlanId, title: "Solving Equations", day: 1, sort_order: 2, status: "pending" },
      { plan_id: activePlanId, title: "Graphing Lines", day: 2, sort_order: 3, status: "pending" },
    ]);
  }

  // 5. Fetch next pending topic
  // Note: For absolute concurrency safety, a Postgres function (RPC) using SELECT FOR UPDATE would be better.
  // For v1, we select the lowest sort_order pending topic.
  let { data: topic, error: topicError } = await supabase
    .from("plan_topics")
    .select("id")
    .eq("plan_id", activePlanId)
    .eq("status", "pending")
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (topicError) {
    return { status: "error", error: "Error retrieving topics." };
  }

  if (!topic) {
    // TODO(PLAN-MAKER-STUB): Remove this when the real Plan Maker is built!
    // For testing purposes, if the user finishes all topics in the dummy plan, 
    // we reset them to "pending" so they can continue testing the session flow.
    await supabase.from("plan_topics").update({ status: "pending" }).eq("plan_id", activePlanId);

    const { data: retryTopic } = await supabase
      .from("plan_topics")
      .select("id")
      .eq("plan_id", activePlanId)
      .eq("status", "pending")
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
      
    topic = retryTopic;

    if (!topic) {
      // Queue is truly exhausted / no pending topics left.
      return {
        status: "empty_queue",
        error: "You've finished your current plan! Generate a new one to continue studying."
      };
    }
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
