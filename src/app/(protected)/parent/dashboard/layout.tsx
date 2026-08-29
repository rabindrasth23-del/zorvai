import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ParentTopNav } from "@/components/dashboard/parent-top-nav";

export default async function ParentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { data: parent } = await admin
    .from("parents")
    .select("name")
    .eq("id", user?.id || "")
    .single();

  return (
    <div className="flex-1 flex flex-col w-full min-h-screen">
      <ParentTopNav parentName={parent?.name || "Parent"} />
      <div className="flex-1 w-full">{children}</div>
    </div>
  );
}
