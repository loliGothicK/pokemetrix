import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import "./globals.css";
import { AppLayout } from "@/components/client/layout";
import { ContentLayoutProvider } from "@/components/client/content/ContentLayoutContext";
import { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";

const siteName = "Pokemetrix";
const description = "Analytics Workspace for Pokémon Battle";
const url = "https://pokemetrix.mitama.io";

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title: {
    default: siteName,
    /** `next-seo`の`titleTemplate`に相当する機能 */
    template: `%s - ${siteName}`,
  },
  description,
  openGraph: {
    title: siteName,
    description,
    url,
    siteName,
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description,
    site: "@mitama_rs",
    creator: "@mitama_rs",
  },
  alternates: {
    canonical: url,
  },
};

import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { SuppressCancelation } from "@/components/client/SuppressCancelation";

export default function RootLayout({
  children,
}: Readonly<{
  readonly children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <InitColorSchemeScript />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <SuppressCancelation />
        <AppRouterCacheProvider>
          <ContentLayoutProvider>
            <AppLayout>
              {children}
              <Analytics />
            </AppLayout>
          </ContentLayoutProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
