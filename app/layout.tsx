import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/app/globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'BeBlue - Gestao Financeira',
  description: 'Sistema de gestao financeira para campanhas de marketing e influenciadores',
  keywords: ['gestao financeira', 'campanhas', 'influenciadores', 'marketing'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className={`${inter.className} antialiased bg-[#F8FAFC] text-slate-900`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
