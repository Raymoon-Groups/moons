import type { Metadata } from 'next';
import { StaticPageShell, StaticSection } from '@/components/static/static-page';
import { HeartIcon, InfoIcon, SparkIcon, TargetIcon } from '@/components/static/static-icons';

export const metadata: Metadata = {
  title: 'About — MoonsJob',
  description:
    'Learn about MoonsJob, India\u2019s job portal helping candidates find work and recruiters hire talent.',
};

export default function AboutPage() {
  return (
    <StaticPageShell
      eyebrow="About us"
      title="Helping India find work and hire talent"
      subtitle="MoonsJob connects job seekers with recruiters across the country — making it faster and easier to find the right role or the right person."
      heroIcon={<InfoIcon />}
    >
      <StaticSection heading="Our mission" icon={<TargetIcon />}>
        <p>
          We believe finding a job or hiring great people shouldn&apos;t be complicated. MoonsJob
          brings jobs, professional profiles, and direct messaging together in one modern platform
          so opportunities move as fast as you do.
        </p>
      </StaticSection>

      <StaticSection heading="What we offer" icon={<SparkIcon />}>
        <ul className="list-disc space-y-2 pl-5">
          <li>Thousands of active jobs across industries and cities.</li>
          <li>Professional profiles that showcase your skills and experience.</li>
          <li>Direct messaging and networking with recruiters and peers.</li>
          <li>Tools for employers to post jobs and discover qualified candidates.</li>
        </ul>
      </StaticSection>

      <StaticSection heading="Why MoonsJob" icon={<HeartIcon />}>
        <p>
          Whether you&apos;re taking the next step in your career or building your team, we&apos;re
          committed to a safe, transparent, and efficient hiring experience for everyone.
        </p>
      </StaticSection>
    </StaticPageShell>
  );
}
