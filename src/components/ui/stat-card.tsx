"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Flame, Calendar as CalendarIcon, Target, ShieldCheck } from "lucide-react";

export interface StatCardProps {
  title: string;
  value: string;
  trend?: string;
  iconType: "streak" | "sessions" | "mastery" | "guarantee";
  isLoading?: boolean;
  className?: string;
}

export function StatCard({ title, value, trend, iconType, isLoading, className }: StatCardProps) {
  const IconMap = {
    streak: <Flame className="h-5 w-5 text-[var(--color-accent)]" />,
    sessions: <CalendarIcon className="h-5 w-5 text-[var(--color-primary)]" />,
    mastery: <Target className="h-5 w-5 text-[var(--color-success)]" />,
    guarantee: <ShieldCheck className="h-5 w-5 text-[var(--color-warning)]" />
  };

  return (
    <div className={cn("flex flex-col gap-[var(--space-2)] bg-surface border border-border rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-sm)]", className)}>
      <div className="flex justify-between items-center w-full">
        <span className="text-[var(--text-body-sm)] font-sans font-medium text-[var(--color-text-muted)] tracking-wide">
          {title}
        </span>
        <div className="p-2 bg-[var(--color-muted)] rounded-[var(--radius-md)] shrink-0">
          {IconMap[iconType]}
        </div>
      </div>
      
      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <div className="flex flex-col gap-2 py-1" aria-busy="true">
            <div className="h-8 w-24 bg-[var(--color-muted)] rounded animate-pulse" />
            <div className="h-4 w-32 bg-[var(--color-muted)] rounded animate-pulse" />
          </div>
        ) : (
          <>
            {/* Use Geist Mono for numbers per MASTER.md rules */}
            <span className="text-3xl font-mono font-semibold text-[var(--color-text)] tracking-tight">
              {value}
            </span>
            {trend && (
              <span className="text-[var(--text-caption)] font-sans text-[var(--color-text-muted)]">
                {trend}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
