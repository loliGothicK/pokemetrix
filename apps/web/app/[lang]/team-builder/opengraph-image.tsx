import { OgTemplate } from "@/components/og/OgTemplate";
import { ImageResponse } from "next/og";

export const alt = "Team Builder | Pokétistix";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <OgTemplate
      title="Team Builder | Pokétistix"
      subtitle="Construct and analyze your Pokémon teams"
    />,
    { ...size },
  );
}
