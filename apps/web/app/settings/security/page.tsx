'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@moons/shared';
import { PasswordField } from '@/components/auth/password-field';
import { SettingsShell } from '@/components/settings/settings-shell';
import { authFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

function StatusItem({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'warning' | 'muted';
}) {
  const valueClass =
    tone === 'success'
      ? 'text-emerald-700 dark:text-emerald-300'
      : tone === 'warning'
        ? 'text-amber-700 dark:text-amber-300'
        : tone === 'muted'
          ? 'text-foreground/70'
          : 'text-heading';

  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-moons-muted">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}

export default function SecuritySettingsPage() {
  const router = useRouter();
  const { user, ready, updateUser, login, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

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
      const result = await authFetch<{
        success: boolean;
        message: string;
        user?: Parameters<typeof login>[0]['user'];
        accessToken?: string;
        refreshToken?: string;
      }>('/auth/set-password', {
        method: 'POST',
        body: JSON.stringify({ password, confirmPassword }),
      });
      if (result.user && result.accessToken) {
        login({
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        });
      } else {
        updateUser({ hasPassword: true });
      }
      setSuccess(
        result.message ||
          'Password created successfully. Other devices have been signed out.',
      );
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
      const result = await authFetch<{
        success: boolean;
        message: string;
        user?: Parameters<typeof login>[0]['user'];
        accessToken?: string;
        refreshToken?: string;
      }>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword: confirmNewPassword,
        }),
      });
      if (result.user && result.accessToken) {
        login({
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        });
      }
      setSuccess(
        result.message ||
          'Password changed successfully. Other devices have been signed out.',
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogoutAll() {
    setError('');
    setSuccess('');
    setLogoutAllLoading(true);
    try {
      await authFetch('/auth/logout-all', { method: 'POST', body: JSON.stringify({}) });
      await logout();
      router.replace('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out all devices');
      setLogoutAllLoading(false);
    }
  }

  async function handleDeleteAccount(e: FormEvent) {
    e.preventDefault();
    setDeleteError('');
    if (deleteConfirm !== 'DELETE') {
      setDeleteError('Type DELETE in capital letters to confirm.');
      return;
    }
    setDeleteLoading(true);
    try {
      await authFetch('/auth/account', {
        method: 'DELETE',
        body: JSON.stringify({
          confirmation: deleteConfirm,
          ...(user?.hasPassword ? { password: deletePassword } : {}),
        }),
      });
      await logout();
      router.replace('/login?deleted=1');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account');
      setDeleteLoading(false);
    }
  }

  if (!ready || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-background text-sm text-moons-muted">
        Loading…
      </div>
    );
  }

  const canCreatePassword = !user.hasPassword;
  const isRecruiter = user.role === UserRole.RECRUITER;

  return (
    <SettingsShell
      title="Security settings"
      subtitle="Manage how you sign in to your MoonsJob account."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="min-w-0 space-y-5">
          <section className="rounded-2xl border border-border bg-surface-elevated p-6 shadow-sm">
              <h2 className="text-base font-bold text-heading">Sign-in methods</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <StatusItem label="Email" value={user.email} />
                <StatusItem
                  label="Email verified"
                  value={user.emailVerified ? 'Yes' : 'No'}
                  tone={user.emailVerified ? 'success' : 'warning'}
                />
                <StatusItem
                  label="Email & password"
                  value={user.hasPassword ? 'Enabled' : 'Not set'}
                  tone={user.hasPassword ? 'success' : 'warning'}
                />
                <StatusItem
                  label="Google sign-in"
                  value={user.hasGoogle ? 'Linked' : 'Not linked'}
                  tone={user.hasGoogle ? 'success' : 'muted'}
                />
              </div>
            </section>

          <section className="rounded-2xl border border-border bg-surface-elevated p-6 shadow-sm">
              <h2 className="text-base font-bold text-heading">
                {canCreatePassword ? 'Create a password' : 'Change password'}
              </h2>
              <p className="mt-2 text-sm text-moons-muted">
                {canCreatePassword
                  ? 'Your account was created with Google. Add a password to also sign in with your email.'
                  : 'Update your password. This will sign out all other devices.'}
              </p>

              {canCreatePassword ? (
                <form onSubmit={handleCreatePassword} className="mt-6 space-y-5">
                  <PasswordField
                    id="password"
                    label="New password"
                    value={password}
                    onChange={setPassword}
                    minLength={8}
                    placeholder="Min 8 characters"
                  />
                  <PasswordField
                    id="confirmPassword"
                    label="Confirm password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    minLength={8}
                    placeholder="Re-enter password"
                  />

                  {error && (
                    <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
                  )}
                  {success && (
                    <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                      {success}
                    </p>
                  )}

                  <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                      href="/dashboard"
                      className="text-center text-sm font-semibold text-moons-muted transition hover:text-heading"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={loading}
                      className="rounded-lg bg-moons-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-moons-blue-dark disabled:opacity-60"
                    >
                      {loading ? 'Saving…' : 'Create password'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleChangePassword} className="mt-6 space-y-5">
                  <PasswordField
                    id="currentPassword"
                    label="Current password"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    minLength={8}
                    placeholder="Enter current password"
                  />
                  <PasswordField
                    id="newPassword"
                    label="New password"
                    value={newPassword}
                    onChange={setNewPassword}
                    minLength={8}
                    placeholder="Min 8 characters"
                  />
                  <PasswordField
                    id="confirmNewPassword"
                    label="Confirm new password"
                    value={confirmNewPassword}
                    onChange={setConfirmNewPassword}
                    minLength={8}
                    placeholder="Re-enter new password"
                  />

                  {error && (
                    <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
                  )}
                  {success && (
                    <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                      {success}
                    </p>
                  )}

                  <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                      href="/dashboard"
                      className="text-center text-sm font-semibold text-moons-muted transition hover:text-heading"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={loading}
                      className="rounded-lg bg-moons-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-moons-blue-dark disabled:opacity-60"
                    >
                      {loading ? 'Saving…' : 'Change password'}
                    </button>
                  </div>
                </form>
              )}
            </section>

          <section className="rounded-2xl border border-red-200 bg-red-50/40 p-6 shadow-sm dark:border-red-900/40 dark:bg-red-950/20">
              <h2 className="text-base font-bold text-heading">Delete account</h2>
              <p className="mt-2 text-sm text-moons-muted">
                Permanently delete your MoonsJob account, profile, applications, jobs you posted,
                messages, and uploaded files. This cannot be undone.
              </p>
              <form onSubmit={handleDeleteAccount} className="mt-6 space-y-4">
                {user.hasPassword ? (
                  <PasswordField
                    id="deletePassword"
                    label="Current password"
                    value={deletePassword}
                    onChange={setDeletePassword}
                    minLength={8}
                    placeholder="Enter your password"
                  />
                ) : null}
                <div>
                  <label
                    htmlFor="deleteConfirm"
                    className="mb-1.5 block text-sm font-semibold text-heading"
                  >
                    Type DELETE to confirm
                  </label>
                  <input
                    id="deleteConfirm"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-heading outline-none focus:border-moons-blue"
                    placeholder="DELETE"
                    autoComplete="off"
                  />
                </div>
                {deleteError ? (
                  <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{deleteError}</p>
                ) : null}
                <button
                  type="submit"
                  disabled={deleteLoading || loading || logoutAllLoading}
                  className="rounded-lg bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {deleteLoading ? 'Deleting…' : 'Delete my account'}
                </button>
              </form>
            </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-border bg-surface-elevated p-5 shadow-sm">
              <h3 className="text-sm font-bold text-heading">Account overview</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-moons-muted">Account type</dt>
                  <dd className="font-semibold text-heading">
                    {isRecruiter ? 'Recruiter' : 'Jobseeker'}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-moons-muted">Password login</dt>
                  <dd
                    className={`font-semibold ${user.hasPassword ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}
                  >
                    {user.hasPassword ? 'Active' : 'Not set'}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-moons-muted">Google linked</dt>
                  <dd
                    className={`font-semibold ${user.hasGoogle ? 'text-emerald-700 dark:text-emerald-300' : 'text-foreground/75'}`}
                  >
                    {user.hasGoogle ? 'Yes' : 'No'}
                  </dd>
                </div>
              </dl>
            </div>

          <div className="rounded-2xl border border-border bg-surface-elevated p-5 shadow-sm">
              <h3 className="text-sm font-bold text-heading">Quick links</h3>
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href="/profile"
                  className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-semibold text-heading transition hover:border-moons-blue hover:bg-surface"
                >
                  Edit profile
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-semibold text-heading transition hover:border-moons-blue hover:bg-surface"
                >
                  Back to dashboard
                </Link>
                <Link
                  href={isRecruiter ? '/recruiter/jobs' : '/applications'}
                  className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-semibold text-moons-muted transition hover:border-moons-blue hover:text-heading"
                >
                  {isRecruiter ? 'My posted jobs' : 'My applications'}
                </Link>
              </div>
            </div>

          <div className="rounded-2xl border border-border bg-surface-elevated p-5 shadow-sm">
              <h3 className="text-sm font-bold text-heading">Sessions</h3>
              <p className="mt-2 text-sm text-moons-muted">
                Sign out everywhere if you think someone else may have access to your account.
              </p>
              <button
                type="button"
                onClick={() => void handleLogoutAll()}
                disabled={logoutAllLoading || loading}
                className="mt-4 w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
              >
                {logoutAllLoading ? 'Signing out…' : 'Sign out all devices'}
              </button>
            </div>

          <div className="rounded-2xl border border-border bg-surface-elevated p-5 shadow-sm">
              <h3 className="text-sm font-bold text-heading">Security tips</h3>
              <ul className="mt-4 space-y-3 text-sm text-moons-muted">
                <li>Use at least 8 characters with a mix of letters, numbers, and symbols.</li>
                <li>Do not reuse passwords from other websites or apps.</li>
                <li>
                  Changing your password signs other devices out automatically.
                </li>
                <li>
                  If you signed up with Google, you can still add a password for email login.
                </li>
              </ul>
            </div>
        </aside>
      </div>
    </SettingsShell>
  );
}
