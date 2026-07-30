import { Linking } from 'react-native';
import {
  StaticBulletList,
  StaticEmailLink,
  StaticPageScreen,
  StaticParagraph,
  StaticSection,
} from '@/components/static/static-page';
import { PrimaryButton } from '@/components/ui';

export default function DeleteAccountScreen() {
  return (
    <StaticPageScreen
      eyebrow="Account"
      title="Delete your MoonsJob account"
      subtitle="Request permanent deletion of your MoonsJob account and associated personal data."
      updated="24 July 2026"
    >
      <StaticSection heading="App covered by this page">
        <StaticParagraph>
          This page applies to the MoonsJob mobile app and the MoonsJob website operated by MoonsJob.
        </StaticParagraph>
      </StaticSection>

      <StaticSection heading="How to request account deletion">
        <StaticParagraph>Follow these steps:</StaticParagraph>
        <StaticBulletList
          items={[
            'Email privacy@moonsjob.com from the same email address registered on your MoonsJob account.',
            'Use the subject line: MoonsJob account deletion request.',
            'Include your full name and confirm that you want your MoonsJob account and associated data deleted.',
            'We will verify ownership of the account and process your request. You will receive a confirmation email when deletion is complete.',
          ]}
        />
        <StaticParagraph>Typical processing time: up to 30 days after we verify your request.</StaticParagraph>
        <PrimaryButton
          label="Email privacy@moonsjob.com"
          onPress={() => {
            void Linking.openURL(
              'mailto:privacy@moonsjob.com?subject=MoonsJob%20account%20deletion%20request',
            );
          }}
        />
      </StaticSection>

      <StaticSection heading="What data is deleted">
        <StaticParagraph>
          When your MoonsJob account is deleted, we remove or irreversibly anonymise:
        </StaticParagraph>
        <StaticBulletList
          items={[
            'Account credentials and login identifiers (email, authentication data)',
            'Profile information (name, headline, phone, location, skills, experience, education)',
            'Uploaded files such as resume, avatar, banner, and company logo',
            'Job applications you submitted as a candidate',
            'Jobs you posted as a recruiter (closed/removed from public listings)',
            'Network connections, connection requests, and profile visit records tied to you',
            'Messages and conversations associated with your account',
            'In-app notification records for your account',
          ]}
        />
      </StaticSection>

      <StaticSection heading="What data may be retained">
        <StaticParagraph>
          We may retain limited information when required for legitimate purposes:
        </StaticParagraph>
        <StaticBulletList
          items={[
            'Legal / fraud prevention records (typically up to 90 days, or longer if legally required)',
            'Encrypted backups for a short rotation period (typically up to 30 days)',
            'Aggregated analytics that cannot identify you',
          ]}
        />
      </StaticSection>

      <StaticSection heading="Contact">
        <StaticParagraph>
          Questions about deletion or privacy: privacy@moonsjob.com or support@moonsjob.com.
        </StaticParagraph>
        <StaticEmailLink email="privacy@moonsjob.com" />
      </StaticSection>
    </StaticPageScreen>
  );
}
