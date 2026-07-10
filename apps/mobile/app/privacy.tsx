import {
  StaticBulletList,
  StaticPageScreen,
  StaticParagraph,
  StaticSection,
} from '@/components/static/static-page';
import { Text } from 'react-native';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';

export default function PrivacyScreen() {
  const { colors } = useTheme();

  return (
    <StaticPageScreen
      eyebrow="Legal"
      title="Privacy Policy"
      subtitle="Your privacy matters. This policy explains what data we collect and how we use and protect it."
      updated="8 July 2026"
    >
      <StaticSection heading="1. Information we collect">
        <StaticBulletList
          items={[
            'Account details such as your name, email address, and password.',
            'Profile information you provide, including your resume, skills, and experience.',
            'Usage data such as pages viewed and actions taken on the platform.',
          ]}
        />
      </StaticSection>

      <StaticSection heading="2. How we use your information">
        <StaticParagraph>
          We use your information to operate the platform, match you with relevant jobs or
          candidates, enable messaging, and improve our services. We do not sell your personal data.
        </StaticParagraph>
      </StaticSection>

      <StaticSection heading="3. Sharing">
        <StaticParagraph>
          Profile information you choose to make visible may be shown to recruiters and other users.
          We share data with service providers only as needed to run the platform, under
          appropriate safeguards.
        </StaticParagraph>
      </StaticSection>

      <StaticSection heading="4. Data security">
        <StaticParagraph>
          We use industry-standard measures to protect your data. However, no method of transmission
          over the internet is completely secure, and we cannot guarantee absolute security.
        </StaticParagraph>
      </StaticSection>

      <StaticSection heading="5. Your rights">
        <Text style={[{ color: colors.muted, fontSize: 15, lineHeight: 22 }, fontStyle('regular')]}>
          You can access, update, or delete your profile information at any time from your account
          settings. To request full account deletion, contact{' '}
          <Text style={[{ color: colors.blue }, fontStyle('semibold')]}>privacy@moonsjob.com</Text>.
        </Text>
      </StaticSection>
    </StaticPageScreen>
  );
}
