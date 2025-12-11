import Link from 'next/link';
import { LoginForm, GoogleButton, AuthLayout, AuthDivider } from '@/components/auth';

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps): Promise<React.ReactElement> {
  const { redirect, error } = await searchParams;

  const errorMessage = error
    ? error === 'invalid_credentials'
      ? 'Invalid email or password'
      : error === 'auth_callback_error'
        ? 'Authentication failed. Please try again.'
        : 'An error occurred. Please try again.'
    : undefined;

  return (
    <AuthLayout
      title="ProductPix"
      error={errorMessage}
      showSpotlight
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Sign up
          </Link>
        </p>
      }
    >
      <GoogleButton redirectTo={redirect} mode="signin" />
      <AuthDivider />
      <LoginForm redirectTo={redirect} />
    </AuthLayout>
  );
}
