import Link from 'next/link';
import { LoginForm, GoogleButton } from '@/components/auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps): Promise<React.ReactElement> {
  const { redirect, error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 studio-spotlight pointer-events-none" />
      <Card className="w-full max-w-md bg-card/50 backdrop-blur-xl border border-white/10 shadow-xl relative z-10">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-xl font-bold">ProductPix</CardTitle>
          <CardDescription className="text-lg">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded text-sm font-medium">
              {error === 'invalid_credentials'
                ? 'Invalid email or password'
                : error === 'auth_callback_error'
                  ? 'Authentication failed. Please try again.'
                  : 'An error occurred. Please try again.'}
            </div>
          )}

          <GoogleButton redirectTo={redirect} mode="signin" />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          <LoginForm redirectTo={redirect} />
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
