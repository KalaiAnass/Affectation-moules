import type { Metadata } from 'next';
import { Archivo, Inter } from 'next/font/google';
import './globals.css';
import { Nav } from '@/components/Nav';
import { I18nProvider } from '@/lib/i18n';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
  weight: ['600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'FORVIA · Mold ↔ Press Compatibility',
  description: 'Determine whether a mold can be mounted on a press — fast, explainable, reliable.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${archivo.variable}`}>
      <body className="min-h-screen font-sans">
        <I18nProvider>
          <Nav />
          <main className="mx-auto w-full max-w-5xl px-5 pb-24 pt-8">{children}</main>
        </I18nProvider>
      </body>
    </html>
  );
}
