"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runAICall } from "@/lib/ai";
import type { TeachResponse } from "@/lib/ai/schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function fetchTeachLesson(sessionId: string, topic: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // TODO: Add persistence (messages table) here later. Refresh currently loses chat state.

  try {
    const result = await runAICall<TeachResponse>('teach', { topic });
    return { success: true, data: result.data };
  } catch (error: any) {
    console.error("[TeachPhase] runAICall failed:", error);
    return { success: false, error: error.message || "Failed to fetch lesson from AI." };
  }
}

export async function advanceToRecall(sessionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const admin = createAdminClient();
  const { error } = await admin
    .from("sessions")
    .update({ phase: "recall" })
    .eq("id", sessionId)
    .eq("student_id", user.id);

  if (error) {
    throw new Error("Failed to advance session phase.");
  }

  revalidatePath(`/session/${sessionId}`);
  redirect(`/session/${sessionId}/recall`);
}
