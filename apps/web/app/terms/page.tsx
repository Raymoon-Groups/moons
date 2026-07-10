import type { Metadata } from 'next';
import { StaticPageShell, StaticSection } from '@/components/static/static-page';
import {
  DocIcon,
  ScaleIcon,
  ShieldIcon,
  SparkIcon,
  UserCheckIcon,
} from '@/components/static/static-icons';

export const metadata: Metadata = {
  title: 'Terms & Conditions — MoonsJob',
  description: 'The terms and conditions governing your use of the MoonsJob platform.',
};

export default function TermsPage() {
  return (
    <StaticPageShell
      eyebrow="Legal"
      title="Terms & Conditions"
      subtitle="Please read these terms carefully. By using MoonsJob, you agree to the terms set out below."
      updated="8 July 2026"
      heroIcon={<ScaleIcon />}
    >
      <StaticSection heading="1. Acceptance of terms" icon={<DocIcon />}>
        <p>
          By accessing or using MoonsJob, you agree to be bound by these Terms &amp; Conditions and
          our Privacy Policy. If you do not agree, please do not use the platform.
        </p>
      </StaticSection>

      <StaticSection heading="2. Your account" icon={<UserCheckIcon />}>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and
          for all activity that occurs under your account. You must provide accurate and complete
          information when creating a profile.
        </p>
      </StaticSection>

      <StaticSection heading="3. Acceptable use" icon={<ShieldIcon />}>
        <ul className="list-disc space-y-2 pl-5">
          <li>Do not post false, misleading, or fraudulent job listings or profiles.</li>
          <li>Do not harass, spam, or impersonate other users.</li>
          <li>Do not attempt to disrupt or gain unauthorized access to the platform.</li>
        </ul>
      </StaticSection>

      <StaticSection heading="4. Content" icon={<DocIcon />}>
        <p>
          You retain ownership of content you submit but grant MoonsJob a license to display and
          distribute it as needed to operate the service. We may remove content that violates these
          terms.
        </p>
      </StaticSection>

      <StaticSection heading="5. Limitation of liability" icon={<ScaleIcon />}>
        <p>
          MoonsJob is provided on an &quot;as is&quot; basis. We do not guarantee employment,
          hiring outcomes, or the accuracy of listings posted by third parties.
        </p>
      </StaticSection>

      <StaticSection heading="6. Changes to these terms" icon={<SparkIcon />}>
        <p>
          We may update these terms from time to time. Continued use of the platform after changes
          means you accept the revised terms.
        </p>
      </StaticSection>
    </StaticPageShell>
  );
}
