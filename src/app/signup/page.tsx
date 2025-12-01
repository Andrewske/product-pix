import Link from 'next/link';
import { SignupForm, GoogleButton } from '@/components/auth';

export default function SignupPage(): React.ReactElement {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-center text-gray-900">
            ProductPix
          </h1>
          <h2 className="mt-6 text-center text-xl text-gray-600">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Start generating professional product photos today
          </p>
        </div>

        <div className="space-y-4">
          <GoogleButton mode="signup" />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Or continue with email</span>
            </div>
          </div>

          <SignupForm />
        </div>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
