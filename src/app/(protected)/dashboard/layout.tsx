import { TopNav } from "@/components/layout/top-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col w-full min-h-screen">
      <div className="border-b border-border bg-[var(--color-bg)]">
        <TopNav />
      </div>
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col">
        {children}
      </div>
    </div>
  );
}
