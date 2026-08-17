"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard fetch error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
      <div className="p-4 bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] rounded-full">
        {/* Placeholder for an icon, e.g. TriangleAlert */}
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
      </div>
      <h2 className="text-2xl font-display font-bold text-[var(--color-text)]">
        Failed to load dashboard data
      </h2>
      <p className="text-[var(--text-body)] text-[var(--color-text-muted)] max-w-md">
        We encountered an issue while retrieving your session history. Please try again.
      </p>
      <Button 
        variant="outline" 
        onClick={() => reset()}
      >
        Try again
      </Button>
    </div>
  );
}
