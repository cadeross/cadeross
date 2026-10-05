import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // The archive page was retired; send old links home.
    return [{ source: "/archive", destination: "/", permanent: true }];
  },
};

export default nextConfig;
