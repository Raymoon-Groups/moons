import { CompanyDetailPage } from '@/components/companies/company-detail-page';

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ recruiterId: string }>;
}) {
  const { recruiterId } = await params;
  return <CompanyDetailPage recruiterId={recruiterId} />;
}
