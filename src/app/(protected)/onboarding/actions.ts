"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runAICall } from "@/lib/ai";
import type { PlanResponse } from "@/lib/ai/schema";
import { z } from "zod";

const onboardingSchema = z.object({
  name: z.string().min(1, "Name is required"),
  field: z.string().min(1, "Field is required"),
  country: z.string().min(1, "Country is required"),
  timezone: z.string().min(1, "Timezone is required"),
  educationLevel: z.enum(["Middle School", "High School", "University", "Professional or Self-Study"]),
  subjects: z.array(z.string()).min(1, "At least one subject is required"),
  language: z.string().min(1, "Language is required"),
  studyHoursPerDay: z.number().min(0.5).max(8.0),
});

export type OnboardingPayload = z.infer<typeof onboardingSchema>;

export async function submitOnboardingAction(payload: OnboardingPayload) {
  try {
    // 1. Validate payload on the server
    const parsed = onboardingSchema.safeParse(payload);
    if (!parsed.success) {
      console.error("Server validation failed:", parsed.error.format());
      return { error: "Invalid data submitted. Please check your inputs and try again." };
    }
    
    const validData = parsed.data;
    const supabase = await createClient();
    
    // 2. Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { error: "Authentication failed. Please log in again." };
    }

    // 3. Upsert into the students table
    const { error: upsertError } = await supabase
      .from('students')
      .upsert({
        id: user.id,
        name: validData.name.trim(),
        country: validData.country,
        field: validData.field.trim(),
        language: validData.language,
        study_hours_per_day: validData.studyHoursPerDay,
        timezone: validData.timezone,
        subjects: validData.subjects,
        education_level: validData.educationLevel,
      }, { onConflict: 'id' });

    if (upsertError) {
      console.error("Failed to upsert student record:", upsertError);
      return { error: "Failed to save your profile. Please try again." };
    }

    // 4. Generate a real study plan via the AI engine (blocking — Option A)
    //    This is the same pipeline as /api/study-plan: runAICall → plans → plan_topics.
    //    The user sees "Generating your study plan..." in the UI during this call.
    const admin = createAdminClient();

    try {
      // Deactivate any existing plans (idempotency for re-onboarding)
      await admin
        .from('plans')
        .update({ is_active: false })
        .eq('student_id', user.id)
        .eq('is_active', true);

      // Call the real AI engine — full provider chain, Zod validation, logging
      const result = await runAICall<PlanResponse>('plan', {
        student: {
          name: validData.name.trim(),
          country: validData.country,
          field: validData.field.trim(),
          language: validData.language,
          studyHoursPerDay: validData.studyHoursPerDay,
          timezone: validData.timezone,
        },
        subjects: validData.subjects,
        deadline: undefined,
      });

      // Insert the new plan
      const { data: newPlan, error: planError } = await admin
        .from('plans')
        .insert({
          student_id: user.id,
          raw_response: result.data,
          is_active: true,
        })
        .select('id')
        .single();

      if (planError || !newPlan) {
        console.error("[Onboarding] Failed to insert plan:", planError);
        return { error: null, planFailed: true };
      }

      // Insert normalized plan_topics
      const topicRows = result.data.topics.map((topic, index) => ({
        plan_id: newPlan.id,
        title: topic.title,
        description: topic.description,
        day: topic.day,
        sort_order: index + 1,
        status: 'pending' as const,
      }));

      const { error: topicsError } = await admin
        .from('plan_topics')
        .insert(topicRows);

      if (topicsError) {
        console.error("[Onboarding] Failed to insert plan_topics:", topicsError);
        // Clean up orphan plan
        await admin.from('plans').delete().eq('id', newPlan.id);
        return { error: null, planFailed: true };
      }

      console.log(`[Onboarding] Plan generated for ${user.id}: ${topicRows.length} topics, provider=${result.provider}`);

    } catch (aiError) {
      // Plan generation failed but profile was saved — user can retry from check-in
      console.error("[Onboarding] AI plan generation failed:", aiError);
      return { error: null, planFailed: true };
    }

    // Success — profile saved AND plan generated
    return { error: null };
  } catch (error) {
    console.error("Unexpected error during onboarding submission:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}
