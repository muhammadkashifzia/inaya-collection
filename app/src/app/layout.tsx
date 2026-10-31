import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { Suspense } from "react";
import { ServiceWorkerRegister } from "@/components/atoms";
import { AnnouncementBar, CartDrawer, Footer, Header, MobileTabBar, NewsletterPopup, ServiceHighlights, SocialProofToast } from "@/components/organisms";
import { StoreProvider } from "@/context/StoreProvider";
import { ToastProvider } from "@/context/ToastContext";
import { getSite } from "@/lib/data";
import { jsonLdString, organizationJsonLd, siteUrl, webSiteJsonLd } from "@/lib/seo";
import "./globals.css";

const body = Jost({ subsets: ["latin"], variable: "--font-body" });
const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display" });

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: site.seo.defaultTitle || `${site.name} | ${site.tagline}`, template: `%s | ${site.name}` },
    description: site.seo.defaultDescription || site.about,
    openGraph: { siteName: site.name, type: "website", images: site.seo.ogImage ? [site.seo.ogImage] : undefined },
    alternates: { canonical: "/" },
    applicationName: site.name,
    appleWebApp: { capable: true, title: site.name, statusBarStyle: "default" },
    icons: {
      // Browser tab / address-bar icon uses the same artwork as the installed PWA.
      icon: [
        { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0b1d36",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const site = await getSite();
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(organizationJsonLd(site)) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(webSiteJsonLd(site)) }} />
      </head>
      <body className="min-h-screen" suppressHydrationWarning>
        <ToastProvider>
          <StoreProvider>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[60] focus:bg-white focus:p-3">
            Skip to content
          </a>
          <AnnouncementBar messages={site.announcements} />
          {/* Header/tab bar read the pathname, which is request-time data on dynamic routes. */}
          <Suspense fallback={<div className="h-16 border-b border-line bg-white md:h-20" aria-hidden="true" />}>
            <Header siteName={site.name} logoType={site.logoType} logoUrl={site.logoUrl} navigation={site.navigation} />
          </Suspense>
          <main id="main">{children}</main>
          <ServiceHighlights freeShippingThreshold={site.freeShippingThreshold} />
          <Footer site={site} />
          <Suspense fallback={null}>
            <MobileTabBar />
          </Suspense>
          <CartDrawer freeShippingThreshold={site.freeShippingThreshold} />
          <NewsletterPopup />
          <SocialProofToast />
        </StoreProvider>
        </ToastProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
