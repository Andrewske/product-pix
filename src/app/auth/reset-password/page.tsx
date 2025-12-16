'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { updatePassword } from '@/lib/auth/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PageContainer } from '@/components/layout/page-container';

export default function ResetPasswordPage(): React.ReactElement {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    const result = await updatePassword(password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [success, router]);

  if (success) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-3xl font-bold tracking-tight font-display">ProductPix</CardTitle>
              <CardDescription className="text-lg">
                Password updated successfully
              </CardDescription>
            </CardHeader>
          <CardContent>
            <div className="bg-success/10 border border-success text-success px-4 py-3 rounded">
              <h3 className="font-medium">Password updated</h3>
              <p className="text-sm mt-1">
                Your password has been successfully updated. You will be redirected to your dashboard shortly.
              </p>
            </div>
          </CardContent>
        </Card>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold tracking-tight font-display">ProductPix</CardTitle>
          <CardDescription className="text-lg">
            Reset your password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            {error && (
              <div className="text-destructive text-sm font-medium">{error}</div>
            )}

            <Button
              variant="accent"
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Updating password...' : 'Update password'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-center text-sm text-muted-foreground">
            Remember your password?{' '}
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
    </PageContainer>
  );
}