import { OgTemplate } from "@/components/og/OgTemplate";
import { ImageResponse } from "next/og";

export const alt = "Battle Analytics & Winrate Insights | Pokétistix";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <OgTemplate
      title="Battle Analytics | Pokétistix"
      subtitle="Winrate Insights and Matchup Dynamics"
    />,
    { ...size },
  );
}
