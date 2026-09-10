import type { Metadata } from 'next';
import Link from 'next/link';
import { StaticPageShell, StaticSection } from '@/components/static/static-page';
import { DocIcon, LockIcon, UserCheckIcon } from '@/components/static/static-icons';

export const metadata: Metadata = {
  title: 'Delete your MoonsJob account — MoonsJob',
  description:
    'How to delete your MoonsJob account and associated personal data from the app or website.',
};

export default function DeleteAccountPage() {
  return (
    <StaticPageShell
      eyebrow="Account"
      title="Delete your MoonsJob account"
      subtitle="Permanently delete your MoonsJob account and associated personal data."
      updated="8 September 2026"
      heroIcon={<UserCheckIcon />}
    >
      <StaticSection heading="App covered by this page" icon={<DocIcon />}>
        <p>
          This page applies to the <strong>MoonsJob</strong> mobile app and the MoonsJob website
          operated by MoonsJob.
        </p>
      </StaticSection>

      <StaticSection heading="Delete in the app or website" icon={<UserCheckIcon />}>
        <p>If you are signed in, you can delete your account yourself:</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li>
            Open{' '}
            <Link href="/settings/security" className="font-semibold text-moons-blue hover:underline">
              Settings → Security
            </Link>
            .
          </li>
          <li>
            Scroll to <strong>Delete account</strong>.
          </li>
          <li>
            Confirm by typing <strong>DELETE</strong>
            {'. '}
            If you signed up with a password, enter your current password as well.
          </li>
          <li>Tap <strong>Delete my account</strong>. Deletion is immediate and permanent.</li>
        </ol>
        <p className="mt-4">
          <Link
            href="/settings/security"
            className="inline-flex rounded-lg bg-moons-blue px-5 py-2.5 text-sm font-semibold !text-white transition hover:bg-moons-blue-dark"
          >
            Go to Security settings
          </Link>
        </p>
      </StaticSection>

      <StaticSection heading="Need help instead?" icon={<UserCheckIcon />}>
        <p>
          If you cannot sign in, email{' '}
          <a
            href="mailto:support@moonsjob.com?subject=MoonsJob%20account%20deletion%20request"
            className="font-semibold text-moons-blue hover:underline"
          >
            support@moonsjob.com
          </a>{' '}
          from your registered address with subject{' '}
          <strong>MoonsJob account deletion request</strong>. We will verify ownership and process
          the request (typically up to 30 days).
        </p>
      </StaticSection>

      <StaticSection heading="What data is deleted" icon={<LockIcon />}>
        <p>When your MoonsJob account is deleted, we remove or irreversibly anonymise:</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Account credentials and login identifiers (email, authentication data)</li>
          <li>Profile information (name, headline, phone, location, skills, experience, education)</li>
          <li>Uploaded files such as resume, avatar, banner, and company logo</li>
          <li>Job applications you submitted as a candidate</li>
          <li>Jobs you posted as a recruiter (removed from public listings)</li>
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
      </StaticSection>

      <StaticSection heading="Contact" icon={<UserCheckIcon />}>
        <p>
          Questions about deletion or privacy:{' '}
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
