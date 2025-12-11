import Link from 'next/link';
import { SignupForm, GoogleButton, AuthLayout, AuthDivider } from '@/components/auth';

export default function SignupPage(): React.ReactElement {
  return (
    <AuthLayout
      title="ProductPix"
      showSpotlight
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <GoogleButton mode="signup" />
      <AuthDivider />
      <SignupForm />
    </AuthLayout>
  );
}
