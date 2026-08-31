import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BLOG_POSTS } from '@/lib/blog-posts';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

type BlogDetailPageProps = {
  params: Promise<{ slug: string }>;
};

type ApiBlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  coverImageUrl: string | null;
  readTime: string;
  date: string;
};

async function loadPost(slug: string): Promise<ApiBlogPost | null> {
  try {
    const res = await fetch(`${API_URL}/blogs/${slug}`, { next: { revalidate: 30 } });
    if (res.ok) return (await res.json()) as ApiBlogPost;
  } catch {
    // fall through to static
  }
  const staticPost = BLOG_POSTS.find((item) => item.id === slug);
  if (!staticPost) return null;
  return {
    id: staticPost.id,
    slug: staticPost.id,
    title: staticPost.title,
    excerpt: staticPost.excerpt,
    body: staticPost.excerpt,
    category: staticPost.category,
    coverImageUrl: staticPost.image,
    readTime: staticPost.readTime,
    date: staticPost.date,
  };
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) return { title: 'Blog — MoonsJob' };
  return {
    title: `${post.title} — MoonsJob Blog`,
    description: post.excerpt,
  };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) notFound();

  return (
    <div className="li-page-bg">
      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-14">
        <Link
          href="/blogs"
          className="inline-flex items-center gap-2 text-sm font-semibold text-moons-blue hover:underline"
        >
          ← Back to blogs
        </Link>

        <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
          {post.category}
        </div>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-3 text-sm text-moons-muted">
          {post.date} · {post.readTime}
        </p>

        {post.coverImageUrl ? (
          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-[24px] bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.coverImageUrl} alt="" className="h-full w-full object-cover" />
          </div>
        ) : null}

        <div className="mt-8 space-y-4 text-[15px] leading-7 text-moons-muted">
          {post.body
            ? post.body.split(/\n+/).map((para) => <p key={para.slice(0, 24)}>{para}</p>)
            : <p>{post.excerpt}</p>}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/jobs"
            className="rounded-full bg-moons-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-moons-blue-dark"
          >
            Browse jobs
          </Link>
          <Link
            href="/blogs"
            className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-moons-blue/40"
          >
            More articles
          </Link>
        </div>
      </article>
    </div>
  );
}
