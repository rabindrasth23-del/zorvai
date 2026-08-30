import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_KEY = process.env.WAITLIST_ADMIN_KEY || "zorvai-admin-2026";

export async function GET(request: Request) {
  // Simple password check
  const key = request.headers.get("x-admin-key");
  if (key !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString();

    const [allResult, todayResult, weekResult, paidResult] = await Promise.all([
      admin.from("waitlist").select("*").order("created_at", { ascending: false }),
      admin.from("waitlist").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
      admin.from("waitlist").select("*", { count: "exact", head: true }).gte("created_at", weekStart),
      admin.from("waitlist").select("*", { count: "exact", head: true }).eq("paid", true),
    ]);

    const entries = allResult.data || [];

    // By country
    const byCountry: Record<string, number> = {};
    const byRole: Record<string, number> = {};
    entries.forEach((e) => {
      byCountry[e.country_code] = (byCountry[e.country_code] || 0) + 1;
      byRole[e.role] = (byRole[e.role] || 0) + 1;
    });

    return NextResponse.json({
      entries,
      stats: {
        total: entries.length,
        today: todayResult.count || 0,
        thisWeek: weekResult.count || 0,
        paid: paidResult.count || 0,
        byCountry,
        byRole,
      },
    });
  } catch (err) {
    console.error("Admin error:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
