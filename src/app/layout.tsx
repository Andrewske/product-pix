import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { Toaster } from "@/components/ui/sonner";
import { ClientProviders } from "@/components/providers/client-providers";
import { CookieConsentProvider } from "@/components/cookie-consent";
import { CookieConsentBanner } from "@/components/cookie-consent";
import { AnalyticsScripts } from "@/components/analytics";

const fontDisplay = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });
const fontBody = Inter({ subsets: ["latin"], variable: "--font-body" });

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
    <html lang="en" suppressHydrationWarning style={{ scrollBehavior: 'smooth' }}>
      <body className={`${fontDisplay.variable} ${fontBody.variable} font-sans antialiased`}>
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
