import Link from "next/link";
import { getWaitlistCount } from "@/app/actions/waitlist";

export default async function WaitlistBanner() {
  const count = await getWaitlistCount();
  
  const tier1Spots = Math.max(0, 100 - count);
  const tier2Spots = Math.max(0, 500 - Math.max(100, count));
  
  let bannerText = "";
  if (count < 100) {
    bannerText = `Early Access: ${tier1Spots} spots left for 60% off forever.`;
  } else if (count < 500) {
    bannerText = `Early Access: ${tier2Spots} spots left for 40% off forever.`;
  } else {
    bannerText = "Early Access waitlist is open. Join now.";
  }

  return (
    <div className="sticky top-[72px] z-40 bg-[var(--color-accent)] text-white px-[var(--space-4)] py-[var(--space-2)] text-center font-sans text-[var(--text-body-sm)] font-bold shadow-md flex items-center justify-center gap-4 flex-wrap">
      <span>{bannerText}</span>
      <Link 
        href="#waitlist" 
        className="bg-white text-[var(--color-accent)] px-3 py-1 rounded-full text-[12px] uppercase tracking-wider hover:bg-white/90 transition-colors no-underline"
      >
        Claim Spot
      </Link>
    </div>
  );
}
