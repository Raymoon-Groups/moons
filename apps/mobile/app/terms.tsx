import {
  StaticBulletList,
  StaticPageScreen,
  StaticParagraph,
  StaticSection,
} from '@/components/static/static-page';

export default function TermsScreen() {
  return (
    <StaticPageScreen
      eyebrow="Legal"
      title="Terms & Conditions"
      subtitle="Please read these terms carefully. By using MoonsJob, you agree to the terms set out below."
      updated="8 July 2026"
    >
      <StaticSection heading="1. Acceptance of terms">
        <StaticParagraph>
          By accessing or using MoonsJob, you agree to be bound by these Terms & Conditions and
          our Privacy Policy. If you do not agree, please do not use the platform.
        </StaticParagraph>
      </StaticSection>

      <StaticSection heading="2. Your account">
        <StaticParagraph>
          You are responsible for maintaining the confidentiality of your account credentials and
          for all activity that occurs under your account. You must provide accurate and complete
          information when creating a profile.
        </StaticParagraph>
      </StaticSection>

      <StaticSection heading="3. Acceptable use">
        <StaticBulletList
          items={[
            'Do not post false, misleading, or fraudulent job listings or profiles.',
            'Do not harass, spam, or impersonate other users.',
            'Do not attempt to disrupt or gain unauthorized access to the platform.',
          ]}
        />
      </StaticSection>

      <StaticSection heading="4. Content">
        <StaticParagraph>
          You retain ownership of content you submit but grant MoonsJob a license to display and
          distribute it as needed to operate the service. We may remove content that violates these
          terms.
        </StaticParagraph>
      </StaticSection>

      <StaticSection heading="5. Limitation of liability">
        <StaticParagraph>
          MoonsJob is provided on an &quot;as is&quot; basis. We do not guarantee employment,
          hiring outcomes, or the accuracy of listings posted by third parties.
        </StaticParagraph>
      </StaticSection>

      <StaticSection heading="6. Changes to these terms">
        <StaticParagraph>
          We may update these terms from time to time. Continued use of the platform after changes
          means you accept the revised terms.
        </StaticParagraph>
      </StaticSection>
    </StaticPageScreen>
  );
}
