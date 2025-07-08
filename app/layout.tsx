import "./globals.css";
import { AuthProvider } from '@/context/auth-context';
import { CacheProvider } from '@/context/cache-context';
import { ErrorBoundaryWrapper } from '@/components/ui/error-boundary';
import localFont from "next/font/local";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* CSP is now handled in next.config.js */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ErrorBoundaryWrapper>
          <AuthProvider>
            <CacheProvider>
              <ErrorBoundaryWrapper>
                {children}
              </ErrorBoundaryWrapper>
            </CacheProvider>
          </AuthProvider>
        </ErrorBoundaryWrapper>
      </body>
    </html>
  );
}
