import { SignupForm } from "./signup-form";
import { AuthLayout, FeatureCard } from "@/components/ui/auth-layout";

export const metadata = {
  title: "Sign Up | Zorvai",
  description: "Create your Zorvai account.",
};

const featureProof: FeatureCard[] = [
  {
    icon: "🎯",
    title: "Built around what you're studying",
    description: "Tell us your subjects once — every session adapts to them."
  },
  {
    icon: "🌱",
    title: "Calm by design",
    description: "No streak-shaming, no guilt spirals — just steady, sustainable progress."
  }
];

export default function SignupPage() {
  return (
    <AuthLayout
      title="Create your account"
      description="Start building real mastery, one subject at a time."
      heroImageSrc="https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=1080&q=80" // Typewriter / study aesthetic
      features={featureProof}
    >
      <SignupForm />
    </AuthLayout>
  );
}
