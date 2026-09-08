import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * Web font faces use the SAME names as native Expo font keys
 * (Manrope_700Bold, SpaceGrotesk_500Medium, …) so theme.fonts.* works on web.
 */
const FONT_FACES = `
@font-face {
  font-family: 'Manrope_400Regular';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/manrope/v20/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk79FO_F.ttf) format('truetype');
}
@font-face {
  font-family: 'Manrope_500Medium';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/manrope/v20/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk7PFO_F.ttf) format('truetype');
}
@font-face {
  font-family: 'Manrope_600SemiBold';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/manrope/v20/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk4jE-_F.ttf) format('truetype');
}
@font-face {
  font-family: 'Manrope_700Bold';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/manrope/v20/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk4aE-_F.ttf) format('truetype');
}
@font-face {
  font-family: 'Manrope_800ExtraBold';
  font-style: normal;
  font-weight: 800;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/manrope/v20/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk59E-_F.ttf) format('truetype');
}
@font-face {
  font-family: 'SpaceGrotesk_500Medium';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/spacegrotesk/v22/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj7aUUsj.ttf) format('truetype');
}
@font-face {
  font-family: 'SpaceGrotesk_600SemiBold';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/spacegrotesk/v22/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj42Vksj.ttf) format('truetype');
}
@font-face {
  font-family: 'SpaceGrotesk_700Bold';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/spacegrotesk/v22/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj4PVksj.ttf) format('truetype');
}
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <ScrollViewStyleReset />
        <style>{`
          ${FONT_FACES}

          html, body, #root { height: 100%; }
          body {
            overflow: hidden;
            background: #f4f7fb;
            font-family: Manrope_400Regular, Manrope, system-ui, sans-serif;
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
            letter-spacing: 0.2px;
          }
          @media (prefers-color-scheme: dark) {
            body { background: #080d18; }
          }
          #root { display: flex; flex: 1; }

          /* RN-web Text defaults when no fontFamily is set */
          [data-testid], div, span, p, input, textarea, button {
            font-family: inherit;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
