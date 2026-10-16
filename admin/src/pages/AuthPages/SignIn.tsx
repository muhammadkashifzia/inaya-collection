import SignInForm from "@/components/auth/SignInForm";
import PageMeta from "@/components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";

export default function SignIn() {
  return (
    <>
      <PageMeta title="Sign in | Inaya Collection Admin" description="Sign in to the Inaya Collection store admin." />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
