import SignInForm from "@/components/auth/SignInForm";
import PageMeta from "@/components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";

export default function SignIn() {
  return (
    <>
      <PageMeta title="Sign in | Anaya Collection Admin" description="Sign in to the Anaya Collection store admin." />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
