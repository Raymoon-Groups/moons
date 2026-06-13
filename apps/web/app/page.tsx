import dynamic from 'next/dynamic';
import { JobPortalHero } from '@/components/landing/job-search-hero';
import { StatsBar } from '@/components/landing/landing-sections';
import { SiteFooter } from '@/components/site-footer';

const BrowseCategories = dynamic(
  () => import('@/components/landing/landing-sections').then((m) => m.BrowseCategories),
  { loading: () => <SectionSkeleton /> },
);

const TrendingJobsSection = dynamic(
  () => import('@/components/landing/trending-jobs-section').then((m) => m.TrendingJobsSection),
  { loading: () => <SectionSkeleton /> },
);

const TopCompaniesSection = dynamic(
  () => import('@/components/landing/top-companies-section').then((m) => m.TopCompaniesSection),
  { loading: () => <SectionSkeleton /> },
);

const JobsByCity = dynamic(
  () => import('@/components/landing/landing-sections').then((m) => m.JobsByCity),
  { loading: () => <SectionSkeleton /> },
);

const CareerServices = dynamic(
  () => import('@/components/landing/landing-sections').then((m) => m.CareerServices),
  { loading: () => <SectionSkeleton /> },
);

const PopularSearchTags = dynamic(
  () => import('@/components/landing/landing-sections').then((m) => m.PopularSearchTags),
  { loading: () => <SectionSkeleton /> },
);

const EmployerBanner = dynamic(
  () => import('@/components/landing/landing-sections').then((m) => m.EmployerBanner),
  { loading: () => <SectionSkeleton /> },
);

function SectionSkeleton() {
  return <div className="mx-auto h-48 max-w-7xl animate-pulse rounded-xl bg-surface px-4" />;
}

export default function Home() {
  return (
    <>
      <JobPortalHero />
      <StatsBar />
      <BrowseCategories />
      <TrendingJobsSection />
      <TopCompaniesSection />
      <JobsByCity />
      <CareerServices />
      <PopularSearchTags />
      <EmployerBanner />
      <SiteFooter />
    </>
  );
}
