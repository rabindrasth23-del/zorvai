"use server";

import { createClient } from "@/lib/supabase/server";
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

    // Success
    return { error: null };
  } catch (error) {
    console.error("Unexpected error during onboarding submission:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}
