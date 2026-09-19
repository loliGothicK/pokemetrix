import { OgTemplate } from "@/components/og/OgTemplate";
import { ImageResponse } from "next/og";

export const alt = "Pokémon Damage Calculator | Pokétistix";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <OgTemplate
      title="Damage Calculator | Pokétistix"
      subtitle="Ultra-Fast Wasm Pokémon Damage Calculator"
    />,
    { ...size },
  );
}
