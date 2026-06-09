export const landingImages = {
  categories: {
    tech: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&q=80&auto=format&fit=crop',
    sales: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&q=80&auto=format&fit=crop',
    finance: 'https://images.unsplash.com/photo-1554224311-beee415c201f?w=400&q=80&auto=format&fit=crop',
    hr: 'https://images.unsplash.com/photo-1521737711869-e3b97375f902?w=400&q=80&auto=format&fit=crop',
    healthcare: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=80&auto=format&fit=crop',
    design: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&q=80&auto=format&fit=crop',
    engineering: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&q=80&auto=format&fit=crop',
    operations: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=80&auto=format&fit=crop',
  },
  locations: {
    bangalore: 'https://images.unsplash.com/photo-1596176530529-d782abadf088?w=500&q=80&auto=format&fit=crop',
    mumbai: 'https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=500&q=80&auto=format&fit=crop',
    delhi: 'https://images.unsplash.com/photo-1587474260587-136574528ed5?w=500&q=80&auto=format&fit=crop',
    hyderabad: 'https://images.unsplash.com/photo-1619589832677-a0d8a438a026?w=500&q=80&auto=format&fit=crop',
    pune: 'https://images.unsplash.com/photo-1599669454699-248be65387a5?w=500&q=80&auto=format&fit=crop',
    chennai: 'https://images.unsplash.com/photo-1583417319070-4a872db89142?w=500&q=80&auto=format&fit=crop',
  },
  services: {
    profile: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=80&auto=format&fit=crop',
    alert: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&q=80&auto=format&fit=crop',
    salary: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&q=80&auto=format&fit=crop',
    resume: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=300&q=80&auto=format&fit=crop',
  },
  employer: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80&auto=format&fit=crop',
} as const;

export const stats = [
  {
    value: '5 Lakh+',
    label: 'Live Jobs',
    sublabel: 'Active openings updated daily',
  },
  {
    value: '50,000+',
    label: 'Recruiters',
    sublabel: 'From startups to enterprises',
  },
  {
    value: '2 Crore+',
    label: 'Jobseekers',
    sublabel: 'Across 100+ cities in India',
  },
  {
    value: '10,000+',
    label: 'Jobs Posted Daily',
    sublabel: 'Fresh roles every single day',
  },
] as const;

export const mockJobs = [
  {
    id: '1',
    title: 'Senior Software Engineer',
    company: 'Infosys',
    logo: 'https://logo.clearbit.com/infosys.com',
    experience: '3–6 yrs',
    location: 'Bangalore',
    salary: '₹12–18 LPA',
    skills: ['React', 'Node.js'],
    posted: '2 days ago',
    type: 'Full-time',
  },
  {
    id: '2',
    title: 'Product Manager',
    company: 'Flipkart',
    logo: 'https://logo.clearbit.com/flipkart.com',
    experience: '5–8 yrs',
    location: 'Bangalore',
    salary: '₹25–40 LPA',
    skills: ['Agile', 'Analytics'],
    posted: '1 day ago',
    type: 'Full-time',
  },
  {
    id: '3',
    title: 'Data Analyst',
    company: 'HDFC Bank',
    logo: 'https://logo.clearbit.com/hdfcbank.com',
    experience: '1–3 yrs',
    location: 'Mumbai',
    salary: '₹6–10 LPA',
    skills: ['SQL', 'Python'],
    posted: 'Today',
    type: 'Full-time',
  },
  {
    id: '4',
    title: 'UI/UX Designer',
    company: 'Zomato',
    logo: 'https://logo.clearbit.com/zomato.com',
    experience: '2–5 yrs',
    location: 'Gurgaon',
    salary: '₹10–16 LPA',
    skills: ['Figma'],
    posted: '3 days ago',
    type: 'Remote',
  },
] as const;

export const categories = [
  { name: 'IT & Software', count: '1.2L+', image: landingImages.categories.tech, slug: 'software' },
  { name: 'Sales & Marketing', count: '80K+', image: landingImages.categories.sales, slug: 'sales' },
  { name: 'Finance & Accounts', count: '45K+', image: landingImages.categories.finance, slug: 'finance' },
  { name: 'HR & Admin', count: '35K+', image: landingImages.categories.hr, slug: 'hr' },
  { name: 'Healthcare', count: '25K+', image: landingImages.categories.healthcare, slug: 'healthcare' },
  { name: 'Design & Creative', count: '18K+', image: landingImages.categories.design, slug: 'design' },
  { name: 'Engineering', count: '60K+', image: landingImages.categories.engineering, slug: 'engineering' },
  { name: 'Operations', count: '40K+', image: landingImages.categories.operations, slug: 'operations' },
] as const;

export const topCompanies = [
  {
    name: 'TCS',
    image: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=500&q=80&auto=format&fit=crop',
    tagline: '1,200+ open roles',
  },
  {
    name: 'Infosys',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&q=80&auto=format&fit=crop',
    tagline: '900+ open roles',
  },
  {
    name: 'Amazon',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=500&q=80&auto=format&fit=crop',
    tagline: '2,400+ open roles',
  },
  {
    name: 'Wipro',
    image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=500&q=80&auto=format&fit=crop',
    tagline: '750+ open roles',
  },
  {
    name: 'Accenture',
    image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=500&q=80&auto=format&fit=crop',
    tagline: '1,100+ open roles',
  },
  {
    name: 'HCL',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&q=80&auto=format&fit=crop',
    tagline: '680+ open roles',
  },
  {
    name: 'Microsoft',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&q=80&auto=format&fit=crop',
    tagline: '540+ open roles',
  },
  {
    name: 'Google',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500&q=80&auto=format&fit=crop',
    tagline: '420+ open roles',
  },
] as const;

/**
 * mapX/mapY — pin positions on @svg-maps/india (viewBox 0 0 612 696),
 * derived from each city's lat/lon projected onto the map bounds.
 */
export const popularLocations = [
  { city: 'Bangalore', jobs: '18,200', mapX: 203, mapY: 578, locationQuery: 'Bangalore' },
  { city: 'Mumbai', jobs: '14,500', mapX: 101, mapY: 432, locationQuery: 'Mumbai' },
  { city: 'Delhi / NCR', jobs: '16,800', mapX: 194, mapY: 202, locationQuery: 'Delhi' },
  { city: 'Hyderabad', jobs: '11,300', mapX: 221, mapY: 471, locationQuery: 'Hyderabad' },
  { city: 'Pune', jobs: '9,800', mapX: 122, mapY: 444, locationQuery: 'Pune' },
  { city: 'Chennai', jobs: '8,400', mapX: 259, mapY: 574, locationQuery: 'Chennai' },
] as const;

export const careerServices = [
  {
    title: 'Create your profile',
    desc: 'Get noticed by recruiters',
    category: 'Profile',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80&auto=format&fit=crop',
    href: '/register',
  },
  {
    title: 'Create job alert',
    desc: 'Get jobs in your inbox',
    category: 'Alerts',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80&auto=format&fit=crop',
    href: '/register',
  },
  {
    title: 'Check salary trends',
    desc: 'Know your market worth',
    category: 'Insights',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80&auto=format&fit=crop',
    href: '/jobs',
  },
  {
    title: 'Upload your resume',
    desc: 'Apply faster to jobs',
    category: 'Resume',
    image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&q=80&auto=format&fit=crop',
    href: '/register',
  },
] as const;

export const quickFilters = [
  'Remote', 'Fresher', 'MNC', 'Startup', 'Walk-in', 'Part-time',
] as const;

export const popularSearches = [
  'Work from home',
  'Python developer',
  'MBA freshers',
  'Bank jobs',
  'Java developer',
  'HR jobs',
  'Internship',
  'Data analyst',
] as const;
