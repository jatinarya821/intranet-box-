import './globals.css';
import Sidebar from '@/components/Sidebar';
import AlertBanner from '@/components/AlertBanner';
import BottomNav from '@/components/BottomNav';

export const metadata = {
  title: 'Offline Intranet — Emergency Portal',
  description: 'Disaster-Ready Offline Intranet in a Box for Emergency Field Operations',
  applicationName: 'IntranetBox',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'IntranetBox',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#020617',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-red-500 selection:text-white">
        {/* Global Critical Alert Bar */}
        <AlertBanner />

        {/* Core Layout Shell */}
        <div className="flex flex-1 min-h-0 relative">
          {/* Desktop Sidebar + Mobile Top Bar */}
          <Sidebar />

          {/* Main Viewport: extra bottom padding on mobile for BottomNav */}
          <main className="flex-1 p-3.5 sm:p-5 md:p-8 overflow-y-auto pb-24 md:pb-8">
            {children}
          </main>
        </div>

        {/* Mobile Sticky Bottom Tab Bar */}
        <BottomNav />
      </body>
    </html>
  );
}
