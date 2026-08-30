import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 15; // cache 15 seconds

export async function GET() {
  try {
    const admin = createAdminClient();
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

    const [totalResult, recentResult, hourResult] = await Promise.all([
      admin.from("waitlist").select("*", { count: "exact", head: true }),
      admin
        .from("waitlist")
        .select("name, city, country_code, created_at")
        .order("created_at", { ascending: false })
        .limit(15),
      admin
        .from("waitlist")
        .select("*", { count: "exact", head: true })
        .gte("created_at", oneHourAgo),
    ]);

    const total = totalResult.count || 0;
    const tier1Limit = parseInt(process.env.WAITLIST_TIER_1_LIMIT || "100");
    const tier2Limit = parseInt(process.env.WAITLIST_TIER_2_LIMIT || "500");

    const currentTier = total < tier1Limit ? 1 : total < tier2Limit ? 2 : 3;
    const spotsLeft =
      currentTier === 1
        ? tier1Limit - total
        : currentTier === 2
          ? tier2Limit - total
          : null;

    const discountPercent = currentTier === 1 ? 60 : currentTier === 2 ? 40 : 0;

    return NextResponse.json({
      total,
      lastHour: hourResult.count || 0,
      currentTier,
      spotsLeft,
      discountPercent,
      lifetimeDeal: currentTier <= 2,
      recentActivity: (recentResult.data || []).map((r) => ({
        firstName: r.name.split(" ")[0],
        city: r.city,
        country: r.country_code,
        minutesAgo: Math.max(
          1,
          Math.floor((Date.now() - new Date(r.created_at).getTime()) / 60000)
        ),
      })),
    });
  } catch (err) {
    console.error("Stats error:", err);
    return NextResponse.json({
      total: 0,
      lastHour: 0,
      currentTier: 1,
      spotsLeft: 100,
      discountPercent: 60,
    });
  }
}
