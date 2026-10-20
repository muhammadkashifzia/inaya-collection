import TwoFactorForm from "@/components/auth/TwoFactorForm";
import PageMeta from "@/components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";

export default function TwoFactorChallenge() {
  return (
    <>
      <PageMeta title="Two-factor authentication | Anaya Collection Admin" description="Enter your authenticator code to continue." />
      <AuthLayout>
        <TwoFactorForm />
      </AuthLayout>
    </>
  );
}
