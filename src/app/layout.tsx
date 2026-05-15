import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Engli — ისწავლე ინგლისური',
  description: 'სახალისო ინგლისური ქართველი ბავშვებისთვის',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Engli'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#58CC02'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ka">
      <body className="bg-bg text-ink min-h-screen">
        <div className="mx-auto max-w-md min-h-screen flex flex-col bg-white">
          {children}
        </div>
      </body>
    </html>
  );
}
