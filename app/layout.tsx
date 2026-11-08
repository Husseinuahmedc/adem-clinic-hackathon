import type { Metadata } from 'next';
import { IBM_Plex_Sans_Arabic, Jost } from 'next/font/google';
import './globals.css';
import { clinicDisplayName } from '../lib/clinic-content';

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const jost = Jost({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-brand',
  display: 'swap',
});

export const metadata: Metadata = {
  title: `${clinicDisplayName} | حجز موعد`,
  description: 'حجز موعد في عيادة أَديم',
  icons: { icon: '/adem-logomark.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${ibmPlexSansArabic.variable} ${jost.variable}`}>{children}</body>
    </html>
  );
}
