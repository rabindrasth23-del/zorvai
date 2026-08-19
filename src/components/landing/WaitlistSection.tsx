import { getWaitlistCount } from "@/app/actions/waitlist";
import WaitlistForm from "./WaitlistForm";

export default async function WaitlistSection() {
  const count = await getWaitlistCount();

  return (
    <section id="waitlist" className="bg-[var(--color-bg)] py-[var(--space-20)] md:py-[var(--space-32)] px-[var(--space-6)] text-center relative z-20">
      <div className="max-w-[800px] mx-auto flex flex-col items-center">
        <WaitlistForm initialCount={count} />
      </div>
    </section>
  );
}
