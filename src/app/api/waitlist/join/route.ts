import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name, email, phone, countryCode, city,
      role, childName, childGrade, childSubject,
      referredBy, utmSource, utmMedium, utmCampaign,
    } = body;

    if (!name?.trim() || !email?.trim() || !countryCode) {
      return NextResponse.json(
        { error: "Name, email, and country are required." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Check if already on waitlist
    const { data: existing } = await admin
      .from("waitlist")
      .select("id, referral_code, position, tier, discount_percent, lifetime_discount, child_name")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        ok: true,
        alreadyJoined: true,
        referralCode: existing.referral_code,
        position: existing.position,
        tier: existing.tier,
        discountPercent: existing.discount_percent,
        lifetimeDiscount: existing.lifetime_discount,
        childName: existing.child_name,
      });
    }

    // Insert new signup — trigger handles position, referral code, tier
    const { data, error } = await admin
      .from("waitlist")
      .insert({
        email: email.toLowerCase().trim(),
        name: name.trim(),
        phone: phone || null,
        country_code: countryCode,
        city: city || null,
        role: role || "parent",
        child_name: childName?.trim() || null,
        child_grade: childGrade || null,
        child_subject: childSubject || null,
        referred_by: referredBy || null,
        utm_source: utmSource || null,
        utm_medium: utmMedium || null,
        utm_campaign: utmCampaign || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Process referral if applicable
    if (referredBy) {
      await admin.rpc("process_referral", {
        p_referrer_code: referredBy,
        p_new_signup_id: data.id,
      });
    }

    // Get total count
    const { count: total } = await admin
      .from("waitlist")
      .select("*", { count: "exact", head: true });

    // TODO: Send confirmation email via Resend

    return NextResponse.json({
      ok: true,
      alreadyJoined: false,
      referralCode: data.referral_code,
      position: data.position,
      tier: data.tier,
      discountPercent: data.discount_percent,
      lifetimeDiscount: data.lifetime_discount,
      totalSignups: total,
      name: data.name,
      childName: data.child_name,
    });
  } catch (err) {
    console.error("Waitlist join error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
