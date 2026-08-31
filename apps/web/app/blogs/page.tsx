import type { Metadata } from 'next';
import { BlogsPageContent } from '@/components/blogs/blogs-page';

export const metadata: Metadata = {
  title: 'Blog — MoonsJob',
  description:
    'Career tips, hiring insights, and founder notes from MoonsJob — India’s job portal for candidates and recruiters.',
};

export default function BlogsPage() {
  return <BlogsPageContent />;
}
