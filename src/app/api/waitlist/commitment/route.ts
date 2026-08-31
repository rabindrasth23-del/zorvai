import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const {
      email,
      commitmentSubject,
      commitmentGoal,
      commitmentText,
      chosenPlan,
      planPriceUsd,
      planOriginalPrice,
    } = await request.json();

    const admin = createAdminClient();

    const { error } = await admin
      .from("waitlist")
      .update({
        commitment_subject: commitmentSubject || null,
        commitment_text: commitmentText || null,
        commitment_goal: commitmentGoal || null,
        commitment_made_at: new Date().toISOString(),
        chosen_plan: chosenPlan || null,
        plan_price_usd: planPriceUsd || null,
        plan_original_price_usd: planOriginalPrice || null,
      })
      .eq("email", email.toLowerCase().trim());

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Commitment error:", err);
    return NextResponse.json({ error: "Failed to save." }, { status: 500 });
  }
}
