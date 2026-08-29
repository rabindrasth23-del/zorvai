"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

interface ParentTopNavProps {
  parentName: string;
}

export function ParentTopNav({ parentName }: ParentTopNavProps) {
  const router = useRouter();

  const initials = parentName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = async () => {
    const result = await logoutAction();
    if (result?.redirectTo) {
      router.push(result.redirectTo);
    }
  };

  return (
    <nav className="w-full border-b border-[var(--color-border)] bg-surface">
      <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-4 md:px-8">
        {/* Left: Logo */}
        <Link
          href="/parent/dashboard"
          className="flex items-center gap-2 group cursor-pointer"
        >
          <div className="relative w-9 h-9 transition-transform group-hover:scale-105">
            <Image
              src="/logo.png"
              alt="Zorvai Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="font-display font-semibold text-lg tracking-tight text-[var(--color-text)]">
            Zorvai
          </span>
        </Link>

        {/* Center: Nav label */}
        <div className="hidden sm:flex items-center gap-6">
          <span className="font-sans text-sm font-medium text-[var(--color-primary)]">
            Parent Dashboard
          </span>
        </div>

        {/* Right: User info + logout */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="font-sans text-sm font-medium text-[var(--color-text)]">
              {parentName}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-sans font-semibold text-xs shrink-0">
            {initials}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors font-sans font-medium cursor-pointer"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
