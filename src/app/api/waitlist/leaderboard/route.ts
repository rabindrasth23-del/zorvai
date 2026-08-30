import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 60; // cache 1 minute

export async function GET() {
  try {
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("waitlist")
      .select("name, city, country_code, referral_count, referral_code")
      .gt("referral_count", 0)
      .order("referral_count", { ascending: false })
      .limit(10);

    if (error) throw error;

    return NextResponse.json({
      leaders: (data || []).map((r, i) => ({
        rank: i + 1,
        firstName: r.name.split(" ")[0],
        city: r.city || null,
        country: r.country_code,
        referralCount: r.referral_count,
        anonymizedCode: r.referral_code.slice(0, 3) + "***",
      })),
    });
  } catch {
    return NextResponse.json({ leaders: [] });
  }
}
