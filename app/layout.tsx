import type { Metadata, Viewport } from 'next'
import './globals.css'
import PinGate from '@/components/PinGate'
import BottomNav from '@/components/BottomNav'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

export const metadata: Metadata = {
  title: 'Daily',
  description: 'Suivi sport, nutrition et habitudes',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Daily',
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1c1917',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-background text-text-primary antialiased">
        <PinGate>
          <div className="min-h-dvh pb-20">{children}</div>
          <BottomNav />
        </PinGate>
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
