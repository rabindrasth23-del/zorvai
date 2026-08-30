import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zorvai — Join the Waitlist",
  description:
    "Zorvai teaches the way a real one-to-one tutor would — checking real understanding before moving on. If scores don't improve, you get your money back.",
  openGraph: {
    title: "Zorvai — AI Tutor That Actually Works",
    description:
      "Join the waitlist. If your child's scores don't improve, full refund.",
    siteName: "Zorvai",
    type: "website",
  },
};

export default function WaitlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
