"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import WaitlistPage from "../page";

export default function ReferralPage() {
  const params = useParams();
  const referralCode = params.referralCode as string;
  const [referrerName, setReferrerName] = useState<string | null>(null);

  useEffect(() => {
    if (!referralCode) return;

    // Track the referral click
    fetch("/api/waitlist/refer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referralCode }),
    })
      .then((r) => r.json())
      .then((d) => setReferrerName(d.referrerName))
      .catch(() => {});

    // Set the ref param in the URL so the main page picks it up
    const url = new URL(window.location.href);
    url.searchParams.set("ref", referralCode);
    window.history.replaceState({}, "", url.toString());
  }, [referralCode]);

  return (
    <>
      {/* Referral banner */}
      {referrerName && (
        <div
          style={{
            background: "rgba(78,205,196,0.06)",
            borderBottom: "1px solid rgba(78,205,196,0.2)",
            padding: "12px 24px",
            textAlign: "center",
            color: "#4ecdc4",
            fontSize: 14,
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          You were invited by <strong>{referrerName}</strong>. Joining gives them
          50 spots up the waitlist.
        </div>
      )}
      <WaitlistPage />
    </>
  );
}
