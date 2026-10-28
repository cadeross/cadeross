import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // About lives as a tab on the homepage.
      { source: "/about", destination: "/?section=about", permanent: false },
    ];
  },
};

export default nextConfig;
