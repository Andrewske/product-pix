import Link from 'next/link';
import { SignupForm, GoogleButton } from '@/components/auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignupPage(): React.ReactElement {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">ProductPix</CardTitle>
          <CardDescription className="text-lg">
            Create your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <GoogleButton mode="signup" />

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

          <SignupForm />
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
