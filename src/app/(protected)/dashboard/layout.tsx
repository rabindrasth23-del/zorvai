import { createClient } from "@/lib/supabase/server";
import { StudentTopNav } from "@/components/dashboard/student-top-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let studentName = "Student";
  if (user) {
    const { data: student } = await supabase
      .from("students")
      .select("name")
      .eq("id", user.id)
      .single();
    studentName = student?.name || "Student";
  }

  return (
    <div className="flex-1 flex flex-col w-full min-h-screen">
      <StudentTopNav
        studentName={studentName}
        email={user?.email || ""}
      />
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col">
        {children}
      </div>
    </div>
  );
}
