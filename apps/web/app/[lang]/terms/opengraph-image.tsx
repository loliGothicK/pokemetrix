import { OgTemplate } from "@/components/og/OgTemplate";
import { ImageResponse } from "next/og";

export const alt = "Terms of Service | Pokétistix";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <OgTemplate title="Terms of Service | Pokétistix" subtitle="Terms and Conditions of Use" />,
    { ...size },
  );
}
