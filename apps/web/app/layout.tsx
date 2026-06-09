import type { Metadata } from 'next';
import { Caveat, Plus_Jakarta_Sans } from 'next/font/google';
import { AppShell } from '@/components/app-shell';
import { Providers } from '@/components/providers';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta',
  subsets: ['latin'],
  display: 'swap',
});

const caveat = Caveat({
  variable: '--font-caveat',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'MoonsJob — Jobs, Network & Career Growth',
  description:
    'Discover jobs, build your professional profile, and connect with recruiters on MoonsJob — your career platform.',
  icons: {
    icon: '/moonsjob_logo.png',
    apple: '/moonsjob_logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${caveat.variable} h-full font-sans antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#f7f8fa] text-moons-navy">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
