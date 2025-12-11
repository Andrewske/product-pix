'use client';

import { useState } from 'react';
import { useUserProfile } from '@/lib/auth/hooks';
import { updatePassword, resetPassword } from '@/lib/auth/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export function AccountTab(): React.ReactElement {
  const { user, profile, loading } = useUserProfile();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [setPassword, setSetPassword] = useState('');
  const [confirmSetPassword, setConfirmSetPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSetting, setIsSetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Determine auth provider from user metadata
  const authProvider = user?.app_metadata?.provider || 'email';
  const isOAuthUser = authProvider !== 'email';

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsUpdating(true);

    try {
      const result = await updatePassword(newPassword);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('Password updated successfully');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (_err) {
      setError('Failed to update password');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (setPassword !== confirmSetPassword) {
      setError('Passwords do not match');
      return;
    }

    if (setPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsSetting(true);

    try {
      const result = await updatePassword(setPassword);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('Password set successfully');
        setSetPassword('');
        setConfirmSetPassword('');
      }
    } catch (_err) {
      setError('Failed to set password');
    } finally {
      setIsSetting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;

    clearMessages();
    setIsUpdating(true);

    try {
      const result = await resetPassword(user.email);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('Password reset email sent. Check your inbox.');
      }
    } catch (_err) {
      setError('Failed to send reset email');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-muted rounded-lg"></div>
          <div className="h-48 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Display */}
      <Card variant="studio" className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Email Address</h3>
            <p className="text-sm text-muted-foreground">Your registered email address</p>
          </div>
          <div className="flex items-center space-x-2">
            <Input
              value={profile?.email || user?.email || 'No email available'}
              readOnly
              className="bg-muted text-muted-foreground"
            />
          </div>
        </div>
       </Card>

       {/* Section divider */}
       <div className="relative py-6">
         <div className="absolute inset-0 flex items-center">
           <span className="w-full border-t border-border/40" />
         </div>
       </div>

       {/* Password Management */}
      <Card variant="studio" className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">{isOAuthUser ? 'Set Password' : 'Change Password'}</h3>
            <p className="text-sm text-muted-foreground">
              {isOAuthUser
                ? 'Set a password to log in with email/password instead of Google'
                : 'Update your password'}
            </p>
          </div>
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-success/10 border border-success/20 rounded-md">
              <p className="text-sm text-success font-medium">{success}</p>
            </div>
          )}

          {isOAuthUser ? (
            /* Set Password Form for OAuth Users */
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="setPassword">New Password</Label>
                <Input
                  id="setPassword"
                  type="password"
                  value={setPassword}
                  onChange={(e) => setSetPassword(e.target.value)}
                  placeholder="Enter a new password"
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmSetPassword">Confirm New Password</Label>
                <Input
                  id="confirmSetPassword"
                  type="password"
                  value={confirmSetPassword}
                  onChange={(e) => setConfirmSetPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                  minLength={6}
                />
              </div>

                <Button variant="studio" size="xl" type="submit" disabled={isSetting}>
                  {isSetting ? 'Setting Password...' : 'Set Password'}
                </Button>
            </form>
          ) : (
            /* Change Password Form for Email Users */
            <div className="space-y-6">
                <Button
                  variant="outline"
                  size="xl"
                  onClick={handleResetPassword}
                  disabled={isUpdating}
                  className="w-full sm:w-auto"
                >
                  {isUpdating ? 'Sending...' : 'Send Password Reset Email'}
                </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-muted" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or change password directly</span>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter a new password"
                    required
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    required
                    minLength={6}
                  />
                </div>

                  <Button variant="studio" size="xl" type="submit" disabled={isUpdating}>
                    {isUpdating ? 'Updating...' : 'Update Password'}
                  </Button>
              </form>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
