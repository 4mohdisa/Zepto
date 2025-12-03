import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { AuthProvider } from '@/context/auth-context';
import { CacheProvider } from '@/context/cache-context';
import { ErrorBoundaryWrapper } from '@/components/ui/error-boundary';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <link rel="shortcut icon" href="/favicon/favicon.ico" />
        {/* CSP is now handled in next.config.js */}
      </head>
      <body
        className="antialiased"
        suppressHydrationWarning
      >
        <ClerkProvider>
          <AuthProvider>
            <ErrorBoundaryWrapper>
              <CacheProvider>
                <ErrorBoundaryWrapper>
                  {children}
                </ErrorBoundaryWrapper>
              </CacheProvider>
            </ErrorBoundaryWrapper>
          </AuthProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
