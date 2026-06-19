import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Nav } from '@/components/Nav';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'Mold ↔ Press Compatibility',
  description: 'Determine whether a mold can be mounted on a press — fast, explainable, reliable.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans">
        <AuthProvider>
          <Nav />
          <main className="mx-auto w-full max-w-5xl px-5 pb-24 pt-8">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
