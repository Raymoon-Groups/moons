export type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
  section: 'featured' | 'latest' | 'founders';
};

/** Static samples removed — blogs come from the API / admin only. */
export const BLOG_POSTS: BlogPost[] = [];

export function getFeaturedPost() {
  return BLOG_POSTS.find((post) => post.section === 'featured') ?? BLOG_POSTS[0];
}

export function getLatestPosts(limit = 4) {
  return BLOG_POSTS.filter((post) => post.section === 'latest').slice(0, limit);
}

export function getFoundersPosts() {
  return BLOG_POSTS.filter((post) => post.section === 'founders');
}
