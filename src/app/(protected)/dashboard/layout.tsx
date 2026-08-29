export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col w-full min-h-screen">
      <div className="flex-1 w-full max-w-[1024px] mx-auto p-4 md:p-8 flex flex-col">
        {children}
      </div>
    </div>
  );
}
