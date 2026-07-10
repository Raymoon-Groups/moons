import type { Metadata } from 'next';
import { StaticPageShell, StaticSection } from '@/components/static/static-page';
import {
  AlertIcon,
  LockIcon,
  MailIcon,
  ShieldIcon,
} from '@/components/static/static-icons';

export const metadata: Metadata = {
  title: 'Fraud Alert — MoonsJob',
  description:
    'Stay safe from job scams. Learn how to spot fraudulent offers and report suspicious activity on MoonsJob.',
};

export default function FraudAlertPage() {
  return (
    <StaticPageShell
      eyebrow="Stay safe"
      title="Fraud Alert"
      subtitle="MoonsJob never asks candidates to pay money for a job. Learn how to recognise and report scams."
      heroIcon={<ShieldIcon />}
    >
      <StaticSection heading="MoonsJob will never ask you to pay" icon={<AlertIcon />}>
        <p>
          Genuine employers do not charge candidates for job offers, interviews, training, or
          registration. If someone asks you to pay money to get a job, it is a scam.
        </p>
      </StaticSection>

      <StaticSection heading="Warning signs of a job scam" icon={<AlertIcon />}>
        <ul className="list-disc space-y-2 pl-5">
          <li>Requests for payment, security deposits, or bank/UPI details.</li>
          <li>Offers that seem too good to be true or promise guaranteed jobs.</li>
          <li>Communication only through personal email or messaging apps.</li>
          <li>Pressure to act immediately or share sensitive documents.</li>
          <li>Poorly written offer letters or unofficial company domains.</li>
        </ul>
      </StaticSection>

      <StaticSection heading="How to protect yourself" icon={<LockIcon />}>
        <ul className="list-disc space-y-2 pl-5">
          <li>Never share your passwords, OTPs, or financial information.</li>
          <li>Verify the company through its official website and channels.</li>
          <li>Do not transfer money to anyone claiming to offer a job.</li>
        </ul>
      </StaticSection>

      <StaticSection heading="Report suspicious activity" icon={<MailIcon />}>
        <p>
          If you come across a suspicious job posting or message, report it to us at{' '}
          <a
            href="mailto:fraud@moonsjob.com"
            className="font-semibold text-moons-blue hover:underline"
          >
            fraud@moonsjob.com
          </a>
          . Your reports help keep the community safe.
        </p>
      </StaticSection>
    </StaticPageShell>
  );
}
