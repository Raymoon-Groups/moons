import {
  StaticBulletList,
  StaticEmailLink,
  StaticPageScreen,
  StaticParagraph,
  StaticSection,
} from '@/components/static/static-page';

export default function AboutScreen() {
  return (
    <StaticPageScreen
      eyebrow="About us"
      title="Helping India find work and hire talent"
      subtitle="MoonsJob connects job seekers with recruiters across the country — making it faster and easier to find the right role or the right person."
    >
      <StaticSection heading="Our mission">
        <StaticParagraph>
          We believe finding a job or hiring great people shouldn&apos;t be complicated. MoonsJob
          brings jobs, professional profiles, and direct messaging together in one modern platform
          so opportunities move as fast as you do.
        </StaticParagraph>
      </StaticSection>

      <StaticSection heading="What we offer">
        <StaticBulletList
          items={[
            'Thousands of active jobs across industries and cities.',
            'Professional profiles that showcase your skills and experience.',
            'Direct messaging and networking with recruiters and peers.',
            'Tools for employers to post jobs and discover qualified candidates.',
          ]}
        />
      </StaticSection>

      <StaticSection heading="Why MoonsJob">
        <StaticParagraph>
          Whether you&apos;re taking the next step in your career or building your team, we&apos;re
          committed to a safe, transparent, and efficient hiring experience for everyone.
        </StaticParagraph>
      </StaticSection>
    </StaticPageScreen>
  );
}
