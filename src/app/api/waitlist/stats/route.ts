import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 15; // cache 15 seconds

export async function GET() {
  try {
    const admin = createAdminClient();
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

    const [totalResult, recentResult, hourResult, leaderResult] = await Promise.all([
      admin.from("waitlist").select("*", { count: "exact", head: true }),
      admin
        .from("waitlist")
        .select("name, city, country_code, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      admin
        .from("waitlist")
        .select("*", { count: "exact", head: true })
        .gte("created_at", oneHourAgo),
      admin
        .from("waitlist")
        .select("name, city, country_code, referral_count")
        .gt("referral_count", 0)
        .order("referral_count", { ascending: false })
        .limit(5),
    ]);

    const total = totalResult.count || 0;
    const spotsLeft = Math.max(0, parseInt(process.env.WAITLIST_TOTAL_SPOTS || "500") - total);

    return NextResponse.json({
      total,
      lastHour: hourResult.count || 0,
      spotsLeft,
      discountPercent: 60,
      lifetimeDeal: true,
      recentActivity: (recentResult.data || []).map((r) => ({
        firstName: r.name.split(" ")[0],
        city: r.city,
        country: r.country_code,
        minutesAgo: Math.max(
          1,
          Math.floor((Date.now() - new Date(r.created_at).getTime()) / 60000)
        ),
      })),
      leaders: (leaderResult.data || []).map((r, i) => ({
        rank: i + 1,
        firstName: r.name.split(" ")[0],
        city: r.city,
        country: r.country_code,
        referralCount: r.referral_count,
      })),
    });
  } catch (err) {
    console.error("Stats error:", err);
    return NextResponse.json({
      total: 0,
      lastHour: 0,
      spotsLeft: 500,
      discountPercent: 60,
      lifetimeDeal: true,
      recentActivity: [],
      leaders: [],
    });
  }
}
