import { ParentOnboardingFlow } from "./parent-onboarding-flow";

export const metadata = {
  title: "Link to Student | Zorvai",
  description: "Enter your student's invite code to link your parent account.",
};

export default function ParentOnboardingPage() {
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="font-display text-[var(--text-h2)] text-[var(--color-text)] mb-3">
            Link to Your Student
          </h1>
          <p className="font-sans text-[var(--text-body)] text-[var(--color-text-muted)]">
            Enter the invite code your student shared with you to connect your accounts.
          </p>
        </div>

        <ParentOnboardingFlow />
      </div>
    </div>
  );
}
