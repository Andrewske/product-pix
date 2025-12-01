import Link from 'next/link';
import { LoginForm, GoogleButton } from '@/components/auth';

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps): Promise<React.ReactElement> {
  const { redirect, error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-center text-gray-900">
            ProductPix
          </h1>
          <h2 className="mt-6 text-center text-xl text-gray-600">
            Sign in to your account
          </h2>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error === 'invalid_credentials'
              ? 'Invalid email or password'
              : error === 'auth_callback_error'
                ? 'Authentication failed. Please try again.'
                : 'An error occurred. Please try again.'}
          </div>
        )}

        <div className="space-y-4">
          <GoogleButton redirectTo={redirect} mode="signin" />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Or continue with email</span>
            </div>
          </div>

          <LoginForm redirectTo={redirect} />
        </div>

        <p className="text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
