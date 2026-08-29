"use client";

import { useState } from "react";
import { Search, List, LayoutGrid, GitBranch, BookOpen } from "lucide-react";
import { TopicFlowCard } from "./topic-flow-card";

interface Topic {
  title: string;
  description: string | null;
  status: string;
  day: number;
}

interface StudyPlanClientProps {
  topics: Topic[];
}

export function StudyPlanClient({ topics }: StudyPlanClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid" | "timeline">(
    "list"
  );

  // Real-time client-side filtering — no backend call
  const filteredTopics = searchQuery.trim()
    ? topics.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.description &&
            t.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : topics;

  // First pending/re-queued topic in the filtered list = current
  const currentTopicIndex = filteredTopics.findIndex(
    (t) => t.status === "pending" || t.status === "re-queued"
  );

  return (
    <div className="flex gap-4">
      {/* ── Icon rail (left side) ── */}
      <div className="hidden md:flex flex-col gap-2 pt-2 shrink-0">
        {(
          [
            { icon: List, mode: "list" as const, label: "List view", active: true },
            { icon: LayoutGrid, mode: "grid" as const, label: "Grid view", active: false },
            { icon: GitBranch, mode: "timeline" as const, label: "Timeline view", active: false },
          ] as const
        ).map(({ icon: Icon, mode, label, active }) => (
          <button
            key={mode}
            onClick={() => active && setViewMode(mode)}
            className={`w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center transition-colors ${
              viewMode === mode
                ? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)] cursor-pointer"
                : active
                  ? "bg-[var(--color-muted)] text-[var(--color-text-muted)] hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] cursor-pointer"
                  : "bg-[var(--color-muted)] text-[var(--color-text-muted)]/40 cursor-default opacity-50"
            }`}
            aria-label={label}
            title={active ? label : `${label} (coming soon)`}
            disabled={!active}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col">
        {/* Search input */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-sm pl-10 pr-4 py-2.5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-surface text-sm font-sans text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 shadow-[var(--shadow-xs)] transition-all"
          />
        </div>

        {/* Filtered topic cards */}
        {filteredTopics.length > 0 ? (
          <div className="flex flex-col">
            {filteredTopics.map((topic, i) => {
              let displayStatus: "mastered" | "upcoming" | "review";
              if (topic.status === "mastered") displayStatus = "mastered";
              else if (topic.status === "re-queued") displayStatus = "review";
              else displayStatus = "upcoming";

              return (
                <TopicFlowCard
                  key={`${topic.title}-${topic.day}-${i}`}
                  title={topic.title}
                  description={topic.description || undefined}
                  status={displayStatus}
                  isCurrent={i === currentTopicIndex}
                  isLast={i === filteredTopics.length - 1}
                  index={i}
                />
              );
            })}
          </div>
        ) : searchQuery.trim() ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-surface p-6 text-center">
            <p className="text-sm text-[var(--color-text-muted)] font-sans">
              No topics match &ldquo;{searchQuery}&rdquo;
            </p>
          </div>
        ) : (
          <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-surface p-8 flex flex-col items-center text-center shadow-[var(--shadow-sm)]">
            <div className="w-14 h-14 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mb-4">
              <BookOpen className="w-7 h-7 text-[var(--color-primary)]" />
            </div>
            <h3 className="font-display font-medium text-[var(--color-text)] text-lg mb-1">
              No study plan yet
            </h3>
            <p className="text-[var(--color-text-muted)] text-sm font-sans max-w-sm">
              Complete your onboarding to generate a personalized study
              plan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
