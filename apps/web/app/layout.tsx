import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import "./globals.css";
import { AppLayout } from "@/components/client/layout";
import { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Pokemetrix",
  description: "Analytics Workspace for Pokémon Battle",
};

export default function RootLayout({
  children,
}: Readonly<{
  readonly children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <AppRouterCacheProvider>
          <AppLayout>
            {children}
            <Analytics />
          </AppLayout>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
