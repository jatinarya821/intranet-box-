import localFont from 'next/font/local';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import AlertBanner from '@/components/AlertBanner';

export const metadata = {
  title: 'Offline Intranet — Emergency Portal',
  description: 'Disaster-Ready Offline Intranet in a Box',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col">
        <AlertBanner />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 md:p-6 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
