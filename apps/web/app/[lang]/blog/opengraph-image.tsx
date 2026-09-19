import { OgTemplate } from "@/components/og/OgTemplate";
import { ImageResponse } from "next/og";

export const alt = "Blog | Pokétistix";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <OgTemplate title="Blog | Pokétistix" subtitle="News, Updates & Technical Deep Dives" />,
    { ...size },
  );
}
