import {
  StaticBulletList,
  StaticPageScreen,
  StaticParagraph,
  StaticSection,
} from '@/components/static/static-page';
import { Text } from 'react-native';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';

export default function FraudAlertScreen() {
  const { colors } = useTheme();

  return (
    <StaticPageScreen
      eyebrow="Stay safe"
      title="Fraud Alert"
      subtitle="MoonsJob never asks candidates to pay money for a job. Learn how to recognise and report scams."
    >
      <StaticSection heading="MoonsJob will never ask you to pay">
        <StaticParagraph>
          Genuine employers do not charge candidates for job offers, interviews, training, or
          registration. If someone asks you to pay money to get a job, it is a scam.
        </StaticParagraph>
      </StaticSection>

      <StaticSection heading="Warning signs of a job scam">
        <StaticBulletList
          items={[
            'Requests for payment, security deposits, or bank/UPI details.',
            'Offers that seem too good to be true or promise guaranteed jobs.',
            'Communication only through personal email or messaging apps.',
            'Pressure to act immediately or share sensitive documents.',
            'Poorly written offer letters or unofficial company domains.',
          ]}
        />
      </StaticSection>

      <StaticSection heading="How to protect yourself">
        <StaticBulletList
          items={[
            'Never share your passwords, OTPs, or financial information.',
            'Verify the company through its official website and channels.',
            'Do not transfer money to anyone claiming to offer a job.',
          ]}
        />
      </StaticSection>

      <StaticSection heading="Report suspicious activity">
        <Text style={[{ color: colors.muted, fontSize: 15, lineHeight: 22 }, fontStyle('regular')]}>
          If you come across a suspicious job posting or message, report it to us at{' '}
          <Text style={[{ color: colors.blue }, fontStyle('semibold')]}>fraud@moonsjob.com</Text>.
          Your reports help keep the community safe.
        </Text>
      </StaticSection>
    </StaticPageScreen>
  );
}
