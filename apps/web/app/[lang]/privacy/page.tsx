import type { Metadata } from "next";
import PrivacyClient from "./PrivacyClient";
import { createLocalizedMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const isJa = lang === "ja";

  return createLocalizedMetadata({
    path: "/privacy",
    lang,
    title: isJa ? "プライバシーポリシー | Pokétistix" : "Privacy Policy | Pokétistix",
    description: isJa
      ? "Pokétistix のプライバシーポリシー。ユーザー情報の保護・管理方針。"
      : "Privacy Policy for Pokétistix application and user data management.",
  });
}

export default function PrivacyPolicyPage() {
  return <PrivacyClient />;
}
