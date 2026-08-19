/**
 * POST /api/auth/dismiss-link-notification
 *
 * Sets student_notified=true on a student_parent_links row
 * so the student dashboard stops showing the "a parent linked" banner.
 *
 * Body: { link_id: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const linkId = body.link_id as string;

    if (!linkId) {
      return NextResponse.json(
        { error: "link_id is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Only allow the student to dismiss their own link notification
    const { error } = await admin
      .from("student_parent_links")
      .update({ student_notified: true })
      .eq("id", linkId)
      .eq("student_id", user.id);

    if (error) {
      console.error("[dismiss-link-notification] Error:", error);
      return NextResponse.json(
        { error: "Failed to dismiss notification" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[dismiss-link-notification] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
