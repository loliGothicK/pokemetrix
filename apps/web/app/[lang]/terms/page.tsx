import type { Metadata } from "next";
import TermsClient from "./TermsClient";
import { createLocalizedMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const isJa = lang === "ja";

  return createLocalizedMetadata({
    path: "/terms",
    lang,
    title: isJa ? "利用規約 | Pokétistix" : "Terms of Service | Pokétistix",
    description: isJa
      ? "Pokétistix の利用規約。免責事項、禁止行為、サービスの提供条件。"
      : "Terms of Service and disclaimer for the Pokétistix application.",
  });
}

export default function TermsOfServicePage() {
  return <TermsClient />;
}
