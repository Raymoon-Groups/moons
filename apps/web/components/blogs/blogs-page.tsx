'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api-client';

type ApiBlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  section: 'FEATURED' | 'LATEST' | 'FOUNDERS';
  coverImageUrl: string | null;
  readTime: string;
  date: string;
};

type UiPost = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
  section: 'featured' | 'latest' | 'founders';
};

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80';

const FOUNDERS_PER_PAGE = 3;

function mapApiPost(post: ApiBlogPost): UiPost {
  return {
    id: post.slug || post.id,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    date: post.date,
    readTime: post.readTime,
    image: post.coverImageUrl || FALLBACK_IMAGE,
    section:
      post.section === 'FEATURED'
        ? 'featured'
        : post.section === 'FOUNDERS'
          ? 'founders'
          : 'latest',
  };
}

function CategoryPill({
  category,
  light = false,
}: {
  category: string;
  light?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
        light
          ? 'bg-white/90 text-slate-900 shadow-sm backdrop-blur'
          : 'bg-transparent text-foreground'
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
      {category}
    </span>
  );
}

function MetaLine({ date, readTime, light = false }: { date: string; readTime: string; light?: boolean }) {
  return (
    <p className={`text-xs ${light ? 'text-white/80' : 'text-moons-muted'}`}>
      {date} · {readTime}
    </p>
  );
}

function ArrowButton({
  direction,
  onClick,
  disabled,
  label,
}: {
  direction: 'left' | 'right';
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-foreground transition hover:border-moons-blue/40 hover:text-moons-blue disabled:cursor-not-allowed disabled:opacity-40"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {direction === 'left' ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        )}
      </svg>
    </button>
  );
}

function Cover({ src, className }: { src: string; className?: string }) {
  const isRemote = src.startsWith('http');
  if (!isRemote) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className={className ?? 'h-full w-full object-cover'} />
    );
  }
  return (
    <Image
      src={src}
      alt=""
      fill
      className="object-cover transition duration-500 group-hover:scale-[1.03]"
      sizes="(max-width: 1024px) 100vw, 66vw"
    />
  );
}

export function BlogsPageContent() {
  const [posts, setPosts] = useState<UiPost[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<ApiBlogPost[]>('/blogs')
      .then((data) => setPosts(data.map(mapApiPost)))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  const featured =
    posts.find((p) => p.section === 'featured') ?? posts[0] ?? null;
  const latest = posts.filter((p) => p.section === 'latest').slice(0, 4);
  const foundersList = posts.filter((p) => p.section === 'founders');
  const totalPages = Math.max(1, Math.ceil(foundersList.length / FOUNDERS_PER_PAGE));

  const pagePosts = useMemo(() => {
    const start = (page - 1) * FOUNDERS_PER_PAGE;
    return foundersList.slice(start, start + FOUNDERS_PER_PAGE);
  }, [foundersList, page]);

  return (
    <div className="li-page-bg">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-moons-blue">Blog</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Insights for careers and hiring
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-moons-muted sm:text-base">
            Product updates, founder notes, and practical guides for jobseekers and recruiters on
            MoonsJob.
          </p>
        </div>

        {loading ? (
          <div className="h-80 animate-pulse rounded-[28px] bg-surface" />
        ) : !posts.length || !featured ? (
          <div className="rounded-[28px] border border-border/70 bg-surface-elevated/80 px-6 py-16 text-center">
            <p className="text-lg font-semibold text-foreground">No blog posts yet</p>
            <p className="mt-2 text-sm text-moons-muted">
              New articles will appear here once published from the admin desk.
            </p>
          </div>
        ) : (
          <>
            <section className="grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)] lg:gap-10">
              <Link
                href={`/blogs/${featured.id}`}
                className="group relative block min-h-[360px] overflow-hidden rounded-[28px] md:min-h-[460px]"
              >
                <Cover src={featured.image} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/20 bg-white/10 p-5 shadow-lg backdrop-blur-md sm:inset-x-6 sm:bottom-6 sm:p-6">
                  <CategoryPill category={featured.category} light />
                  <h2 className="mt-3 max-w-2xl text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl">
                    {featured.title}
                  </h2>
                  <div className="mt-3">
                    <MetaLine date={featured.date} readTime={featured.readTime} light />
                  </div>
                </div>
              </Link>

              <aside className="rounded-[24px] border border-border/70 bg-surface-elevated/80 p-5 shadow-sm sm:p-6">
                <h2 className="text-lg font-bold text-foreground">Latest post</h2>
                <div className="mt-4 divide-y divide-border/70">
                  {latest.length ? (
                    latest.map((post) => (
                      <Link
                        key={post.id}
                        href={`/blogs/${post.id}`}
                        className="group flex gap-4 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-surface">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={post.image} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold leading-snug text-foreground transition group-hover:text-moons-blue sm:text-[15px]">
                            {post.title}
                          </h3>
                          <div className="mt-2">
                            <MetaLine date={post.date} readTime={post.readTime} />
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="py-2 text-sm text-moons-muted">No latest posts yet.</p>
                  )}
                </div>
              </aside>
            </section>

            {foundersList.length > 0 && (
            <section className="mt-14 md:mt-16">
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Founders corner</h2>
                <div className="flex items-center gap-2">
                  <ArrowButton
                    direction="left"
                    label="Previous founders posts"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  />
                  <ArrowButton
                    direction="right"
                    label="Next founders posts"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {pagePosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blogs/${post.id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-surface-elevated shadow-sm transition hover:border-moons-blue/30 hover:shadow-md"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-surface">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.image}
                        alt=""
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <CategoryPill category={post.category} />
                      <h3 className="mt-3 text-lg font-bold leading-snug text-foreground transition group-hover:text-moons-blue">
                        {post.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-moons-muted">
                        {post.excerpt}
                      </p>
                      <div className="mt-auto pt-4">
                        <MetaLine date={post.date} readTime={post.readTime} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <nav
                aria-label="Founders corner pagination"
                className="mt-10 flex items-center justify-center gap-2"
              >
                <ArrowButton
                  direction="left"
                  label="Previous page"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                />
                {Array.from({ length: totalPages }, (_, index) => {
                  const pageNumber = index + 1;
                  const active = pageNumber === page;
                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      aria-current={active ? 'page' : undefined}
                      onClick={() => setPage(pageNumber)}
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition ${
                        active
                          ? 'bg-foreground text-background'
                          : 'text-moons-muted hover:bg-surface hover:text-foreground'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                <ArrowButton
                  direction="right"
                  label="Next page"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                />
              </nav>
            </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
