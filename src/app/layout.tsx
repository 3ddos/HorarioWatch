import type { Metadata } from 'next';
import './globals.css';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Toaster } from '@/components/ui/toaster';
import { Calendar } from 'lucide-react';
import { AuthProvider } from '@/components/layout/auth-provider';

export const metadata: Metadata = {
  title: 'HorarioWatch - AI Schedule Assistant',
  description: 'Automated work schedule extraction from emails',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 lg:hidden bg-white sticky top-0 z-10">
                <SidebarTrigger className="-ml-1 text-primary" />
                <div className="flex items-center gap-2 ml-2">
                  <div className="bg-primary p-1.5 rounded-lg">
                    <Calendar className="text-white w-4 h-4" />
                  </div>
                  <span className="font-headline font-bold text-lg tracking-tight">
                    HorarioWatch
                  </span>
                </div>
              </header>
              <main className="p-6 lg:p-10 max-w-7xl mx-auto w-full">
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
