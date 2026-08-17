import { ResetPasswordForm } from "./reset-password-form";
import { AuthLayout } from "@/components/ui/auth-layout";

export const metadata = {
  title: "Reset Password | Zorvai",
  description: "Reset your Zorvai account password.",
};

export default function ResetPasswordPage() {
  return (
    <AuthLayout 
      title="Reset Password"
      description="Enter your email to receive a password reset link."
      heroImageSrc="/auth-bg.png"
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
}
