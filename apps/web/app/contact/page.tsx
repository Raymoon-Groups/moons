import type { Metadata } from 'next';
import { StaticPageShell, StaticSection } from '@/components/static/static-page';
import { BriefcaseIcon, ClockIcon, MailIcon } from '@/components/static/static-icons';

export const metadata: Metadata = {
  title: 'Contact us — MoonsJob',
  description: 'Get in touch with the MoonsJob team for support, partnerships, or general enquiries.',
};

export default function ContactPage() {
  return (
    <StaticPageShell
      eyebrow="Contact us"
      title="We'd love to hear from you"
      subtitle="Questions, feedback, or need a hand? Reach out and our team will get back to you as soon as possible."
      heroIcon={<MailIcon />}
    >
      <StaticSection heading="Email us" icon={<MailIcon />}>
        <p>
          For support, partnerships, press, or general enquiries, email{' '}
          <a
            href="mailto:support@moonsjob.com"
            className="font-semibold text-moons-blue hover:underline"
          >
            support@moonsjob.com
          </a>
          .
        </p>
      </StaticSection>

      <StaticSection heading="For employers" icon={<BriefcaseIcon />}>
        <p>
          Looking to hire? Create a recruiter account to post jobs and reach qualified candidates.
          For enterprise hiring plans, contact{' '}
          <a
            href="mailto:support@moonsjob.com"
            className="font-semibold text-moons-blue hover:underline"
          >
            support@moonsjob.com
          </a>
          .
        </p>
      </StaticSection>

      <StaticSection heading="Office hours" icon={<ClockIcon />}>
        <p>Our support team is available Monday to Friday, 10:00 AM to 6:00 PM IST.</p>
      </StaticSection>
    </StaticPageShell>
  );
}
