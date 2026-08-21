import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  
  const { data: plan } = await admin
    .from("plans")
    .insert({ student_id: user.id })
    .select()
    .single();

  const { data: topic } = await admin
    .from("plan_topics")
    .insert({
      plan_id: plan!.id,
      title: "Photosynthesis",
      description: "How plants make food using sunlight",
      day: 1,
      sort_order: 1
    })
    .select()
    .single();

  const { data: session, error } = await admin
    .from("sessions")
    .insert({
      student_id: user.id,
      topic_id: topic!.id,
      phase: "learn",
      status: "active"
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.redirect(new URL(`/session/${session.id}/learn`, process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));
}
