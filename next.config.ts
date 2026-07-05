import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
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
