import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Inter, Space_Grotesk } from 'next/font/google';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import CompareTray from '@/components/CompareTray';
import { siteUrl } from '@/lib/seo';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'latin-ext'],
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin', 'latin-ext'],
  weight: ['500', '600', '700'],
});

const plexMono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  subsets: ['latin', 'latin-ext'],
  weight: ['500', '600'],
});

const DEFAULT_TITLE = 'FiyatKarşılaştır — Binlerce üründe en ucuzunu tek ekranda bul';
const DEFAULT_DESCRIPTION =
  'Trendyol, Hepsiburada, Amazon, Vatan Bilgisayar ve N11 fiyatlarını elektronikten modaya, ev & yaşamdan süpermarkete tek ekranda karşılaştırın, en ucuzunu bulun.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: DEFAULT_TITLE,
    template: '%s | FiyatKarşılaştır',
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: 'FiyatKarşılaştır',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: 'summary',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${plexMono.variable} bg-surface-alt font-sans text-text antialiased`}
      >
        <Navbar />
        <main className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-8">{children}</main>
        <CompareTray />
        <footer className="mt-12 border-t border-border py-8 text-center text-xs text-muted">
          <p>
            Fiyatlar günde bir kez ilgili sitelerden otomatik derlenir; satın alma öncesi güncel
            fiyatı satıcı sitesinde doğrulayın.
          </p>
          <Link href="/admin" className="mt-2 inline-block hover:text-primary">
            Scraping logları
          </Link>
        </footer>
      </body>
    </html>
  );
}
