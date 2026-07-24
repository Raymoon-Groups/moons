import type { Metadata } from 'next';
import { StaticPageShell, StaticSection } from '@/components/static/static-page';
import { DocIcon, LockIcon, UserCheckIcon } from '@/components/static/static-icons';

export const metadata: Metadata = {
  title: 'Delete your MoonsJob account — MoonsJob',
  description:
    'How to request deletion of your MoonsJob account and associated personal data.',
};

export default function DeleteAccountPage() {
  return (
    <StaticPageShell
      eyebrow="Account"
      title="Delete your MoonsJob account"
      subtitle="Request permanent deletion of your MoonsJob account and associated personal data."
      updated="24 July 2026"
      heroIcon={<UserCheckIcon />}
    >
      <StaticSection heading="App covered by this page" icon={<DocIcon />}>
        <p>
          This page applies to the <strong>MoonsJob</strong> mobile app and the MoonsJob website
          operated by MoonsJob.
        </p>
      </StaticSection>

      <StaticSection heading="How to request account deletion" icon={<UserCheckIcon />}>
        <p>Follow these steps:</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li>
            Email{' '}
            <a
              href="mailto:privacy@moonsjob.com?subject=MoonsJob%20account%20deletion%20request"
              className="font-semibold text-moons-blue hover:underline"
            >
              privacy@moonsjob.com
            </a>{' '}
            from the same email address registered on your MoonsJob account.
          </li>
          <li>
            Use the subject line: <strong>MoonsJob account deletion request</strong>.
          </li>
          <li>
            Include your full name and confirm that you want your MoonsJob account and associated
            data deleted.
          </li>
          <li>
            We will verify ownership of the account and process your request. You will receive a
            confirmation email when deletion is complete.
          </li>
        </ol>
        <p className="mt-4">
          Typical processing time: <strong>up to 30 days</strong> after we verify your request.
        </p>
      </StaticSection>

      <StaticSection heading="What data is deleted" icon={<LockIcon />}>
        <p>When your MoonsJob account is deleted, we remove or irreversibly anonymise:</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Account credentials and login identifiers (email, authentication data)</li>
          <li>Profile information (name, headline, phone, location, skills, experience, education)</li>
          <li>Uploaded files such as resume, avatar, banner, and company logo</li>
          <li>Job applications you submitted as a candidate</li>
          <li>Jobs you posted as a recruiter (closed/removed from public listings)</li>
          <li>Network connections, connection requests, and profile visit records tied to you</li>
          <li>Messages and conversations associated with your account</li>
          <li>In-app notification records for your account</li>
        </ul>
      </StaticSection>

      <StaticSection heading="What data may be retained" icon={<DocIcon />}>
        <p>We may retain limited information when required for legitimate purposes:</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <strong>Legal / fraud prevention:</strong> records needed to investigate abuse, comply
            with law, or resolve disputes (typically retained up to 90 days, or longer if legally
            required).
          </li>
          <li>
            <strong>Backup systems:</strong> encrypted backups may keep residual copies for a short
            period until rotated (typically up to 30 days).
          </li>
          <li>
            <strong>Aggregated analytics:</strong> anonymised statistics that cannot identify you
            may be kept.
          </li>
        </ul>
        <p className="mt-4">
          After retention periods end, remaining personal data tied to your account is deleted or
          anonymised.
        </p>
      </StaticSection>

      <StaticSection heading="Contact" icon={<UserCheckIcon />}>
        <p>
          Questions about deletion or privacy:{' '}
          <a
            href="mailto:privacy@moonsjob.com"
            className="font-semibold text-moons-blue hover:underline"
          >
            privacy@moonsjob.com
          </a>{' '}
          or{' '}
          <a
            href="mailto:support@moonsjob.com"
            className="font-semibold text-moons-blue hover:underline"
          >
            support@moonsjob.com
          </a>
          .
        </p>
      </StaticSection>
    </StaticPageShell>
  );
}
