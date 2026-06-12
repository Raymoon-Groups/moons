'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PasswordField } from '@/components/auth/password-field';
import { authFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

export default function SecuritySettingsPage() {
  const router = useRouter();
  const { user, ready, updateUser } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && !user) {
      router.replace('/login');
    }
  }, [ready, user, router]);

  async function handleCreatePassword(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authFetch('/auth/set-password', {
        method: 'POST',
        body: JSON.stringify({ password, confirmPassword }),
      });
      updateUser({ hasPassword: true });
      setSuccess('Password created successfully. You can now sign in with email and password.');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set password');
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword: confirmNewPassword,
        }),
      });
      setSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  }

  if (!ready || !user) {
    return (
      <div className="p-8 text-center text-sm text-moons-muted">Loading…</div>
    );
  }

  const canCreatePassword = !user.hasPassword;

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-moons-blue hover:underline">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-surface-elevated p-6 shadow-sm">
        <h1 className="text-xl font-bold text-moons-navy">Security Settings</h1>
        <p className="mt-1 text-sm text-foreground">
          Manage how you sign in to your Moons account.
        </p>

        <div className="mt-6 space-y-4 rounded-xl bg-surface p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-foreground">Email</span>
            <span className="font-medium text-foreground">{user.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground">Email verified</span>
            <span className={`font-medium ${user.emailVerified ? 'text-green-700' : 'text-amber-700'}`}>
              {user.emailVerified ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground">Email &amp; Password</span>
            <span className={`font-medium ${user.hasPassword ? 'text-green-700' : 'text-amber-700'}`}>
              {user.hasPassword ? 'Enabled' : 'Not set'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground">Google Sign-In</span>
            <span className={`font-medium ${user.hasGoogle ? 'text-green-700' : 'text-moons-muted'}`}>
              {user.hasGoogle ? 'Linked' : 'Not linked'}
            </span>
          </div>
        </div>

        {canCreatePassword ? (
          <form onSubmit={handleCreatePassword} className="mt-8 space-y-5">
            <p className="text-sm text-foreground">
              Your account was created with Google. Create a password to also sign in with your email.
            </p>

            <PasswordField
              id="password"
              label="New Password"
              value={password}
              onChange={setPassword}
              minLength={8}
              placeholder="Min 8 characters"
            />

            <PasswordField
              id="confirmPassword"
              label="Confirm Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              minLength={8}
              placeholder="Re-enter password"
            />

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
            )}
            {success && (
              <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{success}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-moons-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-moons-blue-dark disabled:opacity-60"
            >
              {loading ? 'Saving…' : 'Create Password'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleChangePassword} className="mt-8 space-y-5">
            <p className="text-sm text-foreground">
              Update your password. You will need your current password to make changes.
            </p>

            <PasswordField
              id="currentPassword"
              label="Current Password"
              value={currentPassword}
              onChange={setCurrentPassword}
              minLength={8}
              placeholder="Enter current password"
            />

            <PasswordField
              id="newPassword"
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              minLength={8}
              placeholder="Min 8 characters"
            />

            <PasswordField
              id="confirmNewPassword"
              label="Confirm New Password"
              value={confirmNewPassword}
              onChange={setConfirmNewPassword}
              minLength={8}
              placeholder="Re-enter new password"
            />

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
            )}
            {success && (
              <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{success}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-moons-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-moons-blue-dark disabled:opacity-60"
            >
              {loading ? 'Saving…' : 'Change Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
