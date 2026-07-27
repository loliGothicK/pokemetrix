import { ImageLoaderProps } from "next/image";

export const wsrvLoader = ({ src, width, quality }: ImageLoaderProps) => {
  const encodedSrc = encodeURIComponent(src);
  return `https://wsrv.nl/?url=${encodedSrc}&w=${width}&q=${quality || 75}`;
};

export default wsrvLoader;
