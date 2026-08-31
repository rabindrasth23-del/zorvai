import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const {
      email,
      childName,
      commitmentSubject,
      commitmentGoal,
      commitmentText,
      signatureDataUrl,
      chosenPlan,
      planPriceUsd,
      planOriginalPrice,
    } = await request.json();

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("waitlist")
      .update({
        child_name: childName || null,
        commitment_subject: commitmentSubject || null,
        commitment_text: commitmentText || null,
        commitment_goal: commitmentGoal || null,
        commitment_made_at: new Date().toISOString(),
        signature_data_url: signatureDataUrl || null,
        chosen_plan: chosenPlan || null,
        plan_price_usd: planPriceUsd || null,
        plan_original_price_usd: planOriginalPrice || null,
      })
      .eq("email", email.toLowerCase().trim())
      .select("referral_code, position")
      .single();

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      referralCode: data.referral_code,
      position: data.position,
    });
  } catch (err) {
    console.error("Commitment error:", err);
    return NextResponse.json({ error: "Failed to save." }, { status: 500 });
  }
}
