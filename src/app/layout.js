import './globals.css';
import Sidebar from '@/components/Sidebar';
import AlertBanner from '@/components/AlertBanner';
import BottomNav from '@/components/BottomNav';
import ThemeProvider from '@/components/ThemeProvider';

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
    <html lang="en" className="dark h-full" suppressHydrationWarning>
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-red-500 selection:text-white w-full overflow-x-hidden">
        <ThemeProvider>
          {/* Global Critical Alert Bar */}
          <AlertBanner />

          {/* Core Layout Shell: flex-col on mobile, flex-row on desktop */}
          <div className="flex flex-col md:flex-row flex-1 min-h-0 w-full relative">
            {/* Desktop Sidebar + Mobile Top Bar */}
            <Sidebar />

            {/* Main Viewport: min-w-0 prevents flexbox horizontal blowout */}
            <main className="flex-1 min-w-0 w-full p-3 sm:p-5 md:p-8 overflow-y-auto overflow-x-hidden pb-24 md:pb-8">
              {children}
            </main>
          </div>

          {/* Mobile Sticky Bottom Tab Bar */}
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
