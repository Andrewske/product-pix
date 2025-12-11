import Link from 'next/link';
import { LoginForm, GoogleButton, AuthLayout, AuthDivider } from '@/components/auth';

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Invalid email or password',
  auth_callback_error: 'Authentication failed. Please try again.',
} as const;

const DEFAULT_ERROR_MESSAGE = 'An error occurred. Please try again.';

export default async function LoginPage({ searchParams }: LoginPageProps): Promise<React.ReactElement> {
  const { redirect, error } = await searchParams;

  const errorMessage = error
    ? AUTH_ERROR_MESSAGES[error] ?? DEFAULT_ERROR_MESSAGE
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
