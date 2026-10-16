import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { getSite } from "@/lib/server-api";
import { StoreProvider } from "@/lib/store";
import { AnnouncementBar, Header, Footer, CartDrawer, MobileTabBar } from "@/components/organisms";
import "./globals.css";

const heading = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const body = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: {
      default: site.seo.defaultTitle || site.name,
      template: `%s | ${site.name}`,
    },
    description: site.seo.defaultDescription,
    openGraph: {
      siteName: site.name,
      images: site.seo.ogImage ? [site.seo.ogImage] : [],
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const site = await getSite();

  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`}>
      <body className="flex min-h-screen flex-col font-body antialiased">
        <StoreProvider>
          {site.announcements.length > 0 && (
            <AnnouncementBar messages={site.announcements} />
          )}
          <Header siteName={site.name} navigation={site.navigation} />

          <main className="flex-1">{children}</main>

          <Footer site={site} />
          <CartDrawer freeShippingThreshold={site.freeShippingThreshold} />
          <MobileTabBar />
        </StoreProvider>
      </body>
    </html>
  );
}
