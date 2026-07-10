import {
  StaticPageScreen,
  StaticParagraph,
  StaticSection,
} from '@/components/static/static-page';
import { Text } from 'react-native';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';

function EmailRow({ label, email }: { label: string; email: string }) {
  const { colors } = useTheme();
  return (
    <Text style={[{ color: colors.muted, fontSize: 15, lineHeight: 22 }, fontStyle('regular')]}>
      {label}{' '}
      <Text style={[{ color: colors.blue }, fontStyle('semibold')]}>{email}</Text>
    </Text>
  );
}

export default function ContactScreen() {
  return (
    <StaticPageScreen
      eyebrow="Contact us"
      title="We'd love to hear from you"
      subtitle="Questions, feedback, or need a hand? Reach out and our team will get back to you as soon as possible."
    >
      <StaticSection heading="Email us">
        <EmailRow label="For general enquiries and support:" email="support@moonsjob.com" />
        <EmailRow label="For partnerships and press:" email="hello@moonsjob.com" />
      </StaticSection>

      <StaticSection heading="For employers">
        <StaticParagraph>
          Looking to hire? Create a recruiter account to post jobs and reach qualified candidates.
          For enterprise hiring plans, contact sales@moonsjob.com.
        </StaticParagraph>
      </StaticSection>

      <StaticSection heading="Office hours">
        <StaticParagraph>Our support team is available Monday to Friday, 10:00 AM to 6:00 PM IST.</StaticParagraph>
      </StaticSection>
    </StaticPageScreen>
  );
}
