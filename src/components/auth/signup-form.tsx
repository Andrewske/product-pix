'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/forms';

export function SignupForm(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

    const supabase = createClient();

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded text-sm">
        <h3 className="font-medium">Check your email</h3>
        <p className="mt-1">
          We&apos;ve sent you a confirmation link. Click it to activate your account.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <FormField
          label="Email address"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={loading}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-background"
        />

        <FormField
          label="Password"
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          disabled={loading}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          className="bg-background"
        />

        <FormField
          label="Confirm password"
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          disabled={loading}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="bg-background"
        />
      </div>

      {error && (
        <div className="text-destructive text-sm font-medium">{error}</div>
      )}

      <Button
        variant="studio"
        size="xl"
        type="submit"
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  );
}
