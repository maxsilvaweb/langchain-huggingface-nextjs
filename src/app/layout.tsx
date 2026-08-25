import type { Metadata } from 'next';
import localFont from 'next/font/local';

import { Providers } from '@/components/providers';
import { APP_DESCRIPTION, APP_NAME } from '@/lib/locale';
import './globals.css';

export const dynamic = 'force-dynamic';

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
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={suisseIntl.className} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
