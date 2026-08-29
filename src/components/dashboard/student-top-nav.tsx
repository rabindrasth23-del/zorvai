"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  History,
  BarChart3,
  Settings,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { logoutAction } from "@/app/actions/auth";

const navItems = [
  { href: "/dashboard", label: "Study Plan", icon: BookOpen, exact: true },
  { href: "/dashboard/history", label: "History", icon: History, exact: true },
  {
    href: "/dashboard/subjects",
    label: "Progress",
    icon: BarChart3,
    exact: true,
  },
  { href: "/settings", label: "Settings", icon: Settings, exact: true },
];

interface StudentTopNavProps {
  studentName: string;
  email: string;
}

export function StudentTopNav({ studentName, email }: StudentTopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initials = studentName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  const handleLogout = async () => {
    const result = await logoutAction();
    if (result?.redirectTo) {
      router.push(result.redirectTo);
    }
  };

  return (
    <nav className="w-full bg-[var(--color-primary)] text-white shadow-[var(--shadow-md)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between py-3 px-4 md:px-8">
        {/* ── Left: Logo ── */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 group shrink-0 cursor-pointer"
        >
          <div className="relative w-8 h-8 transition-transform group-hover:scale-105">
            <Image
              src="/logo.png"
              alt="Zorvai"
              fill
              className="object-contain brightness-0 invert"
              priority
            />
          </div>
          <span className="font-display font-semibold text-lg tracking-tight text-white hidden sm:inline">
            Zorvai
          </span>
        </Link>

        {/* ── Center: Nav links ── */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-sans font-medium transition-colors cursor-pointer ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "text-white/50 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* ── Right: User info + dropdown ── */}
        <div className="relative flex items-center gap-3 shrink-0" ref={dropdownRef}>
          <div className="w-9 h-9 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white font-sans font-semibold text-xs shrink-0">
            {initials}
          </div>
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-sans font-medium text-white leading-tight">
              {studentName}
            </span>
            {email && (
              <span className="text-[11px] font-sans text-white/45 leading-tight">
                {email}
              </span>
            )}
          </div>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Account menu"
          >
            <ChevronDown
              className={`w-4 h-4 text-white/50 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-surface shadow-[var(--shadow-lg)] z-50 py-1 overflow-hidden">
              {/* Mobile-only nav links */}
              <div className="md:hidden border-b border-[var(--color-border)] pb-1 mb-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-sans text-[var(--color-text)] hover:bg-[var(--color-muted)] transition-colors cursor-pointer"
                    >
                      <Icon className="w-4 h-4 text-[var(--color-text-muted)]" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-sans text-[var(--color-text)] hover:bg-[var(--color-muted)] transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-[var(--color-text-muted)]" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
