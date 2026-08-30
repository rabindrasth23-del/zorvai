import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { referralCode } = await request.json();
    if (!referralCode) {
      return NextResponse.json({ error: "Missing referral code." }, { status: 400 });
    }

    const admin = createAdminClient();

    // Track the referral click (not yet converted — conversion happens at signup)
    await admin.from("waitlist_referral_events").insert({
      referral_code: referralCode,
      converted: false,
    });

    // Get referrer info for personalization
    const { data: referrer } = await admin
      .from("waitlist")
      .select("name, city, country_code")
      .eq("referral_code", referralCode)
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      referrerName: referrer?.name?.split(" ")[0] || null,
    });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
