import { OgTemplate } from "@/components/og/OgTemplate";
import { ImageResponse } from "next/og";
import { allDocs } from "content-collections";

export const alt = "Documentation | Pokétistix";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

function getDoc(slug: string, locale: string) {
  return (
    allDocs.find((doc) => doc.slug === slug && doc.locale === locale) ||
    allDocs.find((doc) => doc.slug === slug)
  );
}

export default async function Image({
  params,
}: {
  readonly params: Promise<{ readonly lang: string; readonly slug: string }>;
}) {
  const { lang, slug } = await params;
  const doc = getDoc(slug, lang);

  const title = doc?.title ? `${doc.title} | Pokétistix` : "Docs | Pokétistix";
  const subtitle = doc?.description ?? "User Guides & Feature Documentation";

  return new ImageResponse(<OgTemplate title={title} subtitle={subtitle} />, { ...size });
}
