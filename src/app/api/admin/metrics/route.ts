import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin-config";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const admin = createAdminClient();
    
    // Fetch logs from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: logs, error: logsError } = await admin
      .from("ai_provider_logs")
      .select("provider, call_type, latency_ms, success, created_at")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    if (logsError) {
      throw logsError;
    }

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error("[/api/admin/metrics] Error fetching metrics:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
