import { InstallPrompt, OfflineBanner } from "@/components/InstallPrompt";
import SyncIndicator from "@/components/SyncIndicator";

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata = {
  title: 'Lift Log - מעקב אימונים',
  description: 'אפליקציית מעקב אימונים',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LiftLog',
  },
  other: {
    'theme-color': '#0a0a0a',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="LiftLog" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body style={{ margin: 0, backgroundColor: '#0f0f0f', overflowX: 'hidden' }}>
        <OfflineBanner />
        <SyncIndicator />
        {children}
        <InstallPrompt />
      </body>
    </html>
  )
}
