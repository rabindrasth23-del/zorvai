import { AdminSidebar } from "@/components/dashboard/admin-sidebar";

/* =============================================================================
   ADMIN LAYOUT
   Route: /admin/*
   Uses darker sidebar + admin-specific navigation
   ============================================================================= */

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--dash-bg)", display: "flex" }}>
      <AdminSidebar />
      <main
        style={{
          flex: 1,
          minHeight: "100vh",
          overflowY: "auto",
          padding: "32px 40px",
          paddingBottom: "100px",
        }}
        className="max-md:!px-4 max-md:!py-5"
      >
        {children}
      </main>
    </div>
  );
}
