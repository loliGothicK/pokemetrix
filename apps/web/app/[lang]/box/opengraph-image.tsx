import { OgTemplate } from "@/components/og/OgTemplate";
import { ImageResponse } from "next/og";

export const alt = "Pokémon Box | Pokétistix";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <OgTemplate
      title="Pokémon Box | Pokétistix"
      subtitle="Manage Trained Pokémon & Battle Readiness"
    />,
    { ...size },
  );
}
