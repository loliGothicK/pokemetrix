import { OgTemplate } from "@/components/og/OgTemplate";
import { ImageResponse } from "next/og";

export const alt = "Quiz Studio | Pokétistix";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <OgTemplate title="Quiz Studio | Pokétistix" subtitle="Content studio for quizzes" />,
    { ...size },
  );
}
