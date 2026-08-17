import { LoginForm } from "./login-form";
import { AuthLayout, FeatureCard } from "@/components/ui/auth-layout";

export const metadata = {
  title: "Log In | Zorvai",
  description: "Sign in to your Zorvai account.",
};

const featureProof: FeatureCard[] = [
  {
    icon: "🔥",
    title: "Streaks that stick",
    description: "Short daily check-ins build real momentum — miss a day, and Zorvai helps you pick right back up."
  },
  {
    icon: "✅",
    title: "Backed by a mastery guarantee",
    description: "Every subject you study is tracked toward real mastery, not just completion."
  }
];

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to pick up your streak and keep building mastery."
      // Study-focused Unsplash image (notebook, calm light)
      heroImageSrc="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1080&q=80"
      features={featureProof}
    >
      <LoginForm />
    </AuthLayout>
  );
}
