import './globals.css';
import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import SharedChatbot from '../components/chat/SharedChatbot';
import { PageStateProvider } from '../lib/PageStateContext';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata = {
  title: 'Lifewood Finance AI',
  description: 'Manage scanned Google Drive finance workspaces with Lifewood branding',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon.ico' },
    ],
    apple: [{ url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' }],
  },
} satisfies Metadata;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={manrope.className}>
        <PageStateProvider>
          {children}
          <SharedChatbot />
        </PageStateProvider>
      </body>
    </html>
  );
}
