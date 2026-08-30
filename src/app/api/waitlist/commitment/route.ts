import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { email, commitmentText, commitmentGoal } = await request.json();

    const admin = createAdminClient();

    const { error } = await admin
      .from("waitlist")
      .update({
        commitment_text: commitmentText,
        commitment_goal: commitmentGoal,
        commitment_made_at: new Date().toISOString(),
      })
      .eq("email", email.toLowerCase().trim());

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Commitment error:", err);
    return NextResponse.json({ error: "Failed to save." }, { status: 500 });
  }
}
