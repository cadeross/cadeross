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
      // Only Everdeck and OpenWrit have pages; the rest link out.
      { source: "/work/baylor", destination: "https://www.baylor.edu", permanent: false },
      { source: "/work/solana", destination: "https://solana.com", permanent: false },
      { source: "/harbor", destination: "https://github.com/cadeross/Harbor", permanent: false },
      { source: "/spyglass", destination: "https://github.com/cadeross/Spyglass", permanent: false },
    ];
  },
};

export default nextConfig;
