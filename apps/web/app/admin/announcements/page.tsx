'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import { ApiError, authFetch, authUpload } from '@/lib/api-client';
import { resolveAssetUrl } from '@/lib/assets';

type Announcement = {
  id: string;
  title: string;
  body: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  imageUrl: string | null;
  active: boolean;
  durationSec: number;
  updatedAt: string;
};

const EMPTY = {
  title: '',
  body: '',
  ctaLabel: '',
  ctaUrl: '',
  imageUrl: '',
  active: true,
  durationSec: 5,
};

export default function AdminAnnouncementsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Announcement[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await authFetch<Announcement[]>('/announcements');
      setItems(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function startEdit(item: Announcement) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      body: item.body,
      ctaLabel: item.ctaLabel ?? '',
      ctaUrl: item.ctaUrl ?? '',
      imageUrl: item.imageUrl ?? '',
      active: item.active,
      durationSec: item.durationSec,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function onUploadImage(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPG, PNG, WEBP, or GIF)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be 5 MB or smaller');
      return;
    }

    setUploading(true);
    setError('');
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const result = await authUpload<{ imageUrl: string }>(
        '/announcements/image',
        formData,
      );
      setForm((f) => ({ ...f, imageUrl: result.imageUrl }));
      setMessage('Image uploaded. Save the announcement to apply it.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Image upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    const payload = {
      title: form.title,
      body: form.body,
      ctaLabel: form.ctaLabel || null,
      ctaUrl: form.ctaUrl || null,
      imageUrl: form.imageUrl || null,
      active: form.active,
      durationSec: Number(form.durationSec) || 5,
    };
    try {
      if (editingId) {
        await authFetch(`/announcements/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setMessage('Announcement updated.');
      } else {
        await authFetch('/announcements', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setMessage('Announcement created.');
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(item: Announcement) {
    const nextActive = !item.active;
    setTogglingId(item.id);
    setError('');
    setMessage('');
    try {
      await authFetch(`/announcements/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: item.title,
          body: item.body,
          ctaLabel: item.ctaLabel,
          ctaUrl: item.ctaUrl,
          imageUrl: item.imageUrl,
          durationSec: item.durationSec,
          active: nextActive,
        }),
      });
      setMessage(
        nextActive
          ? `"${item.title}" is now active.`
          : `"${item.title}" deactivated.`,
      );
      if (editingId === item.id) {
        setForm((f) => ({ ...f, active: nextActive }));
      }
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update status');
    } finally {
      setTogglingId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this announcement?')) return;
    try {
      await authFetch(`/announcements/${id}`, { method: 'DELETE' });
      await load();
      if (editingId === id) resetForm();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    }
  }

  const previewSrc = resolveAssetUrl(form.imageUrl || null);

  return (
    <AdminShell>
      <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
        Active popups appear on the landing page. If more than one is active, they show as a
        carousel with left/right controls (3 seconds per slide) and a close (×) button.
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <form
          onSubmit={onSubmit}
          className="space-y-3 rounded-2xl border border-border/70 bg-surface-elevated p-5 shadow-sm"
        >
          <h2 className="text-lg font-bold text-foreground">
            {editingId ? 'Edit announcement' : 'New popup announcement'}
          </h2>
          <input
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
            placeholder="Popup title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <textarea
            className="min-h-24 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
            placeholder="Popup message"
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          />
          <input
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
            placeholder="Button label (optional)"
            value={form.ctaLabel}
            onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))}
          />
          <input
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
            placeholder="Button link (optional)"
            value={form.ctaUrl}
            onChange={(e) => setForm((f) => ({ ...f, ctaUrl: e.target.value }))}
          />

          <div className="space-y-2 rounded-xl border border-border/70 bg-surface p-3">
            <p className="text-sm font-semibold text-foreground">Popup image (optional)</p>
            {previewSrc ? (
              <div className="relative overflow-hidden rounded-xl bg-surface-elevated">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewSrc}
                  alt=""
                  className="h-36 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}
                  className="absolute right-2 top-2 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white"
                >
                  Remove
                </button>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="block w-full text-sm text-moons-muted file:mr-3 file:rounded-full file:border-0 file:bg-moons-blue file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
                disabled={uploading || saving}
                onChange={(e) => void onUploadImage(e.target.files?.[0])}
              />
              {uploading ? (
                <p className="text-xs text-moons-muted">Uploading…</p>
              ) : null}
            </div>
            <input
              className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-sm"
              placeholder="Or paste image URL"
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            />
          </div>

          <input
            type="number"
            min={3}
            max={30}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
            placeholder="Duration seconds"
            value={form.durationSec}
            onChange={(e) =>
              setForm((f) => ({ ...f, durationSec: Number(e.target.value) || 5 }))
            }
          />
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            Active on landing page
          </label>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || uploading}
              className="rounded-full bg-moons-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-border px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        <div className="rounded-2xl border border-border/70 bg-surface-elevated p-5 shadow-sm">
          <h2 className="text-lg font-bold text-foreground">Saved announcements</h2>
          {loading ? (
            <p className="mt-4 text-sm text-moons-muted">Loading…</p>
          ) : items.length === 0 ? (
            <p className="mt-4 text-sm text-moons-muted">No announcements yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {items.map((item) => {
                const thumb = resolveAssetUrl(item.imageUrl);
                return (
                  <li key={item.id} className="rounded-xl border border-border/60 bg-surface p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 gap-3">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt=""
                            className="h-12 w-12 shrink-0 rounded-lg object-cover"
                          />
                        ) : null}
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">{item.title}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-3">
                            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-foreground">
                              <span className="relative inline-flex h-5 w-9 shrink-0 items-center">
                                <input
                                  type="checkbox"
                                  role="switch"
                                  aria-label={
                                    item.active
                                      ? `Deactivate ${item.title}`
                                      : `Activate ${item.title}`
                                  }
                                  checked={item.active}
                                  disabled={togglingId === item.id}
                                  onChange={() => void toggleActive(item)}
                                  className="peer sr-only"
                                />
                                <span className="absolute inset-0 rounded-full bg-border transition peer-checked:bg-moons-blue peer-disabled:opacity-60" />
                                <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
                              </span>
                              {togglingId === item.id
                                ? 'Updating…'
                                : item.active
                                  ? 'Active'
                                  : 'Inactive'}
                            </label>
                            <p className="text-xs text-moons-muted">
                              {item.durationSec}s · {new Date(item.updatedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="text-xs font-semibold text-moons-blue"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(item.id)}
                          className="text-xs font-semibold text-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
