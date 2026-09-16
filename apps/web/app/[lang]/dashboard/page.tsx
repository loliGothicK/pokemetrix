import type { Metadata } from "next";
import DashboardPage from "@/components/client/dashboard/DashboardPage";

import { BASE_URL } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: "Dashboard | Pokétistix",
  description: "Custom analytics dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <DashboardPage />;
}
