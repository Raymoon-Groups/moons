'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useRef, useState, type ReactNode } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import { ImageCropModal } from '@/components/image-crop-modal';
import { RichTextEditor } from '@/components/rich-text-editor';
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
  metaTitle: string | null;
  metaDescription: string | null;
  displayDate: string | null;
  externalUrl: string | null;
  readTimeMinutes: number;
  published: boolean;
  date: string;
};

type BlogForm = {
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  displayDate: string;
  externalUrl: string;
  coverImageUrl: string;
  body: string;
  excerpt: string;
  category: string;
  section: BlogPost['section'];
  readTimeMinutes: number;
  published: boolean;
};

const EMPTY: BlogForm = {
  title: '',
  slug: '',
  metaTitle: '',
  metaDescription: '',
  displayDate: '',
  externalUrl: '',
  coverImageUrl: '',
  body: '',
  excerpt: '',
  category: 'General',
  section: 'LATEST',
  readTimeMinutes: 5,
  published: false,
};

function FieldLabel({
  children,
  htmlFor,
}: {
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-semibold text-foreground"
    >
      {children}
    </label>
  );
}

function HelpText({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 text-xs leading-relaxed text-moons-muted">{children}</p>;
}

function inputClassName() {
  return 'w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-moons-muted/80 focus:border-moons-blue/50 focus:ring-1 focus:ring-moons-blue/20';
}

export default function AdminBlogsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [form, setForm] = useState<BlogForm>({ ...EMPTY });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropFileName, setCropFileName] = useState('blog-cover.jpg');

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

  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
    };
  }, [cropSrc]);

  function startEdit(post: BlogPost) {
    setEditingId(post.id);
    setForm({
      title: post.title,
      slug: post.slug,
      metaTitle: post.metaTitle ?? '',
      metaDescription: post.metaDescription ?? '',
      displayDate: post.displayDate ?? post.date ?? '',
      externalUrl: post.externalUrl ?? '',
      coverImageUrl: post.coverImageUrl ?? '',
      body: post.body,
      excerpt: post.excerpt,
      category: post.category,
      section: post.section,
      readTimeMinutes: post.readTimeMinutes,
      published: post.published,
    });
    setEditorKey((k) => k + 1);
    setMessage('');
    setError('');
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...EMPTY });
    setEditorKey((k) => k + 1);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function onPickCover(file: File | undefined) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setError('Please choose an image file (JPG, PNG, WEBP, or GIF)');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Image must be 8 MB or smaller before cropping');
      return;
    }
    setError('');
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropFileName(file.name || 'blog-cover.jpg');
    setCropSrc(URL.createObjectURL(file));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function uploadCroppedCover(file: File) {
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
      if (cropSrc) URL.revokeObjectURL(cropSrc);
      setCropSrc(null);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    const payload = {
      title: form.title,
      slug: form.slug || undefined,
      metaTitle: form.metaTitle || null,
      metaDescription: form.metaDescription || null,
      displayDate: form.displayDate || null,
      externalUrl: form.externalUrl || null,
      coverImageUrl: form.coverImageUrl || null,
      body: form.body,
      excerpt: form.excerpt || form.metaDescription || '',
      category: form.category,
      section: form.section,
      readTimeMinutes: Number(form.readTimeMinutes) || 5,
      published: form.published,
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
  const slugPreview = form.slug.trim() || 'your-slug';

  return (
    <AdminShell>
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <form
          onSubmit={onSubmit}
          className="space-y-5 rounded-2xl border border-border/70 bg-surface-elevated p-5 shadow-sm sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-foreground">
              {editingId ? 'Edit blog' : 'Create blog'}
            </h2>
          </div>

          <div>
            <FieldLabel htmlFor="blog-title">Title</FieldLabel>
            <input
              id="blog-title"
              className={inputClassName()}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </div>

          <div>
            <FieldLabel htmlFor="blog-slug">Blog URL slug</FieldLabel>
            <input
              id="blog-slug"
              className={inputClassName()}
              placeholder="10-signs-to-outsource-recruitment"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            />
            <HelpText>
              Public URL:{' '}
              <code className="rounded bg-surface px-1.5 py-0.5 text-[11px]">
                blogs/{slugPreview}
              </code>
            </HelpText>
          </div>

          <div>
            <FieldLabel htmlFor="blog-meta-title">Meta title</FieldLabel>
            <input
              id="blog-meta-title"
              className={inputClassName()}
              placeholder="SEO title for Google + browser tab (not the page H1)"
              value={form.metaTitle}
              onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))}
            />
            <HelpText>
              Shown in the browser tab and search results. Leave blank to use:{' '}
              <span className="text-foreground/80">
                {form.title.trim() || 'Blog title'} / MoonsJob
              </span>
            </HelpText>
          </div>

          <div>
            <FieldLabel htmlFor="blog-meta-description">Meta description</FieldLabel>
            <textarea
              id="blog-meta-description"
              className={`${inputClassName()} min-h-[88px] resize-y`}
              placeholder="Short SEO description for search results (about 150–160 characters)"
              value={form.metaDescription}
              onChange={(e) =>
                setForm((f) => ({ ...f, metaDescription: e.target.value }))
              }
            />
            <HelpText>
              Not shown as page body text. Check browser tab / View Source after save, or Google
              after re-crawl.
            </HelpText>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="blog-display-date">Date (display)</FieldLabel>
              <input
                id="blog-display-date"
                className={inputClassName()}
                placeholder="April 18, 2026"
                value={form.displayDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, displayDate: e.target.value }))
                }
              />
            </div>
            <div>
              <FieldLabel htmlFor="blog-external-url">
                External link override (optional)
              </FieldLabel>
              <input
                id="blog-external-url"
                className={inputClassName()}
                placeholder="Leave blank for blog page URL"
                value={form.externalUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, externalUrl: e.target.value }))
                }
              />
            </div>
          </div>

          <div>
            <FieldLabel>Cover image 16:9</FieldLabel>
            <HelpText>
              Click to upload (cropped to 16:9) or paste a URL below.
            </HelpText>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              disabled={uploading || saving}
              onChange={(e) => onPickCover(e.target.files?.[0])}
            />
            {previewSrc ? (
              <div className="relative mt-2 overflow-hidden rounded-xl border border-border bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewSrc}
                  alt=""
                  className="aspect-video w-full object-cover"
                />
                <div className="absolute right-2 top-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, coverImageUrl: '' }))}
                    className="rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={uploading || saving}
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface px-4 text-center transition hover:border-moons-blue/40 hover:bg-surface-elevated disabled:opacity-60"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-moons-blue/15 text-moons-blue">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 16V4m0 0l-4 4m4-4l4 4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="text-sm font-semibold text-foreground">Upload image</span>
                <span className="text-xs text-moons-muted">16:9</span>
              </button>
            )}
            {uploading ? (
              <p className="mt-2 text-xs text-moons-muted">Uploading…</p>
            ) : null}
          </div>

          <div>
            <FieldLabel htmlFor="blog-cover-url">Image URL or path (optional)</FieldLabel>
            <input
              id="blog-cover-url"
              className={inputClassName()}
              placeholder="https://… or /uploads/blogs/…"
              value={form.coverImageUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, coverImageUrl: e.target.value }))
              }
            />
          </div>

          <div>
            <FieldLabel>Blog content</FieldLabel>
            <HelpText>
              Use headings, bold, and lists — formatting appears on the live blog page.
            </HelpText>
            <div className="mt-2">
              <RichTextEditor
                key={editorKey}
                value={form.body}
                onChange={(html) => setForm((f) => ({ ...f, body: html }))}
                placeholder="Write the full article…"
                minLength={0}
                maxLength={100000}
                disabled={saving}
                variant="blog"
                footerHint="Use Normal / headings, bold, italic, underline, lists, and links."
              />
            </div>
          </div>

          <div className="grid gap-4 rounded-xl border border-border/60 bg-surface p-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="blog-category">Category</FieldLabel>
              <input
                id="blog-category"
                className={inputClassName()}
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              />
            </div>
            <div>
              <FieldLabel htmlFor="blog-section">Section</FieldLabel>
              <select
                id="blog-section"
                className={inputClassName()}
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
            </div>
            <div>
              <FieldLabel htmlFor="blog-read-time">Read time (minutes)</FieldLabel>
              <input
                id="blog-read-time"
                type="number"
                min={1}
                max={60}
                className={inputClassName()}
                value={form.readTimeMinutes}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    readTimeMinutes: Number(e.target.value) || 5,
                  }))
                }
              />
            </div>
            <div>
              <FieldLabel htmlFor="blog-excerpt">Short excerpt (card)</FieldLabel>
              <input
                id="blog-excerpt"
                className={inputClassName()}
                placeholder="Optional — defaults to meta description"
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground sm:col-span-2">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) =>
                  setForm((f) => ({ ...f, published: e.target.checked }))
                }
              />
              Published
            </label>
          </div>

          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border/60 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-moons-muted transition hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="rounded-lg bg-moons-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-moons-blue-dark disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save blog'}
            </button>
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
                          href={post.externalUrl || `/blogs/${post.slug}`}
                          target={post.externalUrl ? '_blank' : undefined}
                          rel={post.externalUrl ? 'noopener noreferrer' : undefined}
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

      <ImageCropModal
        open={Boolean(cropSrc)}
        imageSrc={cropSrc}
        fileName={cropFileName}
        aspect="blog"
        onCancel={() => {
          if (cropSrc) URL.revokeObjectURL(cropSrc);
          setCropSrc(null);
        }}
        onComplete={(file) => {
          void uploadCroppedCover(file);
        }}
      />
    </AdminShell>
  );
}
