"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runAICall } from "@/lib/ai";
import type { TeachResponse } from "@/lib/ai/schema";
import type { KeyConceptsExtractResponse } from "@/lib/ai/schema";
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

  // 1. Verify session ownership + get topic info
  const { data: session } = await admin
    .from("sessions")
    .select("id, student_id, topic_id, plan_topics(title, description)")
    .eq("id", sessionId)
    .eq("student_id", user.id)
    .single();

  if (!session) throw new Error("Session not found");

  // 2. Extract key_concepts from conversation history (background, non-blocking)
  try {
    const { data: messages } = await admin
      .from("session_messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (messages && messages.length > 0) {
      const topicData = Array.isArray(session.plan_topics)
        ? session.plan_topics[0]
        : session.plan_topics;

      const topic = {
        title: (topicData as { title: string })?.title || "Unknown Topic",
        description: (topicData as { description?: string })?.description || "",
      };

      const conversationHistory = messages.map(m => ({
        role: m.role as "user" | "ai",
        content: m.content,
      }));

      const result = await runAICall<KeyConceptsExtractResponse>("key_concepts_extract", {
        topic,
        conversationHistory,
      });

      // Store key_concepts in session_results
      // Upsert: create if not exists, update if exists
      const { data: existing } = await admin
        .from("session_results")
        .select("id")
        .eq("session_id", sessionId)
        .maybeSingle();

      if (existing) {
        await admin
          .from("session_results")
          .update({ understood: result.data.key_concepts })
          .eq("session_id", sessionId);
      } else {
        await admin.from("session_results").insert({
          session_id: sessionId,
          understood: result.data.key_concepts,
        });
      }

      console.log(
        `[advanceToRecall] Extracted ${result.data.key_concepts.length} key concepts for session ${sessionId}`
      );
    }
  } catch (err) {
    // key_concepts extraction failure should not block phase advance
    console.error("[advanceToRecall] Key concepts extraction failed:", err);
  }

  // 3. Delete uploaded files from Supabase Storage
  try {
    const { data: attachments } = await admin
      .from("session_messages")
      .select("attachment_url")
      .eq("session_id", sessionId)
      .not("attachment_url", "is", null);

    if (attachments && attachments.length > 0) {
      // Extract storage paths from URLs
      // URLs are like: .../storage/v1/object/public/session-uploads/SESSION_ID/FILENAME
      // We need the path after the bucket name: SESSION_ID/FILENAME
      const filePaths = attachments
        .map(a => {
          const url = a.attachment_url as string;
          const bucketMarker = "session-uploads/";
          const idx = url.indexOf(bucketMarker);
          if (idx !== -1) {
            return url.slice(idx + bucketMarker.length);
          }
          // Fallback: if URL is already a path
          return url;
        })
        .filter(Boolean);

      if (filePaths.length > 0) {
        const { error: deleteError } = await admin.storage
          .from("session-uploads")
          .remove(filePaths);

        if (deleteError) {
          console.error("[advanceToRecall] Storage deletion error:", deleteError);
        } else {
          console.log(
            `[advanceToRecall] Deleted ${filePaths.length} files from storage for session ${sessionId}`
          );
        }
      }

      // 4. Null out attachment_url on session_messages so restored conversations
      // don't show broken thumbnails
      await admin
        .from("session_messages")
        .update({ attachment_url: null })
        .eq("session_id", sessionId)
        .not("attachment_url", "is", null);
    }
  } catch (err) {
    // File cleanup failure should not block phase advance
    console.error("[advanceToRecall] File cleanup failed:", err);
  }

  // 5. Advance session phase
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

