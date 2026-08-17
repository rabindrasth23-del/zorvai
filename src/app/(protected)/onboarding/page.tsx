import { OnboardingFlow } from "./onboarding-flow";

export const metadata = {
  title: "Welcome to Zorvai | Onboarding",
  description: "Let's set up your personalized study coach.",
};

export default function OnboardingPage() {
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="font-display text-[var(--text-h2)] text-[var(--color-text)] mb-3">
            Welcome to Zorvai
          </h1>
          <p className="font-sans text-[var(--text-body)] text-[var(--color-text-muted)]">
            Let's set up your AI study coach so it knows exactly how to help you.
          </p>
        </div>
        
        <OnboardingFlow />
      </div>
    </div>
  );
}
