import { JobPortalHero } from '@/components/landing/job-search-hero';
import {
  BrowseCategories,
  CareerServices,
  EmployerBanner,
  JobsByCity,
  PopularSearchTags,
  StatsBar,
} from '@/components/landing/landing-sections';
import { TopCompaniesSection } from '@/components/landing/top-companies-section';
import { TrendingJobsSection } from '@/components/landing/trending-jobs-section';
import { SiteFooter } from '@/components/site-footer';

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
