import type { Metadata } from "next";
import { Figtree, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { Toaster } from "@/components/ui/sonner";
import { ClientProviders } from "@/components/providers/client-providers";
import { CookieConsentProvider, CookieConsentBanner } from "@/components/cookie-consent";
import { AnalyticsScripts } from "@/components/analytics";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });
const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: 'ProductPix - AI Product Photo Generator',
  description: 'Generate professional product photos with AI',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={figtree.variable} suppressHydrationWarning style={{ scrollBehavior: 'smooth' }}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClientProviders>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <CookieConsentProvider>
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
              <CookieConsentBanner />
              <Toaster position="bottom-right" />
              <AnalyticsScripts />
            </CookieConsentProvider>
          </ThemeProvider>
        </ClientProviders>
      </body>
    </html>
  );
}
