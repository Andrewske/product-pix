'use client';

import { useState } from 'react';
import { useUserProfile } from '@/lib/auth/hooks';
import { updatePassword, resetPassword } from '@/lib/auth/utils';

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
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Display */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">
          {profile?.email || user?.email || 'No email available'}
        </div>
      </div>

      {/* Password Management */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {isOAuthUser ? 'Set Password' : 'Change Password'}
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {isOAuthUser ? (
          /* Set Password Form for OAuth Users */
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div>
              <label htmlFor="setPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="setPassword"
                type="password"
                value={setPassword}
                onChange={(e) => setSetPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter a new password"
                required
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirmSetPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                id="confirmSetPassword"
                type="password"
                value={confirmSetPassword}
                onChange={(e) => setConfirmSetPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirm your new password"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isSetting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSetting ? 'Setting Password...' : 'Set Password'}
            </button>
          </form>
        ) : (
          /* Change Password Form for Email Users */
          <div className="space-y-4">
            <button
              onClick={handleResetPassword}
              disabled={isUpdating}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? 'Sending...' : 'Send Password Reset Email'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or change password directly</span>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter a new password"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm your new password"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}