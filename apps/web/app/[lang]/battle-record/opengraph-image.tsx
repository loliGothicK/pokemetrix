import { OgTemplate } from "@/components/og/OgTemplate";
import { ImageResponse } from "next/og";

export const alt = "Battle Record & Match Logging | Pokétistix";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <OgTemplate
      title="Battle Record | Pokétistix"
      subtitle="Track, Log, and Analyze Your Battles"
    />,
    { ...size },
  );
}
