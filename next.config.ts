import type { NextConfig } from "next";

const destination = process.env.API_PROXY_URL || "http://127.0.0.1:8787";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/v1/:path*", destination: `${destination}/v1/:path*` },
      { source: "/m/:path*", destination: `${destination}/m/:path*` },
      { source: "/i/:path*", destination: `${destination}/i/:path*` },
      { source: "/health", destination: `${destination}/health` },
    ];
  },
};

export default nextConfig;
