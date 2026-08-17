import { ResetPasswordForm } from "./reset-password-form";
import { AuthLayout } from "@/components/ui/auth-layout";

export const metadata = {
  title: "Reset Password | Zorvai",
  description: "Reset your Zorvai account password.",
};

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Reset your password"
      description="Enter your email and we'll send you a link to get back in."
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
}
