import { redirect } from 'next/navigation';

export default async function FeedRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ post?: string }>;
}) {
  const params = await searchParams;
  const qs = params.post ? `?post=${encodeURIComponent(params.post)}` : '';
  redirect(`/dashboard${qs}`);
}
