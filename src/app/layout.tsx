import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Engli — ისწავლე ინგლისური',
  description: 'სახალისო ინგლისური ქართველი ბავშვებისთვის',
  manifest: '/manifest.json',
  applicationName: 'Engli',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Engli',
    startupImage: ['/icon-512.png']
  },
  formatDetection: {
    telephone: false
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [{ url: '/icon-192.png', sizes: '192x192' }]
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#58CC02',
  viewportFit: 'cover'
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
