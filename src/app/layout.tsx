
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Header } from '@/components/header';
import { AuthProvider } from '@/hooks/use-auth';
import { Footer } from '@/components/footer';
import { ZipCodeProvider } from '@/hooks/useZipCode';
import { ZipCodeBanner } from '@/components/ui/zip-code-banner';

export const metadata: Metadata = {
  title: 'eGp Prototype',
  description: 'A prototype for eGp.',
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
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <ZipCodeProvider>
            <div className="relative flex min-h-screen flex-col">
              <Header />
              {/* This banner will appear only when the zip code is not set */}
              <ZipCodeBanner /> 
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
            <Toaster />
          </ZipCodeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
