import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https" as const,
        hostname: "archives.bulbagarden.net",
        port: "",
        pathname: "/wiki/**",
        search: "",
      },
      {
        protocol: "https" as const,
        hostname: "championsbattledata.com",
        port: "",
        pathname: "/pokemon_champions_assets/**/*.png",
        search: "",
      },
    ],
  },
};

export default nextConfig;
