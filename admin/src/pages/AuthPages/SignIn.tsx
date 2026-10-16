import SignInForm from "@/components/auth/SignInForm";
import PageMeta from "@/components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";

export default function SignIn() {
  return (
    <>
      <PageMeta title="Sign in | Galaxy Wear Admin" description="Sign in to the Galaxy Wear store admin." />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
