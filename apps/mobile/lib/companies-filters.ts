import type { CompanyListing } from '@/lib/types';

export const COMPANY_CATEGORIES = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'mnc', label: 'MNCs', match: (c: CompanyListing) => c.companyType === 'MNC' },
  { id: 'startup', label: 'Startups', match: (c: CompanyListing) => c.companyType === 'Startup' },
  {
    id: 'edtech',
    label: 'Edtech',
    match: (c: CompanyListing) => c.industry?.toLowerCase().includes('edtech') ?? false,
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    match: (c: CompanyListing) => c.industry?.toLowerCase().includes('health') ?? false,
  },
  {
    id: 'internet',
    label: 'Internet',
    match: (c: CompanyListing) => c.industry?.toLowerCase().includes('internet') ?? false,
  },
  {
    id: 'software',
    label: 'Software',
    match: (c: CompanyListing) => c.industry?.toLowerCase().includes('software') ?? false,
  },
] as const;

export type CompanySortKey = 'jobs' | 'name';

export function filterCompanies(
  companies: CompanyListing[],
  opts: {
    categoryId: string;
    searchQ: string;
    locationQ: string;
    sortBy: CompanySortKey;
  },
) {
  const category = COMPANY_CATEGORIES.find((c) => c.id === opts.categoryId) ?? COMPANY_CATEGORIES[0];
  const q = opts.searchQ.trim().toLowerCase();
  const loc = opts.locationQ.trim().toLowerCase();

  let list = companies.filter((c) => {
    if (!category.match(c)) return false;
    if (q && !c.companyName.toLowerCase().includes(q) && !c.industry?.toLowerCase().includes(q)) {
      return false;
    }
    if (loc && !c.location?.toLowerCase().includes(loc)) return false;
    return true;
  });

  list = [...list].sort((a, b) => {
    if (opts.sortBy === 'name') return a.companyName.localeCompare(b.companyName);
    return b.openJobs - a.openJobs || a.companyName.localeCompare(b.companyName);
  });

  return list;
}
