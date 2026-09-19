import { OgTemplate } from "@/components/og/OgTemplate";
import { ImageResponse } from "next/og";

export const alt = "Privacy Policy | Pokétistix";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <OgTemplate
      title="Privacy Policy | Pokétistix"
      subtitle="Information and Data Privacy Practices"
    />,
    { ...size },
  );
}
