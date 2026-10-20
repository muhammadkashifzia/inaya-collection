import TwoFactorSetupForm from "@/components/auth/TwoFactorSetupForm";
import PageMeta from "@/components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";

export default function TwoFactorSetup() {
  return (
    <>
      <PageMeta title="Set up authenticator | Anaya Collection Admin" description="Configure multi-factor authentication for your account." />
      <AuthLayout>
        <TwoFactorSetupForm />
      </AuthLayout>
    </>
  );
}
