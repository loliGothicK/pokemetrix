import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import "./globals.css";
import { AppLayout } from "@/components/client/layout";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Pokemetrix",
  description: "Pokemon analytics workspace built with Next.js and MUI",
};

export default function RootLayout({
  children,
}: Readonly<{
  readonly children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <AppLayout>{children}</AppLayout>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
