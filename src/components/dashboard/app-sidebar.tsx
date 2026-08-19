"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  BookOpen, 
  History, 
  Settings, 
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const studentNavItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/subjects", label: "Subjects", icon: BookOpen },
  { href: "/dashboard/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="font-display font-bold text-xl text-[var(--color-primary)]">
          Zorvai
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 -mr-2 text-[var(--color-text)]"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-[73px] left-0 right-0 bottom-0 bg-[var(--color-surface)] z-50 p-4 flex flex-col gap-2 border-t border-[var(--color-border)]">
          {studentNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-sans font-medium transition-colors ${
                  isActive 
                    ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]" 
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
          <div className="mt-auto pt-4 border-t border-[var(--color-border)]">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-lg font-sans font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-6 min-h-screen sticky top-0">
        <div className="font-display font-bold text-2xl text-[var(--color-primary)] px-4 mb-8">
          Zorvai
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          {studentNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-sans font-medium transition-colors ${
                  isActive 
                    ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]" 
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg font-sans font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
