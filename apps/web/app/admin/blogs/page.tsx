'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import { ApiError, adminFetch, adminUpload } from '@/lib/api-client';
import { resolveAssetUrl } from '@/lib/assets';

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  section: 'FEATURED' | 'LATEST' | 'FOUNDERS';
  coverImageUrl: string | null;
  readTimeMinutes: number;
  published: boolean;
  date: string;
};

const EMPTY: Omit<BlogPost, 'id' | 'slug' | 'date'> & { slug: string } = {
  title: '',
  excerpt: '',
  body: '',
  category: 'General',
  section: 'LATEST',
  coverImageUrl: '',
  readTimeMinutes: 5,
  published: false,
  slug: '',
};

export default function AdminBlogsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await adminFetch<BlogPost[]>('/blogs/admin/all');
      setPosts(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load blogs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function startEdit(post: BlogPost) {
    setEditingId(post.id);
    setForm({
      title: post.title,
      excerpt: post.excerpt,
      body: post.body,
      category: post.category,
      section: post.section,
      coverImageUrl: post.coverImageUrl ?? '',
      readTimeMinutes: post.readTimeMinutes,
      published: post.published,
      slug: post.slug,
    });
    setMessage('');
    setError('');
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...EMPTY });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function onUploadCover(file: File | undefined) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
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
      const result = await adminUpload<{ coverImageUrl: string }>(
        '/blogs/cover',
        formData,
      );
      setForm((f) => ({ ...f, coverImageUrl: result.coverImageUrl }));
      setMessage('Cover image uploaded. Save the blog to apply it.');
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
      excerpt: form.excerpt,
      body: form.body,
      category: form.category,
      section: form.section,
      coverImageUrl: form.coverImageUrl || null,
      readTimeMinutes: Number(form.readTimeMinutes) || 5,
      published: form.published,
      slug: form.slug || undefined,
    };
    try {
      if (editingId) {
        await adminFetch(`/blogs/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setMessage('Blog updated.');
      } else {
        await adminFetch('/blogs', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setMessage('Blog created.');
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this blog post?')) return;
    try {
      await adminFetch(`/blogs/${id}`, { method: 'DELETE' });
      await load();
      if (editingId === id) resetForm();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    }
  }

  const previewSrc = resolveAssetUrl(form.coverImageUrl || null);

  return (
    <AdminShell>
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <form
          onSubmit={onSubmit}
          className="space-y-3 rounded-2xl border border-border/70 bg-surface-elevated p-5 shadow-sm"
        >
          <h2 className="text-lg font-bold text-foreground">
            {editingId ? 'Edit blog' : 'Create blog'}
          </h2>
          <input
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <input
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
            placeholder="Slug (optional)"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          />
          <input
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          />
          <select
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
            value={form.section}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                section: e.target.value as BlogPost['section'],
              }))
            }
          >
            <option value="FEATURED">Featured</option>
            <option value="LATEST">Latest</option>
            <option value="FOUNDERS">Founders</option>
          </select>

          <div className="space-y-2 rounded-xl border border-border/70 bg-surface p-3">
            <p className="text-sm font-semibold text-foreground">Cover image</p>
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
                  onClick={() => setForm((f) => ({ ...f, coverImageUrl: '' }))}
                  className="absolute right-2 top-2 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white"
                >
                  Remove
                </button>
              </div>
            ) : null}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="block w-full text-sm text-moons-muted file:mr-3 file:rounded-full file:border-0 file:bg-moons-blue file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
              disabled={uploading || saving}
              onChange={(e) => void onUploadCover(e.target.files?.[0])}
            />
            {uploading ? (
              <p className="text-xs text-moons-muted">Uploading…</p>
            ) : null}
          </div>

          <input
            type="number"
            min={1}
            max={60}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
            placeholder="Read time (minutes)"
            value={form.readTimeMinutes}
            onChange={(e) =>
              setForm((f) => ({ ...f, readTimeMinutes: Number(e.target.value) || 5 }))
            }
          />
          <textarea
            className="min-h-20 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
            placeholder="Short excerpt"
            value={form.excerpt}
            onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
          />
          <textarea
            className="min-h-40 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
            placeholder="Full body"
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          />
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
            />
            Published
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
          <h2 className="text-lg font-bold text-foreground">All posts</h2>
          {loading ? (
            <p className="mt-4 text-sm text-moons-muted">Loading…</p>
          ) : posts.length === 0 ? (
            <p className="mt-4 text-sm text-moons-muted">No blogs yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {posts.map((post) => (
                <li
                  key={post.id}
                  className="rounded-xl border border-border/60 bg-surface p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{post.title}</p>
                      <p className="mt-1 text-xs text-moons-muted">
                        {post.section} · {post.published ? 'Published' : 'Draft'} · {post.date}
                      </p>
                      {post.published ? (
                        <Link
                          href={`/blogs/${post.slug}`}
                          className="mt-1 inline-block text-xs font-semibold text-moons-blue"
                        >
                          View public
                        </Link>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(post)}
                        className="text-xs font-semibold text-moons-blue"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(post.id)}
                        className="text-xs font-semibold text-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
