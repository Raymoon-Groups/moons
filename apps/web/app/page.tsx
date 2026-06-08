import { JobPortalHero } from '@/components/landing/job-search-hero';
import {
  BrowseCategories,
  CareerServices,
  EmployerBanner,
  JobsByCity,
  PopularSearchTags,
  StatsBar,
  TopCompanies,
  TrendingJobs,
} from '@/components/landing/landing-sections';
import { SiteFooter } from '@/components/site-footer';

export default function Home() {
  return (
    <>
      <JobPortalHero />
      <StatsBar />
      <BrowseCategories />
      <TrendingJobs />
      <TopCompanies />
      <JobsByCity />
      <CareerServices />
      <PopularSearchTags />
      <EmployerBanner />
      <SiteFooter />
    </>
  );
}
