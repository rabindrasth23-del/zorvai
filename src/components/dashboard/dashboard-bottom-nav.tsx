"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, History, BookOpen, Settings } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/history", label: "Sessions", icon: History },
  { href: "/dashboard/subjects", label: "Progress", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function DashboardBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[var(--color-text)] px-2 py-2">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 p-2 cursor-pointer"
              aria-label={item.label}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isActive
                    ? "bg-[var(--color-accent)] text-white"
                    : "bg-white/10 text-white/40 hover:text-white/70"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
