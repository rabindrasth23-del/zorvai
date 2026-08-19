/**
 * POST /api/auth/link-parent
 *
 * Creates the `parents` row and `student_parent_links` row.
 * Called from the parent onboarding page after the parent re-enters the invite code.
 *
 * Body: { invite_code: string, name: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse body
    const body = await request.json();
    const inviteCode = (body.invite_code as string)?.trim().toLowerCase();
    const name = (body.name as string)?.trim() || "Parent";

    if (!inviteCode) {
      return NextResponse.json(
        { error: "Invite code is required." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 3. Check if this user already has a parents row
    const { data: existingParent } = await admin
      .from("parents")
      .select("id")
      .eq("id", user.id)
      .single();

    // 4. Validate invite code → find the student
    const { data: student } = await admin
      .from("students")
      .select("id")
      .eq("invite_code", inviteCode)
      .single();

    if (!student) {
      return NextResponse.json(
        {
          error:
            "Invalid invite code. Ask your student to check their dashboard for the correct code.",
        },
        { status: 404 }
      );
    }

    // 5. Check if link already exists
    const { data: existingLink } = await admin
      .from("student_parent_links")
      .select("id")
      .eq("student_id", student.id)
      .eq("parent_id", user.id)
      .single();

    if (existingLink) {
      return NextResponse.json(
        { error: "You are already linked to this student." },
        { status: 409 }
      );
    }

    // 6. Create parents row if it doesn't exist
    if (!existingParent) {
      const { error: parentError } = await admin.from("parents").insert({
        id: user.id,
        name: name,
      });

      if (parentError) {
        console.error("[link-parent] Failed to create parent row:", parentError);
        return NextResponse.json(
          { error: "Failed to create parent profile." },
          { status: 500 }
        );
      }
    }

    // 7. Create the link (student_notified defaults to false — student will see banner)
    const { error: linkError } = await admin
      .from("student_parent_links")
      .insert({
        student_id: student.id,
        parent_id: user.id,
      });

    if (linkError) {
      console.error("[link-parent] Failed to create link:", linkError);
      return NextResponse.json(
        { error: "Failed to link accounts." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[/api/auth/link-parent] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
