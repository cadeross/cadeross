import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Let other devices on the tailnet load the dev server's scripts and HMR.
  allowedDevOrigins: ["cades-macbook-pro.tailf29aab.ts.net", "100.74.121.48"],
  experimental: {
    // Two root layouts (the site and the legacy tools), so 404s need their own.
    globalNotFound: true,
  },
  async redirects() {
    return [
      // About lives on the homepage.
      { source: "/about", destination: "/#about", permanent: false },
    ];
  },
};

export default nextConfig;
