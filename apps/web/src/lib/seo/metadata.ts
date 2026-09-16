import type { Metadata } from "next";

export const BASE_URL = "https://pokemetrix.mitama.io";

export type LocalizedMetadataOptions = {
  readonly path: string;
  readonly lang: string;
  readonly title: string;
  readonly description: string;
  readonly keywords?: readonly string[];
  readonly image?: string;
  readonly robots?: Metadata["robots"];
  readonly type?: "website" | "article";
};

export function createLocalizedMetadata({
  path,
  lang,
  title,
  description,
  keywords,
  image,
  robots,
  type = "website",
}: LocalizedMetadataOptions): Metadata {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const canonicalPath = normalizedPath === "/" ? "" : normalizedPath;
  const canonicalUrl = `${BASE_URL}/${lang}${canonicalPath}`;

  const isJa = lang === "ja";
  const locale = isJa ? "ja_JP" : "en_US";
  const alternateLocale = isJa ? ["en_US"] : ["ja_JP"];

  return {
    metadataBase: new URL(BASE_URL),
    title,
    description,
    keywords: keywords ? [...keywords] : undefined,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ja: `${BASE_URL}/ja${canonicalPath}`,
        en: `${BASE_URL}/en${canonicalPath}`,
        "x-default": `${BASE_URL}/en${canonicalPath}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Pokétistix",
      locale,
      alternateLocale,
      type,
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: "@mitama_rs",
      creator: "@mitama_rs",
      ...(image ? { images: [image] } : {}),
    },
    ...(robots ? { robots } : {}),
  };
}
