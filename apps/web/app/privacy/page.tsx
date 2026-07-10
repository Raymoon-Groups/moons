import type { Metadata } from 'next';
import { StaticPageShell, StaticSection } from '@/components/static/static-page';
import {
  DocIcon,
  EyeIcon,
  LockIcon,
  ShareIcon,
  UserCheckIcon,
} from '@/components/static/static-icons';

export const metadata: Metadata = {
  title: 'Privacy Policy — MoonsJob',
  description: 'How MoonsJob collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
  return (
    <StaticPageShell
      eyebrow="Legal"
      title="Privacy Policy"
      subtitle="Your privacy matters. This policy explains what data we collect and how we use and protect it."
      updated="8 July 2026"
      heroIcon={<LockIcon />}
    >
      <StaticSection heading="1. Information we collect" icon={<DocIcon />}>
        <ul className="list-disc space-y-2 pl-5">
          <li>Account details such as your name, email address, and password.</li>
          <li>Profile information you provide, including your resume, skills, and experience.</li>
          <li>Usage data such as pages viewed and actions taken on the platform.</li>
        </ul>
      </StaticSection>

      <StaticSection heading="2. How we use your information" icon={<EyeIcon />}>
        <p>
          We use your information to operate the platform, match you with relevant jobs or
          candidates, enable messaging, and improve our services. We do not sell your personal data.
        </p>
      </StaticSection>

      <StaticSection heading="3. Sharing" icon={<ShareIcon />}>
        <p>
          Profile information you choose to make visible may be shown to recruiters and other users.
          We share data with service providers only as needed to run the platform, under
          appropriate safeguards.
        </p>
      </StaticSection>

      <StaticSection heading="4. Data security" icon={<LockIcon />}>
        <p>
          We use industry-standard measures to protect your data. However, no method of transmission
          over the internet is completely secure, and we cannot guarantee absolute security.
        </p>
      </StaticSection>

      <StaticSection heading="5. Your rights" icon={<UserCheckIcon />}>
        <p>
          You can access, update, or delete your profile information at any time from your account
          settings. To request full account deletion, contact{' '}
          <a
            href="mailto:privacy@moonsjob.com"
            className="font-semibold text-moons-blue hover:underline"
          >
            privacy@moonsjob.com
          </a>
          .
        </p>
      </StaticSection>
    </StaticPageShell>
  );
}
