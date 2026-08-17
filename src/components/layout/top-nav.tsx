"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

export function TopNav() {
  return (
    <nav className="w-full flex items-center justify-between py-6 px-4 md:px-8 max-w-7xl mx-auto">
      <Link href="/dashboard" className="flex items-center gap-2 group">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center transition-transform group-hover:scale-105">
          <span className="text-[var(--color-bg)] font-display font-bold text-lg leading-none">
            Z
          </span>
        </div>
        <span className="font-display font-semibold text-xl tracking-tight text-[var(--color-text)]">
          Zorvai
        </span>
      </Link>

      <div className="flex items-center gap-4">
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-2 text-[var(--text-body)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors font-sans font-medium"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </form>
      </div>
    </nav>
  );
}
