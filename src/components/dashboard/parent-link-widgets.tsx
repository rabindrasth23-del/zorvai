"use client";

import * as React from "react";
import { Copy, Check, X } from "lucide-react";

export function InviteCodeCard({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-surface p-5 shadow-[var(--shadow-sm)]">
      <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] font-sans mb-2">
        Share this code with your parent so they can link their account:
      </p>
      <div className="flex items-center gap-3">
        <code className="font-mono text-lg tracking-widest text-[var(--color-text)] bg-[var(--color-muted)] px-4 py-2 rounded-xl select-all">
          {code}
        </code>
        <button
          onClick={handleCopy}
          className="p-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors"
          aria-label={copied ? "Copied" : "Copy invite code"}
        >
          {copied ? (
            <Check className="w-4 h-4 text-[var(--color-success)]" />
          ) : (
            <Copy className="w-4 h-4 text-[var(--color-text-muted)]" />
          )}
        </button>
      </div>
    </div>
  );
}

export function LinkNotificationBanner({
  parentName,
  linkedAt,
  linkId,
}: {
  parentName: string;
  linkedAt: string;
  linkId: string;
}) {
  const [dismissed, setDismissed] = React.useState(false);

  const handleDismiss = async () => {
    setDismissed(true);
    // Mark as notified in the DB so it doesn't show again
    await fetch("/api/auth/dismiss-link-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ link_id: linkId }),
    });
  };

  if (dismissed) return null;

  const date = new Date(linkedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      role="status"
      className="rounded-2xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 p-4 flex items-start justify-between gap-4"
    >
      <p className="text-[var(--text-body-sm)] text-[var(--color-text)] font-sans">
        A parent account (<span className="font-medium">{parentName}</span>) was
        linked to your profile on {date}.
      </p>
      <button
        onClick={handleDismiss}
        className="shrink-0 p-1 rounded-lg hover:bg-[var(--color-primary)]/10 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4 text-[var(--color-text-muted)]" />
      </button>
    </div>
  );
}
