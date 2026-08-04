import type { Metadata } from 'next';
import localFont from 'next/font/local';

import { Providers } from '@/components/providers';
import './globals.css';

const suisseIntl = localFont({
  src: [
    {
      path: '../fonts/SuisseIntl-Light.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../fonts/SuisseIntl-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/SuisseIntl-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
  ],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LangChain + Hugging Face AI',
  description: 'Modern real-time AI infrastructure with Convex.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={suisseIntl.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
