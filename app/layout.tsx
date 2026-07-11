import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Inter, Space_Grotesk } from 'next/font/google';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
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

export const metadata: Metadata = {
  title: {
    default: 'FiyatKarşılaştır — Telefon fiyatlarını tek yerden karşılaştır',
    template: '%s | FiyatKarşılaştır',
  },
  description:
    'Trendyol, Hepsiburada, Amazon, Vatan ve N11 fiyatlarını tek ekranda karşılaştırın, en ucuzunu bulun.',
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
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
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
